/**
 * The search hook (P6-06, D-096, D-097). Screens read search results through the app's cache and
 * never call the Storefront client (D-063). The term lives only in the screen's state and in the
 * in-memory cache key: it is never logged, never sent to analytics and never reported to Sentry
 * (errors go by code and operation name only, D-057, D-061).
 */

import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { SearchMatchGroup, SearchMatchLists } from '@/analytics/searchEvent';
import { BROWSE_CONTENT, SEARCH_CONTENT, type CollectionLink } from '@/config';
import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import { fetchSearchPage, type SearchOptions } from '../catalogue';
import { storefrontKeys } from '../queryKeys';
import { useCollectionHandles, useGenreEntries } from './catalogue';

export type { SearchBooksPage, SearchOptions } from '../catalogue';
export { cleanSearchTerm, searchableTerm, type SearchTrigger } from '../searchTerm';
export type { SearchMatchLists } from '@/analytics/searchEvent';

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

/**
 * What a search term is matched against besides its own results (P6-09, D-109): the configured
 * series and age groups the store has, each with its collection's GID, and the store's genre
 * names with their taxonomy values (D-102). Null until both reads have arrived or failed; a failed
 * read leaves its lists empty, so only that kind of match is missed.
 */
export function useSearchMatchLists(): SearchMatchLists | null {
  const handles = useCollectionHandles();
  const entries = useGenreEntries();
  const handlesSettled = handles.data !== undefined || handles.isError;
  const entriesSettled = entries.data !== undefined || entries.isError;
  return useMemo(() => {
    if (!handlesSettled || !entriesSettled) return null;
    const groups = (links: readonly CollectionLink[]): SearchMatchGroup[] =>
      links.flatMap((link) => {
        const collectionGid = handles.data?.get(link.handle);
        return collectionGid === undefined ? [] : [{ name: link.label, collectionGid }];
      });
    return {
      series: groups(BROWSE_CONTENT.series),
      ageGroups: groups(BROWSE_CONTENT.ageGroups),
      genres: (entries.data ?? []).flatMap((entry) => {
        const name = entry.label?.trim() ?? '';
        const taxonomyValueGid = entry.taxonomyReference?.trim() ?? '';
        return name === '' || taxonomyValueGid === '' ? [] : [{ name, taxonomyValueGid }];
      }),
      commonWords: SEARCH_CONTENT.matchCommonWords,
    };
  }, [handlesSettled, entriesSettled, handles.data, entries.data]);
}
