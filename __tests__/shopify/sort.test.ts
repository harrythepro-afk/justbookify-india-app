import { BROWSE_CONTENT, SEARCH_CONTENT, type BookSort } from '@/config';
import { allBooksSort, collectionSort, searchSort } from '@/shopify/sort';

// D-085: each option to its Storefront sort key, per kind of read (saved `2026-10` schema).
const TABLE: readonly [BookSort, string | null, string, boolean][] = [
  ['featured', null, 'COLLECTION_DEFAULT', false],
  ['best-selling', 'BEST_SELLING', 'BEST_SELLING', false],
  ['title-ascending', 'TITLE', 'TITLE', false],
  ['title-descending', 'TITLE', 'TITLE', true],
  ['price-ascending', 'PRICE', 'PRICE', false],
  ['price-descending', 'PRICE', 'PRICE', true],
  ['created-ascending', 'CREATED_AT', 'CREATED', false],
  ['created-descending', 'CREATED_AT', 'CREATED', true],
];

it('covers every sort the store offers, in the table above', () => {
  expect(BROWSE_CONTENT.sortOptions.map((option) => option.sort)).toEqual(
    TABLE.map(([sort]) => sort),
  );
});

it.each(TABLE)('maps %s: all books %s, a group %s, reverse %s', (sort, all, group, reverse) => {
  expect(collectionSort(sort)).toEqual({ sortKey: group, reverse });
  if (all !== null) expect(allBooksSort(sort)).toEqual({ sortKey: all, reverse });
});

it('reads all books A-Z if Featured ever arrives there, as all books are no collection', () => {
  expect(allBooksSort('featured')).toEqual({ sortKey: 'TITLE', reverse: false });
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
