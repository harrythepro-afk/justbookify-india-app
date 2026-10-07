/**
 * The customer's search term is untrusted text (P6-06, D-097). It is trimmed, its runs of spaces
 * become one, and it is cut to the configured length by code point, so an emoji is never split.
 * Otherwise it is sent as typed, as the website sends it: only as a GraphQL variable, never inside
 * the operation's text. Shopify's own search syntax (`-word`, `OR`, `title:`) keeps its meaning
 * (owner, answer 2). Only letters and digits count towards the minimum length, so a term of
 * symbols alone never runs a search. Nothing here throws, whatever the input.
 */

import { SEARCH_CONTENT } from '@/config';

/** What starts a search: the pause after typing, or the keyboard's search key (owner, answer 3). */
export type SearchTrigger = 'typing' | 'search-key';

// Any letter or digit, in any script.
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** The term as it would be sent: trimmed, single-spaced and cut to the maximum length. */
export function cleanSearchTerm(raw: string): string {
  const single = raw.replace(/\s+/g, ' ').trim();
  const codePoints = Array.from(single);
  if (codePoints.length <= SEARCH_CONTENT.maxTermLength) return single;
  return codePoints.slice(0, SEARCH_CONTENT.maxTermLength).join('').trim();
}

/** How many letters and digits a term holds. */
export function countLettersAndDigits(term: string): number {
  let count = 0;
  for (const character of term) if (LETTER_OR_DIGIT.test(character)) count += 1;
  return count;
}

/**
 * The term to search for, or null when it is too short to search yet: typing searches from 3
 * letters or digits, the search key from 2, for a short whole word.
 */
export function searchableTerm(raw: string, trigger: SearchTrigger): string | null {
  const term = cleanSearchTerm(raw);
  const minimum =
    trigger === 'typing' ? SEARCH_CONTENT.typingMinimum : SEARCH_CONTENT.searchKeyMinimum;
  return countLettersAndDigits(term) >= minimum ? term : null;
}
