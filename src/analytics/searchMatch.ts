/**
 * What a search term matched in the store's own catalogue (P6-09, D-109), so the `search` event
 * can say what was searched for without ever sending the term (D-108). The result is a type and
 * that item's ID or code, built from the store's data, never from the typed text:
 *
 * 1. The term and every name are normalised the same way: Unicode NFKD, accents removed,
 *    lowercase, apostrophes deleted, every other character that is not a letter or a digit a
 *    space. So `DAHL`, `Dahl!` and `dahl` are the same; `J.K. Rowling` is `j k rowling`.
 * 2. A term that uses Shopify's search syntax (a word starting with `-`; a colon, a quote mark, an
 *    asterisk or a bracket; `AND`, `OR` or `NOT` in capitals) is `other`: `-dahl` excludes Dahl.
 * 3. Level 1: the term's words are exactly the name's words.
 * 4. Level 2: the term's words appear in the name as consecutive whole words, unless the term is
 *    made only of common words (store configuration). Partial words never match: `harr` is not
 *    `harry`.
 * 5. A type matches only when every hit in it has the same ID; an ambiguous type is skipped.
 * 6. Level 1 before level 2; within a level, series, age group, genre, author, then title.
 * 7. An author is sent as a code made from the store's own author name (`roald_dahl`); a name
 *    that cannot be made into a code never matches.
 *
 * A pure function; nothing here logs or throws, whatever the term.
 */

import type { SearchMatch } from './events';
import {
  analyticsCollectionId,
  analyticsProductId,
  analyticsTaxonomyValueId,
  analyticsToken,
} from './ids';

/** A book on the search's own first page of results. */
export type SearchMatchBook = {
  /** The product's GID. */
  readonly id: string;
  readonly title: string;
  /** The vendor, as stored. */
  readonly author: string;
};

/** A configured series or age group the store has, by its shown name. */
export type SearchMatchGroup = { readonly name: string; readonly collectionGid: string };

/** One of the store's genre names and the taxonomy value it stands for (D-102). */
export type SearchMatchGenre = { readonly name: string; readonly taxonomyValueGid: string };

export type SearchMatchCatalogue = {
  readonly books: readonly SearchMatchBook[];
  readonly series: readonly SearchMatchGroup[];
  readonly ageGroups: readonly SearchMatchGroup[];
  readonly genres: readonly SearchMatchGenre[];
  readonly commonWords: readonly string[];
};

const OTHER: SearchMatch = { match_type: 'other' };

const APOSTROPHES = /['’‘`]/g;
const COMBINING_MARKS = /\p{M}/gu;
const NOT_LETTER_OR_DIGIT = /[^\p{L}\p{N}]+/gu;

/** The words of a term or a name, normalised (rule 1). */
export function matchWords(text: string): readonly string[] {
  return text
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(APOSTROPHES, '')
    .replace(NOT_LETTER_OR_DIGIT, ' ')
    .trim()
    .split(' ')
    .filter((word) => word !== '');
}

const SYNTAX_CHARACTERS = /[:"“”„*()]/;
const EXCLUDED_WORD = /(^|\s)-/;
const OPERATOR = /(^|\s)(AND|OR|NOT)(\s|$)/;

/** Whether the term uses Shopify's search syntax (rule 2). */
export function usesSearchSyntax(term: string): boolean {
  return SYNTAX_CHARACTERS.test(term) || EXCLUDED_WORD.test(term) || OPERATOR.test(term);
}

/** The code for a store author name (rule 7): its words joined by `_`, at most 40 characters. */
export function authorCode(name: string) {
  const code = matchWords(name).join('_').slice(0, 40).replace(/_+$/, '');
  return analyticsToken(code);
}

function sameWords(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((word, index) => word === b[index]);
}

function containsRun(name: readonly string[], run: readonly string[]): boolean {
  for (let start = 0; start + run.length <= name.length; start += 1) {
    if (run.every((word, offset) => name[start + offset] === word)) return true;
  }
  return false;
}

type Candidate<Id> = { readonly words: readonly string[]; readonly id: Id };

function candidates<Item, Id>(
  items: readonly Item[],
  name: (item: Item) => string,
  id: (item: Item) => Id | undefined,
): readonly Candidate<Id>[] {
  return items.flatMap((item) => {
    const itemId = id(item);
    const words = matchWords(name(item));
    return itemId === undefined || words.length === 0 ? [] : [{ words, id: itemId }];
  });
}

/** The one ID every hit shares, or undefined when there is none or they differ (rule 5). */
function onlyId<Id>(
  list: readonly Candidate<Id>[],
  hits: (words: readonly string[]) => boolean,
): Id | undefined {
  const ids = new Set<Id>();
  for (const candidate of list) if (hits(candidate.words)) ids.add(candidate.id);
  return ids.size === 1 ? [...ids][0] : undefined;
}

export function matchSearchTerm(term: string, catalogue: SearchMatchCatalogue): SearchMatch {
  if (usesSearchSyntax(term)) return OTHER;
  const words = matchWords(term);
  if (words.length === 0) return OTHER;

  const series = candidates(
    catalogue.series,
    (group) => group.name,
    (group) => analyticsCollectionId(group.collectionGid),
  );
  const ageGroups = candidates(
    catalogue.ageGroups,
    (group) => group.name,
    (group) => analyticsCollectionId(group.collectionGid),
  );
  const genres = candidates(
    catalogue.genres,
    (genre) => genre.name,
    (genre) => analyticsTaxonomyValueId(genre.taxonomyValueGid),
  );
  const authors = candidates(
    catalogue.books,
    (book) => book.author,
    (book) => authorCode(book.author),
  );
  const titles = candidates(
    catalogue.books,
    (book) => book.title,
    (book) => analyticsProductId(book.id),
  );

  const common = new Set(catalogue.commonWords.flatMap(matchWords));
  const onlyCommon = words.every((word) => common.has(word));
  const levels: ((name: readonly string[]) => boolean)[] = [(name) => sameWords(name, words)];
  if (!onlyCommon) levels.push((name) => containsRun(name, words));

  for (const hits of levels) {
    const seriesId = onlyId(series, hits);
    if (seriesId !== undefined) return { match_type: 'series', match_id: seriesId };
    const ageGroupId = onlyId(ageGroups, hits);
    if (ageGroupId !== undefined) return { match_type: 'age_group', match_id: ageGroupId };
    const genreId = onlyId(genres, hits);
    if (genreId !== undefined) return { match_type: 'genre', match_id: genreId };
    const authorId = onlyId(authors, hits);
    if (authorId !== undefined) return { match_type: 'author', match_id: authorId };
    const titleId = onlyId(titles, hits);
    if (titleId !== undefined) return { match_type: 'title', match_id: titleId };
  }
  return OTHER;
}
