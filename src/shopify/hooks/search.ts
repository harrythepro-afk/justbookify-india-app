/**
 * The search hook (P6-06, D-096, D-097). Screens read search results through the app's cache and
 * never call the Storefront client (D-063). The term lives only in the screen's state and in the
 * in-memory cache key: it is never logged, never sent to analytics and never reported to Sentry
 * (errors go by code and operation name only, D-057, D-061).
 */

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import { fetchSearchPage, type SearchOptions } from '../catalogue';
import { storefrontKeys } from '../queryKeys';

export type { SearchBooksPage, SearchOptions } from '../catalogue';
export { cleanSearchTerm, searchableTerm, type SearchTrigger } from '../searchTerm';

/**
 * The books matching `term`, page by page, 20 at a time; nothing is read while `term` is null.
 * Each term, sort and "Available now" is cached on its own. When the term changes, the earlier
 * request has no screen left and the cache cancels it through its signal. While a new term loads,
 * the previous results stay (`isPlaceholderData` is true until the new term's first page arrives).
 */
export function useSearchBooks(term: string | null, search: SearchOptions) {
  const queryKey = storefrontKeys.catalogue.search(term ?? '', search);
  useRefetchStaleOnFocus(queryKey);
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchSearchPage({ term: term ?? '', after: pageParam, search, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: term !== null,
    placeholderData: keepPreviousData,
    ...freshness.catalogue,
  });
}
