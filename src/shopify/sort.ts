/**
 * Each sort the app offers (`BookSort`, `src/config/browse.ts`) mapped to Shopify's sort keys
 * for a collection's products (`ProductCollectionSortKeys`, D-085): every Browse and collection
 * list is a collection, all books included since P6-07 (D-100); and each search sort
 * (`SearchSort`, `src/config/search.ts`) mapped to `SearchSortKeys` (P6-06, D-096). Checked
 * against the saved `2026-10` schema.
 */

import type { BookSort, SearchSort } from '@/config';

import type { ProductCollectionSortKeys, SearchSortKeys } from './generated/storefront.types';

export type SortVariables<Key> = { readonly sortKey: Key; readonly reverse: boolean };

const COLLECTION_SORT: Record<BookSort, SortVariables<ProductCollectionSortKeys>> = {
  // The collection's own order, as set in Shopify ("Featured" on the website).
  featured: { sortKey: 'COLLECTION_DEFAULT', reverse: false },
  'best-selling': { sortKey: 'BEST_SELLING', reverse: false },
  'title-ascending': { sortKey: 'TITLE', reverse: false },
  'title-descending': { sortKey: 'TITLE', reverse: true },
  'price-ascending': { sortKey: 'PRICE', reverse: false },
  'price-descending': { sortKey: 'PRICE', reverse: true },
  'created-ascending': { sortKey: 'CREATED', reverse: false },
  'created-descending': { sortKey: 'CREATED', reverse: true },
};

const SEARCH_SORT: Record<SearchSort, SortVariables<SearchSortKeys>> = {
  relevance: { sortKey: 'RELEVANCE', reverse: false },
  'price-ascending': { sortKey: 'PRICE', reverse: false },
  'price-descending': { sortKey: 'PRICE', reverse: true },
};

/** The sort variables for a collection's products. */
export function collectionSort(sort: BookSort): SortVariables<ProductCollectionSortKeys> {
  return COLLECTION_SORT[sort];
}

/** The sort variables for a search (D-096). */
export function searchSort(sort: SearchSort): SortVariables<SearchSortKeys> {
  return SEARCH_SORT[sort];
}
