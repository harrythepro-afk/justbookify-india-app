/**
 * The one error type for Storefront API calls (D-057). Every failure in src/shopify/client.ts
 * becomes a StorefrontError with a fixed kind and our own wording. It never holds Shopify's
 * message text, the response, the variables, the store's domain or the token, so it is safe to
 * show on a development screen or to report by code.
 */

import { reportStorefrontProblem } from '@/crashReporting/sentry';

export type StorefrontErrorKind =
  | 'no-network'
  | 'timeout'
  | 'cancelled'
  | 'throttled'
  | 'http-error'
  | 'invalid-response'
  | 'graphql-error'
  | 'user-errors';

const MESSAGES: Record<StorefrontErrorKind, string> = {
  'no-network': 'The Storefront API could not be reached.',
  timeout: 'The Storefront API did not answer in time.',
  cancelled: 'The Storefront API request was cancelled.',
  throttled: 'The Storefront API is busy; try again shortly.',
  'http-error': 'The Storefront API answered with an HTTP error.',
  'invalid-response': 'The Storefront API sent a response the app cannot read.',
  'graphql-error': 'The Storefront API returned GraphQL errors.',
  'user-errors': 'The store did not accept the request.',
};

/** HTTP statuses after which a query may be retried (D-057). */
export const RETRYABLE_HTTP_STATUSES: ReadonlySet<number> = new Set([500, 502, 503, 504]);

// Shopify's error and user-error codes are upper-case enum values. Anything else is dropped,
// because free text could carry a value from the request.
const SAFE_SHOPIFY_CODE = /^[A-Z][A-Z0-9_]*$/;

/** Keeps only the values that look like Shopify enum codes. */
export function safeShopifyCodes(values: readonly unknown[]): string[] {
  return values.filter(
    (value): value is string => typeof value === 'string' && SAFE_SHOPIFY_CODE.test(value),
  );
}

export type StorefrontErrorDetails = {
  /** The GraphQL operation's own name, from our source code. */
  readonly operationName: string;
  readonly status?: number;
  /** Shopify's error or user-error codes; filtered by `safeShopifyCodes`. */
  readonly codes?: readonly string[];
};

export class StorefrontError extends Error {
  readonly kind: StorefrontErrorKind;
  /** For crash reports: matches the pattern `safeErrorCode()` passes through. */
  readonly code: `storefront/${StorefrontErrorKind}`;
  readonly operationName: string;
  readonly status: number | undefined;
  readonly codes: readonly string[];
  /** Whether a query that failed this way may be tried again (D-057). */
  readonly retryable: boolean;

  constructor(kind: StorefrontErrorKind, details: StorefrontErrorDetails) {
    const codes = safeShopifyCodes(details.codes ?? []);
    const parts = [
      details.operationName,
      ...(details.status === undefined ? [] : [`HTTP ${details.status}`]),
      ...(codes.length === 0 ? [] : [codes.join(', ')]),
    ];
    super(`${MESSAGES[kind]} (${parts.join('; ')})`);
    this.name = 'StorefrontError';
    this.kind = kind;
    this.code = `storefront/${kind}`;
    this.operationName = details.operationName;
    this.status = details.status;
    this.codes = codes;
    this.retryable =
      kind === 'no-network' ||
      kind === 'timeout' ||
      kind === 'throttled' ||
      (kind === 'http-error' &&
        details.status !== undefined &&
        RETRYABLE_HTTP_STATUSES.has(details.status));
  }
}

type UserError = { readonly code?: string | null };

/** Throws a `user-errors` StorefrontError when a mutation payload holds any user errors. */
export function throwIfUserErrors(
  operationName: string,
  userErrors: readonly UserError[] | null | undefined,
): void {
  if (userErrors === null || userErrors === undefined || userErrors.length === 0) return;
  throw new StorefrontError('user-errors', {
    operationName,
    codes: userErrors.map((error) => error.code ?? 'UNKNOWN'),
  });
}

/**
 * Whether a caller should report this error to Sentry (D-057). Network trouble, timeouts,
 * cancels and throttling are normal on a phone. Errors that point to a bug in our operations or
 * a fault at Shopify's end are worth seeing. Throttling or a server error reaching a caller has
 * already survived the client's retries.
 */
export function shouldReportStorefrontError(
  error: StorefrontError,
  handledCodes: readonly string[] = [],
): boolean {
  switch (error.kind) {
    case 'no-network':
    case 'timeout':
    case 'cancelled':
      return false;
    // Throttling or a server error that reached the caller has survived the retries. Other HTTP
    // errors, such as 401 for a wrong token, are configuration faults; `reportStorefrontError`
    // sends each of those statuses at most once per session.
    case 'throttled':
    case 'http-error':
      return true;
    case 'user-errors':
      return error.codes.length === 0 || error.codes.some((code) => !handledCodes.includes(code));
    case 'graphql-error':
    case 'invalid-response':
      return true;
  }
}

function isConfigurationFault(error: StorefrontError): boolean {
  return error.kind === 'http-error' && error.status !== undefined && error.status < 500;
}

// HTTP statuses already reported as configuration faults in this session.
const reportedFaultStatuses = new Set<number>();

/**
 * Reports a Storefront error to Sentry by its code and operation name only, when D-057 says
 * it should be. `handledCodes` are the user-error codes the caller deals with itself. A
 * configuration fault (an HTTP error below 500) is sent at most once per session per status.
 */
export function reportStorefrontError(error: unknown, handledCodes: readonly string[] = []): void {
  if (!(error instanceof StorefrontError)) return;
  if (!shouldReportStorefrontError(error, handledCodes)) return;
  if (isConfigurationFault(error) && error.status !== undefined) {
    if (reportedFaultStatuses.has(error.status)) return;
    reportedFaultStatuses.add(error.status);
  }
  reportStorefrontProblem(error.code, error.operationName);
}
