/**
 * What the Browse tab, "Books for Rent", offers for the India store (P6-04): its title, the
 * groups a customer can choose, and the sort options in the website's order and wording
 * (architect, live "Books for Rent" page, 7 October 2026; D-084, D-085). Store-specific: a second
 * store (Bahrain) gets its own content, never a change to the screen.
 */

import { HOME_CONTENT, type CollectionLink } from './home';

/** A sort the app offers. `src/shopify/sort.ts` maps each to Shopify's sort keys. */
export type BookSort =
  | 'featured'
  | 'best-selling'
  | 'title-ascending'
  | 'title-descending'
  | 'price-ascending'
  | 'price-descending'
  | 'created-ascending'
  | 'created-descending';

export type SortOption = {
  readonly sort: BookSort;
  /** The website's wording. */
  readonly label: string;
  /** Offered only inside a group: all books are not a collection, so they have no own order. */
  readonly groupOnly?: true;
};

export type BrowseContent = {
  /** The screen's heading. */
  readonly title: string;
  /** The "Age group" list. One group at a time, across both lists (D-084). */
  readonly ageGroups: readonly CollectionLink[];
  /** The "Series" list. */
  readonly series: readonly CollectionLink[];
  /** In the website's order, without "Most relevant" (D-085). */
  readonly sortOptions: readonly SortOption[];
  /** What a list opens with until the customer picks a sort. */
  readonly defaultSort: { readonly allBooks: BookSort; readonly group: BookSort };
};

export const BROWSE_CONTENT: BrowseContent = {
  title: 'Books for Rent',
  // The same lists as Home (D-075), so the two never drift apart. A longer series list comes
  // from the architect with the later filters task.
  ageGroups: HOME_CONTENT.ageGroups,
  series: HOME_CONTENT.popularSeries,
  sortOptions: [
    { sort: 'featured', label: 'Featured', groupOnly: true },
    { sort: 'best-selling', label: 'Best selling' },
    { sort: 'title-ascending', label: 'Alphabetically, A-Z' },
    { sort: 'title-descending', label: 'Alphabetically, Z-A' },
    { sort: 'price-ascending', label: 'Price, low to high' },
    { sort: 'price-descending', label: 'Price, high to low' },
    { sort: 'created-ascending', label: 'Date, old to new' },
    { sort: 'created-descending', label: 'Date, new to old' },
  ],
  defaultSort: { allBooks: 'title-ascending', group: 'featured' },
};

/** The sort options for a list: all of them inside a group, all but group-only ones otherwise. */
export function sortOptionsFor(inGroup: boolean): readonly SortOption[] {
  return inGroup
    ? BROWSE_CONTENT.sortOptions
    : BROWSE_CONTENT.sortOptions.filter((option) => option.groupOnly !== true);
}

/**
 * The sort a list uses (D-085). Until the customer picks one, the default: A-Z for all books,
 * Featured inside a group. A picked sort stays when the group changes, except a group-only one
 * (Featured), which becomes the all-books default when the customer returns to all books.
 */
export function effectiveSort(chosen: BookSort | null, inGroup: boolean): BookSort {
  const { defaultSort } = BROWSE_CONTENT;
  if (chosen === null) return inGroup ? defaultSort.group : defaultSort.allBooks;
  if (!inGroup && !sortOptionsFor(false).some((option) => option.sort === chosen)) {
    return defaultSort.allBooks;
  }
  return chosen;
}
