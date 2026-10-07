/**
 * Hooks for catalogue screens (D-063): screens read books through the app's cache and never
 * call the Storefront client. Errors are reported by the cache (D-061). Lists use the
 * `catalogue` preset (D-062). Each hook refetches its data when its screen regains focus, only
 * if that data is stale (D-079).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import { fetchBookCard, fetchCollectionBooksPage, fetchCollectionHandles } from '../catalogue';
import { storefrontKeys } from '../queryKeys';

export { CATALOGUE_PAGE_SIZE, type CollectionBooksPage } from '../catalogue';
export {
  CatalogueDataError,
  type BookAvailability,
  type BookCard,
  type BookCover,
} from '../bookCard';
// Screens say when they are offline (D-078) and may import hooks only (D-063).
export { useIsOffline } from '@/query/online';

/**
 * A collection's books by handle (D-068), page by page. Each page is `found` or `not-found`;
 * `fetchNextPage()` reads the next one while `hasNextPage` is true.
 */
export function useCollectionBooks(handle: string) {
  const queryKey = storefrontKeys.catalogue.collectionBooks(handle);
  useRefetchStaleOnFocus(queryKey);
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchCollectionBooksPage({ handle, after: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.kind === 'found' ? lastPage.nextCursor : null),
    ...freshness.catalogue,
  });
}

/** One book's card by handle; `null` when no such book is published to the app's channel. */
export function useBookCard(handle: string) {
  const queryKey = storefrontKeys.catalogue.bookCard(handle);
  useRefetchStaleOnFocus(queryKey);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchBookCard({ handle, signal }),
    ...freshness.catalogue,
  });
}

/**
 * The handles of every collection published to the app's channel (D-076), so a screen shows
 * only the configured collections that exist.
 */
export function useCollectionHandles() {
  const queryKey = storefrontKeys.catalogue.collectionHandles();
  useRefetchStaleOnFocus(queryKey);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchCollectionHandles({ signal }),
    ...freshness.catalogue,
  });
}
