/**
 * The app's one query cache (D-061), shared by every data source: the Storefront API now, the
 * Customer Account API and the backend later. In memory only, with no persister (D-059).
 * TanStack's own retry is off: the Storefront client retries safe reads itself (D-057), and a
 * mutation is never retried. Errors are reported here, in one place, by `reportQueryError`.
 * Offline, queries pause and resume on reconnect (D-064); a mutation is never paused or queued:
 * it always runs, so offline it fails at once with the client's `no-network` error (D-065).
 *
 * Each data source keeps its own key root and its own clear function; `clearAllCaches` empties
 * everything, for logout.
 */

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { reportQueryError } from './errorReporting';
import { freshness } from './freshness';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** User-error codes this mutation's caller handles itself; not reported (D-057). */
      readonly handledCodes?: readonly string[];
    };
  }
}

/** A new client with the app's settings. The app uses `appQueryClient`; tests make their own. */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => reportQueryError(error) }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _result, mutation) =>
        reportQueryError(error, mutation.meta?.handledCodes),
    }),
    defaultOptions: {
      queries: { retry: false, ...freshness.catalogue },
      mutations: { retry: false, networkMode: 'always' },
    },
  });
}

/** The client for this app run, created once. */
export const appQueryClient = createAppQueryClient();

/** Cancels every query in flight and empties the whole cache, for logout (D-061). */
export async function clearAllCaches(client: QueryClient = appQueryClient): Promise<void> {
  await client.cancelQueries();
  client.clear();
}
