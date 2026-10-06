/**
 * Hooks for catalogue screens (D-063): screens read books through the app's cache and never
 * call the Storefront client. Errors are reported by the cache (D-061). Lists use the
 * `catalogue` preset (D-062).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { freshness } from '@/query/freshness';

import { fetchBookCard, fetchCollectionBooksPage } from '../catalogue';
import { storefrontKeys } from '../queryKeys';

export { CATALOGUE_PAGE_SIZE, type CollectionBooksPage } from '../catalogue';
export {
  CatalogueDataError,
  type BookAvailability,
  type BookCard,
  type BookCover,
} from '../bookCard';

/**
 * A collection's books by handle (D-068), page by page. Each page is `found` or `not-found`;
 * `fetchNextPage()` reads the next one while `hasNextPage` is true.
 */
export function useCollectionBooks(handle: string) {
  return useInfiniteQuery({
    queryKey: storefrontKeys.catalogue.collectionBooks(handle),
    queryFn: ({ pageParam, signal }) =>
      fetchCollectionBooksPage({ handle, after: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.kind === 'found' ? lastPage.nextCursor : null),
    ...freshness.catalogue,
  });
}

/** One book's card by handle; `null` when no such book is published to the app's channel. */
export function useBookCard(handle: string) {
  return useQuery({
    queryKey: storefrontKeys.catalogue.bookCard(handle),
    queryFn: ({ signal }) => fetchBookCard({ handle, signal }),
    ...freshness.catalogue,
  });
}
