/**
 * The one module that calls the Shopify Storefront API (D-056). Screens and other modules never
 * call fetch or build a query string; they pass a `#graphql` operation from src/shopify/, which
 * code generation has typed (D-054), to `storefrontQuery` or `storefrontMutation`.
 *
 * Every call carries the buyer context from the store configuration (D-058). Every failure is a
 * StorefrontError (D-057). Queries are retried with backoff and jitter; mutations never are.
 * One call, retries included, ends within CALL_TIME_LIMIT_MS. Nothing is logged. The attempts,
 * time limits and retries are the shared transport's (src/graphql/transport.ts, D-126).
 */

import { getStoreConfig, storefrontEndpoint } from '@/config';
import { executeGraphql, operationNameOf } from '@/graphql/transport';

import { StorefrontError } from './errors';
import type { StorefrontMutations, StorefrontQueries } from './storefrontTypes';

export {
  ATTEMPT_TIMEOUT_MS,
  CALL_TIME_LIMIT_MS,
  MAX_QUERY_RETRIES,
  operationNameOf,
} from '@/graphql/transport';

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

async function execute<T>(
  operation: Operation,
  document: string,
  options: UntypedOptions | undefined,
): Promise<T> {
  const operationName = operationNameOf(document);
  const { storeDomain, storefrontAccessToken, country, language } = getStoreConfig();
  // The buyer context is written last, so a caller's variables cannot replace it.
  const body = JSON.stringify({
    query: document,
    variables: { ...options?.variables, country, language },
  });
  const data = await executeGraphql(
    {
      url: storefrontEndpoint(storeDomain),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body,
    },
    {
      operation,
      operationName,
      signal: options?.signal,
      makeError: (kind, details) => new StorefrontError(kind, details),
    },
  );
  return data as T;
}
