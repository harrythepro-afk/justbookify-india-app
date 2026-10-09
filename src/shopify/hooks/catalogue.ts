/**
 * Hooks for catalogue screens (D-063): screens read books through the app's cache and never
 * call the Storefront client. Errors are reported by the cache (D-061). Lists use the
 * `catalogue` preset (D-062); the book page uses `liveStock` (D-093). Each hook refetches its data when its screen regains focus, only
 * if that data is stale (D-079).
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { BROWSE_CONTENT, getStoreConfig } from '@/config';
import { freshness } from '@/query/freshness';
import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import {
  fetchBook,
  fetchBookCard,
  fetchCollectionBooksPage,
  fetchCollectionGenres,
  fetchCollectionHandles,
  fetchGenreEntries,
  reportCatalogueFaultOnce,
  type BookListOptions,
} from '../catalogue';
import { toGenreOptions, type GenreOption } from '../genres';
import { toPriceOptions, type PriceOption } from '../priceFilter';
import { storefrontKeys } from '../queryKeys';

export { CATALOGUE_PAGE_SIZE, type BookListOptions, type CollectionBooksPage } from '../catalogue';
export type { GenreFilter, GenreOption } from '../genres';
export type { PriceOption } from '../priceFilter';
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
 * in the collection's own order; with it, a sort, "Available now", a genre and a price (D-085,
 * D-086, D-101, D-104), each combination cached on its own. Browse's all books are a collection too (D-100).
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
 * What a Genre button can offer (D-101): `loading` until both reads are in (the button is drawn
 * but disabled), `ready` with the options, which may be none (no button), or `unavailable` when
 * either read failed with nothing saved or the collection is missing (no button).
 */
export type GenreListState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly options: readonly GenreOption[] }
  | { readonly kind: 'unavailable' };

/**
 * The Genre list for a collection's list, with "Available now" on or off (P6-07, D-101, D-102):
 * the collection's Genre filter values, named by the store's genre entries, never by Shopify's
 * built-in names. The two reads are cached on their own; the entries are shared by every list.
 * Faults in the store's data are reported by code, once per session.
 */
export function useGenreOptions(handle: string, available: boolean): GenreListState {
  const valuesKey = storefrontKeys.catalogue.collectionGenres(handle, available);
  const entriesKey = storefrontKeys.catalogue.genreEntries();
  useRefetchStaleOnFocus(valuesKey);
  useRefetchStaleOnFocus(entriesKey);
  const values = useQuery({
    queryKey: valuesKey,
    queryFn: ({ signal }) => fetchCollectionGenres({ handle, available, signal }),
    ...freshness.catalogue,
  });
  const entries = useQuery({
    queryKey: entriesKey,
    queryFn: ({ signal }) => fetchGenreEntries({ signal }),
    ...freshness.catalogue,
  });

  const joined = useMemo(() => {
    if (values.data === undefined || entries.data === undefined) return null;
    if (values.data.kind === 'not-found') return 'not-found' as const;
    return toGenreOptions(values.data.values, entries.data, values.data.locale);
  }, [values.data, entries.data]);

  useEffect(() => {
    if (joined === null || joined === 'not-found') return;
    for (const fault of joined.faults) reportCatalogueFaultOnce(fault);
  }, [joined]);

  if (joined === 'not-found') return { kind: 'unavailable' };
  if (joined !== null) return { kind: 'ready', options: joined.options };
  const failed =
    (values.data === undefined && values.isError) ||
    (entries.data === undefined && entries.isError);
  return failed ? { kind: 'unavailable' } : { kind: 'loading' };
}

const PRICE_OPTIONS_UNAVAILABLE = 'catalogue/price-options-unavailable';

/**
 * The Price list's options (P6-08, D-104): the configured maxima, lowest first, each labelled in
 * the store's currency format ("Up to ₹49"). No read: the list is the same for every collection.
 * Null when the store configuration cannot be read, so there is no Price button and never a
 * crash while drawing (the book read then fails and says so itself); reported once per session,
 * by code only.
 */
export function usePriceOptions(): readonly PriceOption[] | null {
  const options = useMemo(() => {
    try {
      return toPriceOptions(BROWSE_CONTENT.price.maxima, getStoreConfig());
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    if (options === null) reportCatalogueFaultOnce(PRICE_OPTIONS_UNAVAILABLE);
  }, [options]);
  return options;
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
