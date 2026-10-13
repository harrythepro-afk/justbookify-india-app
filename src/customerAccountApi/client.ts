/**
 * The one module that calls the Customer Account API's GraphQL (P7-02, D-124 to D-126). Hooks in
 * src/customerAccountApi/hooks/ call the functions in this folder, which pass a `#graphql`
 * operation that code generation has typed to `customerAccountQuery`.
 *
 * - **Endpoint:** the store's discovered host with the pinned version (`apiEndpoint.ts`, D-124).
 * - **Token:** only from `getValidAccessToken()` (D-121), sent as `Authorization: <token>` with
 *   no `Bearer`, as Shopify's reference shows. No token, no request: the call fails `signed-out`,
 *   or `unavailable` while the customer is still signed in.
 * - **401:** one refresh with `refreshSession()`, then one more attempt with the new token. If
 *   Shopify refused the refresh, the session has already ended and every cache is cleared
 *   (D-121): `signed-out`. Any other outcome keeps the customer signed in: `unauthorized`.
 * - **Attempts, time limits and retries** are the shared transport's (D-057, D-126): queries
 *   only. This task reads only; there is no mutation function.
 *
 * Every failure is a CustomerAccountApiError. Nothing is logged; no token, URL or customer value
 * reaches an error.
 */

import { getCustomerAccountApiEndpoint } from '@/customerAccount/apiEndpoint';
import {
  getCustomerSessionState,
  getValidAccessToken,
  refreshSession,
} from '@/customerAccount/session';
import { CALL_TIME_LIMIT_MS, executeGraphql, operationNameOf } from '@/graphql/transport';

import type { CustomerQueries } from './customerAccountTypes';
import { CustomerAccountApiError, type CustomerAccountApiErrorKind } from './errors';

type OperationTypes = { variables: object; return: unknown };

type VariablesOf<T> = T extends OperationTypes ? T['variables'] : never;
type ReturnOf<T> = T extends OperationTypes ? T['return'] : never;

// Variables are optional only when the operation has no required variable of its own.
type VariablesOption<V> =
  Record<string, never> extends V ? { readonly variables?: V } : { readonly variables: V };

type RequestOptions<V> = VariablesOption<V> & {
  /** Cancels the call, including a wait between retries; it then fails as `cancelled`. */
  readonly signal?: AbortSignal;
};

// The options argument may be left out when it would only hold optional fields.
type OptionsArgs<V> =
  Record<string, never> extends V ? [options?: RequestOptions<V>] : [options: RequestOptions<V>];

/** Runs a typed query. Retried after network trouble, timeouts, throttling and 5xx (D-057). */
export function customerAccountQuery<Q extends keyof CustomerQueries & string>(
  query: Q,
  ...[options]: OptionsArgs<VariablesOf<CustomerQueries[Q]>>
): Promise<ReturnOf<CustomerQueries[Q]>> {
  return execute(query, options);
}

type UntypedOptions = { readonly variables?: object; readonly signal?: AbortSignal };

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof CustomerAccountApiError && error.kind === 'http-error' && error.status === 401
  );
}

/**
 * Without a token: signed out, or still signed in with an expired token that could not be
 * refreshed just now (offline, or a failure the session has already reported). The second stays
 * signed in (D-121).
 */
function noTokenKind(): CustomerAccountApiErrorKind {
  return getCustomerSessionState().status === 'signedIn' ? 'unavailable' : 'signed-out';
}

async function execute<T>(document: string, options: UntypedOptions | undefined): Promise<T> {
  const operationName = operationNameOf(document);
  const signal = options?.signal;
  // One limit for the whole call, the refresh and the second attempt included (D-057).
  const deadline = Date.now() + CALL_TIME_LIMIT_MS;
  const fail = (kind: CustomerAccountApiErrorKind, status?: number) =>
    new CustomerAccountApiError(kind, { operationName, status });

  if (signal?.aborted) throw fail('cancelled');
  const found = await getCustomerAccountApiEndpoint();
  if (!found.ok) throw fail(found.reason);

  const body = JSON.stringify({ query: document, variables: options?.variables ?? {} });
  const send = (token: string) =>
    executeGraphql(
      {
        url: found.endpoint,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: token,
        },
        body,
      },
      {
        operation: 'query',
        operationName,
        signal,
        deadline,
        makeError: (kind, details) => new CustomerAccountApiError(kind, details),
      },
    );

  const token = await getValidAccessToken();
  if (token === undefined) throw fail(noTokenKind());
  if (signal?.aborted) throw fail('cancelled');

  try {
    return (await send(token)) as T;
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }

  // Shopify refused the access token: refresh once, then try once more (D-121).
  const outcome = await refreshSession();
  if (outcome === 'refused' || outcome === 'signedOut') throw fail('signed-out');
  if (outcome === 'unavailable') throw fail('unauthorized', 401);
  const fresh = await getValidAccessToken();
  if (fresh === undefined) throw fail(noTokenKind());
  if (signal?.aborted) throw fail('cancelled');

  try {
    return (await send(fresh)) as T;
  } catch (error) {
    if (isUnauthorized(error)) throw fail('unauthorized', 401);
    throw error;
  }
}
