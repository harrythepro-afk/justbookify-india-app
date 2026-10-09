/**
 * What the Browse tab, "Books for Rent", offers for the India store (P6-04): its title, the
 * groups a customer can choose, and the sort options in the website's order and wording
 * (architect, live "Books for Rent" page, 7 October 2026; D-084, D-085); since P6-07, the
 * collection that holds every book (D-100), Shopify's Genre filter (D-101) and the longer series
 * list (D-103). Store-specific: a second store (Bahrain) gets its own content, never a change to
 * the screen. No genre name is configured: names come from the store (D-102).
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
  /**
   * Offered only inside a group (D-085): the collection that holds all books (D-100) has no order
   * of its own that means anything to a customer.
   */
  readonly groupOnly?: true;
};

export type BrowseContent = {
  /** The screen's heading. */
  readonly title: string;
  /**
   * The collection that holds every book, read when no group is chosen (D-100). Storefront
   * filters work only on a collection's products, so all books need one for the Genre filter.
   */
  readonly allBooksHandle: string;
  /** The "Age group" list. One group at a time, across both lists (D-084). */
  readonly ageGroups: readonly CollectionLink[];
  /** The "Series" list: Home's series first, then the longer list (D-103). */
  readonly series: readonly CollectionLink[];
  /**
   * Shopify's Genre filter (D-101): the filter's id among a collection's `filters`, and the type
   * of the store's genre entries, whose `label` is the name the app shows (D-102).
   */
  readonly genre: { readonly filterId: string; readonly entryType: string };
  /** In the website's order, without "Most relevant" (D-085). */
  readonly sortOptions: readonly SortOption[];
  /** What a list opens with until the customer picks a sort. */
  readonly defaultSort: { readonly allBooks: BookSort; readonly group: BookSort };
};

/**
 * The series after Home's 15, in the architect's order (P6-07, D-103). Only those the store has
 * are shown (D-076).
 */
const MORE_SERIES: readonly CollectionLink[] = [
  { handle: 'a-z-mysteries', label: 'A-Z Mysteries' },
  { handle: 'alex-rider', label: 'Alex Rider' },
  { handle: 'amar-chitra-katha', label: 'Amar Chitra Katha' },
  { handle: 'amulet', label: 'Amulet' },
  { handle: 'artemis-fowl', label: 'Artemis Fowl' },
  { handle: 'baby-sitters-little-sister', label: 'Baby-Sitters Little Sister' },
  { handle: 'bad-guys', label: 'Bad Guys' },
  { handle: 'big-nate-series', label: 'Big Nate' },
  { handle: 'cat-kid-comic-club', label: 'Cat Kid Comic Club' },
  { handle: 'chainsaw-man', label: 'Chainsaw Man' },
  { handle: 'dragon-ball-z-series', label: 'Dragon Ball Z' },
  { handle: 'dragon-masters', label: 'Dragon Masters' },
  { handle: 'goosebumps-series', label: 'Goosebumps' },
  { handle: 'his-dark-materials', label: 'His Dark Materials' },
  { handle: 'horrid-henry', label: 'Horrid Henry' },
  { handle: 'how-to-train-your-dragon', label: 'How to Train Your Dragon' },
  { handle: 'i-survived', label: 'I Survived' },
  { handle: 'investigators', label: 'Investigators' },
  { handle: 'jujutsu-kaisen', label: 'Jujutsu Kaisen' },
  { handle: 'keeper-of-the-lost-cities', label: 'Keeper of the Lost Cities' },
  { handle: 'lockwood-co', label: 'Lockwood & Co.' },
  { handle: 'magic-tree-house-series', label: 'Magic Tree House' },
  { handle: 'maze-runner', label: 'Maze Runner' },
  { handle: 'my-hero-academia', label: 'My Hero Academia' },
  { handle: 'nancy-drew', label: 'Nancy Drew' },
  { handle: 'one-of-us', label: 'One of Us' },
  { handle: 'one-piece', label: 'One Piece' },
  { handle: 'owl-diaries', label: 'Owl Diaries' },
  { handle: 'percy-jackson', label: 'Percy Jackson' },
  { handle: 'secret-seven-series', label: 'Secret Seven' },
  { handle: 'the-baby-sitters-club', label: 'The Baby-Sitters Club' },
  { handle: 'the-hunger-games', label: 'The Hunger Games' },
  { handle: 'the-inheritance-games', label: 'The Inheritance Games' },
  { handle: 'the-kane-chronicles', label: 'The Kane Chronicles' },
  { handle: 'the-trials-of-apollo', label: 'The Trials of Apollo' },
  { handle: 'thea-stilton', label: 'Thea Stilton' },
  { handle: 'tinkle', label: 'Tinkle' },
  { handle: 'tom-gates-series', label: 'Tom Gates' },
  { handle: 'treehouse-series', label: 'Treehouse' },
  { handle: 'vagabond', label: 'Vagabond' },
];

export const BROWSE_CONTENT: BrowseContent = {
  title: 'Books for Rent',
  allBooksHandle: 'all-books',
  // The same age groups as Home (D-075), so the two never drift apart.
  ageGroups: HOME_CONTENT.ageGroups,
  // Home keeps its 15; Browse lists them first, in Home's order, then the longer list (D-103).
  series: [...HOME_CONTENT.popularSeries, ...MORE_SERIES],
  genre: { filterId: 'filter.v.t.shopify.genre', entryType: 'shopify--genre' },
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
