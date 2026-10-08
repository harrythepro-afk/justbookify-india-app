/**
 * Each sort the app offers (`BookSort`, `src/config/browse.ts`) mapped to Shopify's sort keys,
 * for the two kinds of read (D-085): all books through the root `products` query
 * (`ProductSortKeys`) and a group through a collection's products (`ProductCollectionSortKeys`);
 * and each search sort (`SearchSort`, `src/config/search.ts`) mapped to `SearchSortKeys` (P6-06,
 * D-096). Checked against the saved `2026-10` schema.
 */

import type { BookSort, SearchSort } from '@/config';

import type {
  ProductCollectionSortKeys,
  ProductSortKeys,
  SearchSortKeys,
} from './generated/storefront.types';

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

const ALL_BOOKS_SORT: Record<Exclude<BookSort, 'featured'>, SortVariables<ProductSortKeys>> = {
  'best-selling': { sortKey: 'BEST_SELLING', reverse: false },
  'title-ascending': { sortKey: 'TITLE', reverse: false },
  'title-descending': { sortKey: 'TITLE', reverse: true },
  'price-ascending': { sortKey: 'PRICE', reverse: false },
  'price-descending': { sortKey: 'PRICE', reverse: true },
  'created-ascending': { sortKey: 'CREATED_AT', reverse: false },
  'created-descending': { sortKey: 'CREATED_AT', reverse: true },
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

/**
 * The sort variables for all books. "Featured" is a collection's own order and all books are no
 * collection, so the screen never offers it there; if it arrives anyway, A-Z is used, the
 * all-books default.
 */
export function allBooksSort(sort: BookSort): SortVariables<ProductSortKeys> {
  return sort === 'featured' ? ALL_BOOKS_SORT['title-ascending'] : ALL_BOOKS_SORT[sort];
}

/** The sort variables for a search (D-096). */
export function searchSort(sort: SearchSort): SortVariables<SearchSortKeys> {
  return SEARCH_SORT[sort];
}
