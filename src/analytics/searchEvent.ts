/**
 * When the `search` event is sent (P6-09, D-108). Once per term in one visit to the search screen
 * (one mounting), when that term's own results have stayed on screen for 2 seconds; at once when
 * the keyboard's search key was pressed for it (as soon as its first page arrives); and at once
 * when a book is opened from its results before the 2 seconds are up (owner, plan review). A
 * sort, "Available now" or "Load more" never sends it again. A new term, an empty field, a failed
 * read or leaving the screen before then sends nothing. "The same term" is the cleaned term with
 * letter case ignored.
 *
 * The event carries the term's length (letters and digits, as the search counts them, D-097),
 * Shopify's count (at most 1,000) and what the term matched in the store's own catalogue
 * (`searchMatch.ts`, D-109). It waits for the store's series, age groups and genres to be read (or
 * to fail) so that a match is not missed. The term itself is never sent, logged or reported.
 *
 * The wanted list (P6-11, D-117): only when the catalogue gave `other` and the results the event is
 * based on found no books with "Available now" off, the term is matched against the store's wanted
 * list, and a hit sends `wanted` with the listed name's code. The event also waits for this
 * launch's list (frozen within 3 seconds of start-up, D-046).
 */

import { useCallback, useEffect, useRef } from 'react';

import { countLettersAndDigits } from '@/shopify/searchTerm';

import { trackSearch } from './events';
import {
  matchSearchTerm,
  matchWantedName,
  type SearchMatchBook,
  type SearchMatchCatalogue,
} from './searchMatch';
import type { WantedList } from './wantedList';

export type { SearchMatchGroup } from './searchMatch';

/** How long a term's results stay on screen before its event is sent. */
export const SEARCH_EVENT_DELAY_MS = 2000;

/** Shopify's search count stops at 1,000 (`totalCount`, Storefront API 2026-10). */
const RESULT_COUNT_CAP = 1000;

/** A term's own first page, as shown: never a placeholder from an earlier term or setting. */
export type ShownSearchResults = {
  readonly term: string;
  readonly totalCount: number;
  readonly books: readonly SearchMatchBook[];
  /** Whether "Available now" was on when this page was read. */
  readonly available: boolean;
};

/** The catalogue a term is matched against besides its own results; null until it is read. */
export type SearchMatchLists = Omit<SearchMatchCatalogue, 'books'>;

function keyOf(term: string): string {
  return term.toLowerCase();
}

export type SearchEvent = {
  /** The search key was pressed for `term`: send as soon as its first page is shown. */
  readonly sendWhenShown: (term: string) => void;
  /** A book is being opened from the current term's results: send now if they are shown. */
  readonly sendNow: () => void;
};

/**
 * `term` is the term being searched (null for none); `shown` its own first page once it has
 * arrived (null while it loads or an earlier term's results stand in; while a new sort or "Available
 * now" loads for the same term, its earlier results stay on screen and still count); `failed` is
 * true while an error has replaced the results; `lists` the series, age groups and genres, null
 * until both reads have arrived or failed; `wanted` this launch's wanted list, null until frozen.
 */
export function useSearchEvent(options: {
  readonly term: string | null;
  readonly shown: ShownSearchResults | null;
  readonly failed: boolean;
  readonly lists: SearchMatchLists | null;
  readonly wanted: WantedList | null;
}): SearchEvent {
  const { term, shown, failed, lists, wanted } = options;
  const sent = useRef(new Set<string>());
  const due = useRef(new Set<string>());
  const currentKey = useRef<string | null>(null);
  const latest = useRef<{ key: string; results: ShownSearchResults } | null>(null);
  const listsRef = useRef<SearchMatchLists | null>(null);
  const wantedRef = useRef<WantedList | null>(null);
  const timer = useRef<{ key: string; handle: ReturnType<typeof setTimeout> } | null>(null);

  const stopTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current.handle);
    timer.current = null;
  }, []);

  const trySend = useCallback(
    (key: string) => {
      if (sent.current.has(key) || !due.current.has(key)) return;
      const results = latest.current?.key === key ? latest.current.results : null;
      const matchLists = listsRef.current;
      const wantedList = wantedRef.current;
      if (results === null || matchLists === null || wantedList === null) return;
      sent.current.add(key);
      due.current.delete(key);
      if (timer.current?.key === key) stopTimer();
      const catalogueMatch = matchSearchTerm(results.term, { ...matchLists, books: results.books });
      // The catalogue always comes first; the wanted list counts only for a search that found no
      // books with "Available now" off (D-117).
      const checkWanted =
        catalogueMatch.match_type === 'other' && results.totalCount === 0 && !results.available;
      trackSearch({
        term_length: countLettersAndDigits(results.term),
        result_count: Math.min(results.totalCount, RESULT_COUNT_CAP),
        ...(checkWanted
          ? matchWantedName(results.term, wantedList, matchLists.commonWords)
          : catalogueMatch),
      });
    },
    [stopTimer],
  );

  useEffect(() => {
    listsRef.current = lists;
    wantedRef.current = wanted;
    const key = term === null ? null : keyOf(term);
    currentKey.current = key;
    if (timer.current !== null && timer.current.key !== key) stopTimer();
    // Anything still due for an earlier term is dropped: its results are no longer on screen.
    for (const dueKey of [...due.current]) if (dueKey !== key) due.current.delete(dueKey);
    if (key === null || failed) {
      // The error replaced the results: they are no longer on screen.
      stopTimer();
      if (key !== null) due.current.delete(key);
      latest.current = null;
      return;
    }
    if (shown !== null && keyOf(shown.term) === key) latest.current = { key, results: shown };
    else if (latest.current?.key !== key) latest.current = null;
    if (sent.current.has(key)) return;
    if (due.current.has(key)) {
      trySend(key);
      return;
    }
    if (latest.current !== null && timer.current === null) {
      timer.current = {
        key,
        handle: setTimeout(() => {
          timer.current = null;
          due.current.add(key);
          trySend(key);
        }, SEARCH_EVENT_DELAY_MS),
      };
    }
  }, [term, shown, failed, lists, wanted, stopTimer, trySend]);

  // Leaving the screen sends nothing more.
  useEffect(() => stopTimer, [stopTimer]);

  const sendWhenShown = useCallback(
    (searched: string) => {
      const key = keyOf(searched);
      if (sent.current.has(key)) return;
      due.current.add(key);
      trySend(key);
    },
    [trySend],
  );

  const sendNow = useCallback(() => {
    const key = currentKey.current;
    if (key === null || latest.current?.key !== key || sent.current.has(key)) return;
    due.current.add(key);
    trySend(key);
  }, [trySend]);

  return { sendWhenShown, sendNow };
}
