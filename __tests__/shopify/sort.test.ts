import { BROWSE_CONTENT, SEARCH_CONTENT, type BookSort } from '@/config';
import { collectionSort, searchSort } from '@/shopify/sort';

// D-085: each option to its Storefront collection sort key (saved `2026-10` schema). Every list is
// a collection since P6-07, all books included (D-100): on the development store the all-books
// collection's orders matched the root query's (8 October 2026).
const TABLE: readonly [BookSort, string, boolean][] = [
  ['featured', 'COLLECTION_DEFAULT', false],
  ['best-selling', 'BEST_SELLING', false],
  ['title-ascending', 'TITLE', false],
  ['title-descending', 'TITLE', true],
  ['price-ascending', 'PRICE', false],
  ['price-descending', 'PRICE', true],
  ['created-ascending', 'CREATED', false],
  ['created-descending', 'CREATED', true],
];

it('covers every sort the store offers, in the table above', () => {
  expect(BROWSE_CONTENT.sortOptions.map((option) => option.sort)).toEqual(
    TABLE.map(([sort]) => sort),
  );
});

it.each(TABLE)('maps %s to the collection key %s, reverse %s', (sort, sortKey, reverse) => {
  expect(collectionSort(sort)).toEqual({ sortKey, reverse });
});

// P6-06, D-096: the search sorts to `SearchSortKeys` (saved `2026-10` schema).
it.each([
  ['relevance', 'RELEVANCE', false],
  ['price-ascending', 'PRICE', false],
  ['price-descending', 'PRICE', true],
] as const)('maps the search sort %s to %s, reverse %s', (sort, sortKey, reverse) => {
  expect(searchSort(sort)).toEqual({ sortKey, reverse });
});

it('maps every search sort the store offers', () => {
  for (const option of SEARCH_CONTENT.sortOptions) {
    expect(searchSort(option.sort)).toBeDefined();
  }
});
