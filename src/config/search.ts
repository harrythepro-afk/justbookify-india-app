/**
 * What search offers for the India store (P6-06): its wording, its sorts and when it runs
 * (architect's view of the live search, 8 October 2026; owner at plan review; D-097, D-098).
 * Store-specific: a second store (Bahrain) gets its own content, never a change to the screen.
 */

import { BROWSE_CONTENT, type BookSort } from './browse';

/** A sort search offers. `src/shopify/sort.ts` maps each to Shopify's search sort keys. */
export type SearchSort = 'relevance' | Extract<BookSort, 'price-ascending' | 'price-descending'>;

export type SearchSortOption = { readonly sort: SearchSort; readonly label: string };

export type SearchContent = {
  /** The screen's header. */
  readonly title: string;
  /** In the empty search field. */
  readonly placeholder: string;
  /** Shown before a search runs. */
  readonly hint: string;
  /** The clear button's accessible name, as on the website ("Clear search term"; owner, review). */
  readonly clearLabel: string;
  /** In the website's order: Relevance, then the two price sorts in Browse's wording. */
  readonly sortOptions: readonly SearchSortOption[];
  readonly defaultSort: SearchSort;
  /** Letters or digits a term needs before typing runs a search (owner, answer 3). */
  readonly typingMinimum: number;
  /** Letters or digits a term needs before the keyboard's search key runs it (owner, answer 3). */
  readonly searchKeyMinimum: number;
  /** The pause after the last keystroke before a typed term is searched, in milliseconds. */
  readonly typingPauseMs: number;
  /** The longest term sent, in characters (code points). */
  readonly maxTermLength: number;
  /**
   * Words that never match the catalogue on their own (D-109): a term made only of these matches
   * a series, an age group, a genre, an author or a title only when it is the whole name.
   */
  readonly matchCommonWords: readonly string[];
};

function browseLabel(sort: BookSort): string {
  return BROWSE_CONTENT.sortOptions.find((option) => option.sort === sort)?.label ?? '';
}

export const SEARCH_CONTENT: SearchContent = {
  title: 'Search',
  placeholder: 'Search books',
  hint: "Type a book's title or the author's name.",
  clearLabel: 'Clear search',
  sortOptions: [
    { sort: 'relevance', label: 'Relevance' },
    { sort: 'price-ascending', label: browseLabel('price-ascending') },
    { sort: 'price-descending', label: browseLabel('price-descending') },
  ],
  defaultSort: 'relevance',
  typingMinimum: 3,
  searchKeyMinimum: 2,
  typingPauseMs: 300,
  maxTermLength: 100,
  // Owner and architect, P6-09 plan review (answer 3).
  matchCommonWords: [
    'a',
    'an',
    'the',
    'and',
    'of',
    'in',
    'on',
    'at',
    'to',
    'for',
    'with',
    'by',
    'is',
    'my',
  ],
};

/** Shopify's search count stops at 1,000 (`totalCount`, Storefront API 2026-10). */
const COUNT_CAP = 1000;

/** The count line, as on the website: "1 result", "7 results", "1,000+ results". */
export function resultCountLabel(total: number): string {
  if (total >= COUNT_CAP) return '1,000+ results';
  return total === 1 ? '1 result' : `${total} results`;
}

/**
 * What a search with no books says (owner, answer 4). With "Available now" off, the website's own
 * line. With it on, a mistyped word would find nothing either way, so the spelling is mentioned too.
 */
export function noResultsMessage(term: string, available: boolean): string {
  return available
    ? `No available books found for “${term}”. Switch off Available now to see rented-out books, or check the spelling.`
    : `No results found for “${term}”. Check the spelling or use a different word or phrase.`;
}
