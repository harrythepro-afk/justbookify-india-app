/**
 * The one module that calls the Shopify Storefront API (D-056). Screens and other modules never
 * call fetch or build a query string; they pass a `#graphql` operation from src/shopify/, which
 * code generation has typed (D-054), to `storefrontQuery` or `storefrontMutation`.
 *
 * Every call carries the buyer context from the store configuration (D-058). Every failure is a
 * StorefrontError (D-057). Queries are retried with backoff and jitter; mutations never are.
 * One call, retries included, ends within CALL_TIME_LIMIT_MS. Nothing is logged.
 */

import { getStoreConfig, storefrontEndpoint } from '@/config';

import { StorefrontError, safeShopifyCodes } from './errors';
import type { StorefrontMutations, StorefrontQueries } from './storefrontTypes';

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

/** Variables the client fills in from the store configuration; callers cannot set them. */
type ContextVariableName = 'country' | 'language';

type OperationTypes = { variables: object; return: unknown };

type VariablesOf<T> = T extends OperationTypes ? T['variables'] : never;
type ReturnOf<T> = T extends OperationTypes ? T['return'] : never;

type CallerVariables<V> = Omit<V, ContextVariableName>;

// Variables are optional only when the operation has no required variable of its own.
type VariablesOption<V> =
  Record<string, never> extends CallerVariables<V>
    ? { readonly variables?: CallerVariables<V> }
    : { readonly variables: CallerVariables<V> };

type RequestOptions<V> = VariablesOption<V> & {
  /** Cancels the call, including a wait between retries; it then fails as `cancelled`. */
  readonly signal?: AbortSignal;
};

// The options argument may be left out when it would only hold optional fields.
type OptionsArgs<V> =
  Record<string, never> extends CallerVariables<V>
    ? [options?: RequestOptions<V>]
    : [options: RequestOptions<V>];

type Operation = 'query' | 'mutation';

const OPERATION_NAME = /^\s*(?:#graphql\s+)?(?:query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)/;

/** The operation's own name, from our source. Operations are always named (D-054). */
export function operationNameOf(document: string): string {
  return OPERATION_NAME.exec(document)?.[1] ?? 'UnnamedOperation';
}

/** Runs a typed query. Retried after network trouble, timeouts, throttling and 5xx (D-057). */
export function storefrontQuery<Q extends keyof StorefrontQueries & string>(
  query: Q,
  ...[options]: OptionsArgs<VariablesOf<StorefrontQueries[Q]>>
): Promise<ReturnOf<StorefrontQueries[Q]>> {
  return execute('query', query, options);
}

/** Runs a typed mutation once. A mutation is never retried automatically (D-057). */
export function storefrontMutation<M extends keyof StorefrontMutations & string>(
  mutation: M,
  ...[options]: OptionsArgs<VariablesOf<StorefrontMutations[M]>>
): Promise<ReturnOf<StorefrontMutations[M]>> {
  return execute('mutation', mutation, options);
}

type UntypedOptions = { readonly variables?: object; readonly signal?: AbortSignal };

type AttemptResult =
  | { readonly ok: true; readonly data: unknown }
  | { readonly ok: false; readonly error: StorefrontError; readonly retryAfterMs?: number };

async function execute<T>(
  operation: Operation,
  document: string,
  options: UntypedOptions | undefined,
): Promise<T> {
  const operationName = operationNameOf(document);
  const signal = options?.signal;
  const { storeDomain, storefrontAccessToken, country, language } = getStoreConfig();
  // The buyer context is written last, so a caller's variables cannot replace it.
  const body = JSON.stringify({
    query: document,
    variables: { ...options?.variables, country, language },
  });
  const request = { url: storefrontEndpoint(storeDomain), token: storefrontAccessToken, body };
  const deadline = Date.now() + CALL_TIME_LIMIT_MS;
  const maxRetries = operation === 'query' ? MAX_QUERY_RETRIES : 0;

  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw new StorefrontError('cancelled', { operationName });

    const timeout = Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now());
    const result = await attemptOnce(request, operationName, timeout, signal);
    if (result.ok) return result.data as T;

    const { error } = result;
    if (!error.retryable || attempt >= maxRetries) throw error;

    const wait = retryWait(attempt, result.retryAfterMs);
    if (wait === undefined || deadline - Date.now() - wait < MIN_TIME_FOR_RETRY_MS) throw error;
    await sleep(wait, signal, operationName);
  }
}

/** Full-jitter backoff, at least any Retry-After; undefined when Retry-After is too long. */
function retryWait(attempt: number, retryAfterMs: number | undefined): number | undefined {
  if (retryAfterMs !== undefined && retryAfterMs > RETRY_AFTER_CAP_MS) return undefined;
  const jitter = Math.random() * Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt);
  return Math.max(jitter, retryAfterMs ?? 0);
}

function sleep(ms: number, signal: AbortSignal | undefined, operationName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new StorefrontError('cancelled', { operationName }));
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

async function attemptOnce(
  request: { readonly url: string; readonly token: string; readonly body: string },
  operationName: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<AttemptResult> {
  const fail = (
    kind: ConstructorParameters<typeof StorefrontError>[0],
    details: { status?: number; codes?: readonly string[]; retryAfterMs?: number } = {},
  ): AttemptResult => ({
    ok: false,
    error: new StorefrontError(kind, {
      operationName,
      status: details.status,
      codes: details.codes,
    }),
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
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Shopify-Storefront-Access-Token': request.token,
      },
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
