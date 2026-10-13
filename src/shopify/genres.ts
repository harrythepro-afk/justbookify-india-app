/**
 * The Genre filter's options (P6-07, D-101, D-102). Shopify's Genre filter on a collection gives
 * each genre as a taxonomy value with a count and a ready-made `input`; its own label is
 * Shopify's built-in name ("Design"), which the app never reads or shows. The name the app shows
 * is the store's own: the `label` of the store's genre entry (`shopify--genre` metaobject) whose
 * `taxonomy_reference` is that value ("Manga"). Shopify stays the only source: no genre name is
 * configured in the app.
 *
 * Pure functions: the caller reads the data and reports the faults (by code only, once per
 * session).
 */

/** One genre as Shopify filters by it: a taxonomy metafield value (the value's `input`). */
export type GenreFilter = {
  readonly namespace: string;
  readonly key: string;
  /** The taxonomy value's ID, such as `gid://shopify/TaxonomyValue/15730`. */
  readonly value: string;
};

/** A genre a customer can choose: the store's name and the filter that lists its books. */
export type GenreOption = { readonly name: string; readonly filter: GenreFilter };

/** One value of a collection's Genre filter, as read: its count and input, never its label. */
export type GenreFilterValue = { readonly count: number; readonly input: unknown };

/** One of the store's genre entries: its name and the taxonomy value it stands for. */
export type GenreEntry = {
  readonly label: string | null;
  readonly taxonomyReference: string | null;
};

/** A data fault met while building the options, reported by code (D-102). */
export type GenreFault =
  'catalogue/genre-bad-input' | 'catalogue/genre-without-name' | 'catalogue/genre-shared-value';

const TAXONOMY_VALUE_GID_PREFIX = 'gid://shopify/TaxonomyValue/';

/** A taxonomy value's number: only digits, at most 20 of them. */
const TAXONOMY_VALUE_NUMBER = /^\d{1,20}$/;

/**
 * A genre's code in an in-app link (P6-10, D-113): its taxonomy value's number, such as `20853`
 * for `gid://shopify/TaxonomyValue/20853`; null for anything else. A link never carries a genre's
 * name.
 */
export function genreCode(taxonomyValueGid: string): string | null {
  if (!taxonomyValueGid.startsWith(TAXONOMY_VALUE_GID_PREFIX)) return null;
  const number = taxonomyValueGid.slice(TAXONOMY_VALUE_GID_PREFIX.length);
  return TAXONOMY_VALUE_NUMBER.test(number) ? number : null;
}

/**
 * A screen parameter read as a genre code (P6-10, D-113): only digits are accepted; anything
 * else, including a repeated parameter, is no code. The parameter is untrusted input.
 */
export function genreCodeFromParam(param: unknown): string | null {
  return typeof param === 'string' && TAXONOMY_VALUE_NUMBER.test(param) ? param : null;
}

/** The option a genre code stands for in a Genre list, or null when the list does not offer it. */
export function genreOptionForCode(
  options: readonly GenreOption[],
  code: string,
): GenreOption | null {
  return options.find((option) => genreCode(option.filter.value) === code) ?? null;
}

/** Between the names of two entries that stand for the same value. */
export const SHARED_NAME_SEPARATOR = ' / ';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * A filter value's `input` as a genre filter, or null when it is anything else. Shopify sends it
 * as JSON text; it is untrusted input, so only the exact taxonomy metafield shape is accepted.
 */
export function parseGenreInput(input: unknown): GenreFilter | null {
  let parsed: unknown = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const keys = Object.keys(parsed);
  if (keys.length !== 1 || keys[0] !== 'taxonomyMetafield') return null;
  const metafield: unknown = (parsed as { taxonomyMetafield: unknown }).taxonomyMetafield;
  if (typeof metafield !== 'object' || metafield === null) return null;
  const { namespace, key, value } = metafield as Record<string, unknown>;
  if (!isNonEmptyString(namespace) || !isNonEmptyString(key) || !isNonEmptyString(value)) {
    return null;
  }
  return { namespace, key, value };
}

/** Each taxonomy value's store names: trimmed, blank ones dropped, repeats once. */
function namesByValue(entries: readonly GenreEntry[]): Map<string, Set<string>> {
  const names = new Map<string, Set<string>>();
  for (const entry of entries) {
    const label = entry.label?.trim() ?? '';
    const value = entry.taxonomyReference?.trim() ?? '';
    if (label === '' || value === '') continue;
    const known = names.get(value) ?? new Set<string>();
    known.add(label);
    names.set(value, known);
  }
  return names;
}

/**
 * The options for a Genre list (D-101, D-102): only values with at least one book, each named by
 * the store's genre entry for that value, sorted A-Z by that name in the store's locale. A value
 * with no entry (or only blank labels) is left out; two entries on one value give one option with
 * both names, A-Z, joined by " / ", because filtering by that value lists both sets of books; an
 * input that is not a taxonomy filter is left out. Each fault is returned once.
 */
export function toGenreOptions(
  values: readonly GenreFilterValue[],
  entries: readonly GenreEntry[],
  locale: string,
): { readonly options: readonly GenreOption[]; readonly faults: readonly GenreFault[] } {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const names = namesByValue(entries);
  const faults = new Set<GenreFault>();
  const options: GenreOption[] = [];
  for (const { count, input } of values) {
    if (!(count > 0)) continue;
    const filter = parseGenreInput(input);
    if (filter === null) {
      faults.add('catalogue/genre-bad-input');
      continue;
    }
    const valueNames = names.get(filter.value);
    if (valueNames === undefined) {
      faults.add('catalogue/genre-without-name');
      continue;
    }
    if (valueNames.size > 1) faults.add('catalogue/genre-shared-value');
    const name = [...valueNames].sort(collator.compare).join(SHARED_NAME_SEPARATOR);
    options.push({ name, filter });
  }
  options.sort((a, b) => collator.compare(a.name, b.name));
  return { options, faults: [...faults] };
}
