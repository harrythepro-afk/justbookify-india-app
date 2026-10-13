/**
 * The one error type for Customer Account API calls (P7-02, D-126). Every failure in
 * src/customerAccountApi/client.ts becomes a CustomerAccountApiError with a fixed kind and our
 * own wording. Like StorefrontError (D-057) it never holds Shopify's message text, the response,
 * the variables, the endpoint, the token or any of the customer's data, so it is safe to report
 * by code.
 */

import { reportCustomerAccountApiProblem } from '@/crashReporting/sentry';
import type { TransportErrorKind } from '@/graphql/transport';
import { RETRYABLE_HTTP_STATUSES, safeShopifyCodes } from '@/shopify/errors';

export type CustomerAccountApiErrorKind =
  | TransportErrorKind
  /** No valid access token: signed out, or Shopify refused the refresh (D-121). */
  | 'signed-out'
  /** Shopify answered 401 and a refresh did not help; the customer stays signed in (D-121). */
  | 'unauthorized'
  /**
   * No endpoint from the store's discovery document, or no fresh token while still signed in;
   * either was already reported where it happened, except offline.
   */
  | 'unavailable';

const MESSAGES: Record<CustomerAccountApiErrorKind, string> = {
  'no-network': 'The Customer Account API could not be reached.',
  timeout: 'The Customer Account API did not answer in time.',
  cancelled: 'The Customer Account API request was cancelled.',
  throttled: 'The Customer Account API is busy; try again shortly.',
  'http-error': 'The Customer Account API answered with an HTTP error.',
  'invalid-response': 'The Customer Account API sent a response the app cannot read.',
  'graphql-error': 'The Customer Account API returned GraphQL errors.',
  'signed-out': 'The customer is not signed in.',
  unauthorized: 'The Customer Account API did not accept the access token.',
  unavailable: 'The Customer Account API cannot be called just now.',
};

export type CustomerAccountApiErrorDetails = {
  /** The GraphQL operation's own name, from our source code. */
  readonly operationName: string;
  readonly status?: number;
  /** Shopify's error codes; filtered by `safeShopifyCodes`. */
  readonly codes?: readonly string[];
};

export class CustomerAccountApiError extends Error {
  readonly kind: CustomerAccountApiErrorKind;
  /** For crash reports, sent by reportCustomerAccountApiError with the operation name. */
  readonly code: `customer-account-api/${CustomerAccountApiErrorKind}`;
  readonly operationName: string;
  readonly status: number | undefined;
  readonly codes: readonly string[];
  /** Whether a query that failed this way may be tried again (D-057). */
  readonly retryable: boolean;

  constructor(kind: CustomerAccountApiErrorKind, details: CustomerAccountApiErrorDetails) {
    const codes = safeShopifyCodes(details.codes ?? []);
    const parts = [
      details.operationName,
      ...(details.status === undefined ? [] : [`HTTP ${details.status}`]),
      ...(codes.length === 0 ? [] : [codes.join(', ')]),
    ];
    super(`${MESSAGES[kind]} (${parts.join('; ')})`);
    this.name = 'CustomerAccountApiError';
    this.kind = kind;
    this.code = `customer-account-api/${kind}`;
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

/**
 * Whether this error is worth reporting to Sentry. Network trouble, timeouts, cancels and being
 * signed out are normal on a phone; `unavailable` was already reported by the discovery read.
 * Throttling or a server error reaching a caller has survived the client's retries.
 */
export function shouldReportCustomerAccountApiError(error: CustomerAccountApiError): boolean {
  switch (error.kind) {
    case 'no-network':
    case 'timeout':
    case 'cancelled':
    case 'signed-out':
    case 'unavailable':
      return false;
    case 'throttled':
    case 'http-error':
    case 'invalid-response':
    case 'graphql-error':
    case 'unauthorized':
      return true;
  }
}

/** An HTTP error below 500 or a refused token: a fault in configuration, not in the moment. */
function isConfigurationFault(error: CustomerAccountApiError): boolean {
  return (
    error.kind === 'unauthorized' ||
    (error.kind === 'http-error' && error.status !== undefined && error.status < 500)
  );
}

// Configuration faults already reported in this session, by kind and status.
const reportedFaults = new Set<string>();

/**
 * Reports a Customer Account API error to Sentry by its code and operation name only, when it
 * should be. A configuration fault is sent at most once per session per kind and status.
 */
export function reportCustomerAccountApiError(error: unknown): void {
  if (!(error instanceof CustomerAccountApiError)) return;
  if (!shouldReportCustomerAccountApiError(error)) return;
  if (isConfigurationFault(error)) {
    const key = `${error.kind}:${error.status ?? ''}`;
    if (reportedFaults.has(key)) return;
    reportedFaults.add(key);
  }
  reportCustomerAccountApiProblem(error.code, error.operationName);
}

/** For tests: forget the faults reported in this session. */
export function resetReportedCustomerAccountApiFaultsForTests(): void {
  reportedFaults.clear();
}
