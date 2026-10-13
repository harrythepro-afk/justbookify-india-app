/**
 * The one GraphQL transport for Shopify's APIs (D-126): the Storefront client
 * (src/shopify/client.ts, D-056) and the Customer Account API client
 * (src/customerAccountApi/client.ts) both send their requests through `executeGraphql`. It holds
 * the rules of D-057 and nothing specific to either API: each attempt times out after 15 seconds,
 * one call (retries and waits included) ends within 30 seconds, queries are retried after network
 * trouble, timeouts, throttling and HTTP 500, 502, 503 and 504, at most twice with full-jitter
 * backoff and any `Retry-After` up to 10 seconds; mutations are never retried.
 *
 * Every failure becomes the caller's own error type, made by `makeError` from a fixed kind, the
 * operation name, the HTTP status and Shopify's upper-case codes only. Nothing is logged, and the
 * underlying fetch error, the response text and Shopify's messages are never passed on.
 */

import { safeShopifyCodes } from '@/shopify/errors';

/** Longest wait for one attempt. */
export const ATTEMPT_TIMEOUT_MS = 15_000;
/** Longest time for one call, retries and waits included (D-057). */
export const CALL_TIME_LIMIT_MS = 30_000;
/** Retries after the first attempt, for queries only. */
export const MAX_QUERY_RETRIES = 2;
const BACKOFF_BASE_MS = 500;
const BACKOFF_CAP_MS = 4_000;
/** A longer Retry-After ends the call instead of waiting. */
const RETRY_AFTER_CAP_MS = 10_000;
/** No retry starts with less time than this left after its wait. */
const MIN_TIME_FOR_RETRY_MS = 2_000;

export type TransportErrorKind =
  | 'no-network'
  | 'timeout'
  | 'cancelled'
  | 'throttled'
  | 'http-error'
  | 'invalid-response'
  | 'graphql-error';

export type TransportErrorDetails = {
  readonly operationName: string;
  readonly status?: number;
  readonly codes?: readonly string[];
};

/** What the transport needs from a caller's error: whether a query may try again after it. */
export type RetryableError = Error & { readonly retryable: boolean };

export type GraphqlRequest = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  /** The JSON body: `{ query, variables }`. */
  readonly body: string;
};

export type GraphqlCallOptions<E extends RetryableError> = {
  readonly operation: 'query' | 'mutation';
  readonly operationName: string;
  /** Cancels the call, including a wait between retries; it then fails as `cancelled`. */
  readonly signal?: AbortSignal;
  /** The time by which the whole call must end; defaults to now + CALL_TIME_LIMIT_MS. */
  readonly deadline?: number;
  readonly makeError: (kind: TransportErrorKind, details: TransportErrorDetails) => E;
};

const OPERATION_NAME = /^\s*(?:#graphql\s+)?(?:query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)/;

/** The operation's own name, from our source. Operations are always named (D-054). */
export function operationNameOf(document: string): string {
  return OPERATION_NAME.exec(document)?.[1] ?? 'UnnamedOperation';
}

type AttemptResult<E> =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly error: E; readonly retryAfterMs?: number };

/**
 * Sends one GraphQL operation, with retries for queries (D-057). Resolves to the response's
 * `data` object; rejects with the caller's error type.
 */
export async function executeGraphql<E extends RetryableError>(
  request: GraphqlRequest,
  options: GraphqlCallOptions<E>,
): Promise<unknown> {
  const { operation, operationName, signal, makeError } = options;
  const deadline = options.deadline ?? Date.now() + CALL_TIME_LIMIT_MS;
  const maxRetries = operation === 'query' ? MAX_QUERY_RETRIES : 0;

  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw makeError('cancelled', { operationName });

    const timeout = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now());
    const result = await attemptOnce(request, operationName, timeout, signal, makeError);
    if (result.ok) return result.data;

    const { error } = result;
    if (!error.retryable || attempt >= maxRetries) throw error;

    const wait = retryWait(attempt, result.retryAfterMs);
    if (wait === undefined || deadline - Date.now() - wait < MIN_TIME_FOR_RETRY_MS) throw error;
    await sleep(wait, signal, () => makeError('cancelled', { operationName }));
  }
}

/** Full-jitter backoff, at least any Retry-After; undefined when Retry-After is too long. */
function retryWait(attempt: number, retryAfterMs: number | undefined): number | undefined {
  if (retryAfterMs !== undefined && retryAfterMs > RETRY_AFTER_CAP_MS) return undefined;
  const jitter = Math.random() * Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
  return Math.max(jitter, retryAfterMs ?? 0);
}

function sleep(ms: number, signal: AbortSignal | undefined, cancelled: () => Error): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, ms);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

/** Seconds form of Retry-After only; an HTTP date is ignored and normal backoff applies. */
function parseRetryAfter(response: Response): number | undefined {
  const value = response.headers.get('Retry-After')?.trim();
  return value !== undefined && /^\d+$/.test(value) ? Number(value) * 1000 : undefined;
}

type GraphQLErrorEntry = { readonly extensions?: { readonly code?: unknown } };

async function attemptOnce<E extends RetryableError>(
  request: GraphqlRequest,
  operationName: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
  makeError: GraphqlCallOptions<E>['makeError'],
): Promise<AttemptResult<E>> {
  const fail = (
    kind: TransportErrorKind,
    details: { status?: number; codes?: readonly string[]; retryAfterMs?: number } = {},
  ): AttemptResult<E> => ({
    ok: false,
    error: makeError(kind, { operationName, status: details.status, codes: details.codes }),
    retryAfterMs: details.retryAfterMs,
  });

  // AbortController rather than AbortSignal.timeout or AbortSignal.any, which React Native does
  // not provide. It aborts on our timer or on the caller's signal.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  let response: Response;
  let text: string;
  try {
    response = await fetch(request.url, {
      method: 'POST',
      headers: { ...request.headers },
      body: request.body,
      signal: controller.signal,
    });
    text = await response.text();
  } catch {
    // The underlying error can name the host, so it is never passed on.
    if (signal?.aborted) return fail('cancelled');
    return fail(timedOut ? 'timeout' : 'no-network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  const { status } = response;
  if (status === 429) return fail('throttled', { status, retryAfterMs: parseRetryAfter(response) });
  if (!response.ok) return fail('http-error', { status, retryAfterMs: parseRetryAfter(response) });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail('invalid-response');
  }
  if (typeof body !== 'object' || body === null) return fail('invalid-response');

  const { data, errors } = body as { data?: unknown; errors?: unknown };
  if (Array.isArray(errors) && errors.length > 0) {
    const codes = safeShopifyCodes(
      (errors as GraphQLErrorEntry[]).map((entry) => entry?.extensions?.code),
    );
    return fail(codes.includes('THROTTLED') ? 'throttled' : 'graphql-error', { codes });
  }
  if (typeof data !== 'object' || data === null) return fail('invalid-response');
  return { ok: true, data };
}
