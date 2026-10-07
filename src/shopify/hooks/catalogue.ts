/**
 * Hooks for catalogue screens (D-063): screens read books through the app's cache and never
 * call the Storefront client. Errors are reported by the cache (D-061). Lists use the
 * `catalogue` preset (D-062); the book page uses `liveStock` (D-093). Each hook refetches its data when its screen regains focus, only
 * if that data is stale (D-079).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import {
  fetchAllBooksPage,
  fetchBook,
  fetchBookCard,
  fetchCollectionBooksPage,
  fetchCollectionHandles,
  type BookListOptions,
} from '../catalogue';
import { storefrontKeys } from '../queryKeys';

export {
  CATALOGUE_PAGE_SIZE,
  type AllBooksPage,
  type BookListOptions,
  type CollectionBooksPage,
} from '../catalogue';
export type { BookPage } from '../bookPage';
export type { RichSpan, RichTextBlock } from '../richText';
// The development preview shows a sample description through the book page's parser (D-094).
export { parseDescriptionHtml } from '../richText';
export {
  CatalogueDataError,
  type BookAvailability,
  type BookCard,
  type BookCover,
} from '../bookCard';
// Screens say when they are offline (D-078), and "Try again" re-reads the network first (D-082).
// Screens may import hooks only (D-063).
export { recheckNetwork, useIsOffline } from '@/query/online';

/**
 * A collection's books by handle (D-068), page by page. Each page is `found` or `not-found`;
 * `fetchNextPage()` reads the next one while `hasNextPage` is true. Without `list`, every book
 * in the collection's own order; with it, a sort and "Available now" (D-085, D-086), each
 * combination cached on its own.
 */
export function useCollectionBooks(handle: string, list?: BookListOptions) {
  const queryKey = storefrontKeys.catalogue.collectionBooks(handle, list);
  useRefetchStaleOnFocus(queryKey);
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchCollectionBooksPage({ handle, after: pageParam, list, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.kind === 'found' ? lastPage.nextCursor : null),
    ...freshness.catalogue,
  });
}

/**
 * All books (D-083), page by page, 20 at a time: the whole catalogue is never fetched. Each
 * combination of sort and "Available now" is cached on its own.
 */
export function useAllBooks(list: BookListOptions) {
  const queryKey = storefrontKeys.catalogue.allBooks(list);
  useRefetchStaleOnFocus(queryKey);
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchAllBooksPage({ after: pageParam, list, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
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
 * One book's page by handle (P6-05); `null` when no such book is published to the app's channel.
 * The `liveStock` preset (D-062, D-093): most books have one copy, so the page reads Shopify again
 * every time it opens, and on focus once its data is 30 seconds old.
 */
export function useBook(handle: string) {
  const queryKey = storefrontKeys.catalogue.book(handle);
  useRefetchStaleOnFocus(queryKey);
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchBook({ handle, signal }),
    ...freshness.liveStock,
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
