/**
 * The wanted list (P6-11, D-115, D-116): names of authors, series or titles the owner is thinking
 * of stocking, read from one Remote Config parameter (`WANTED_LIST.parameter`) of JSON type, a
 * plain list of strings. When a search finds nothing and matches nothing in the store's own
 * catalogue, the `search` event can record which listed name it matched, by the name's code
 * (`matchWantedName` in `searchMatch.ts`, D-117). Never the name, never the term.
 *
 * Each name's code is made by the app exactly as D-109 makes an author's code (`authorCode`).
 * The value is untrusted input: a value that is not JSON or not a list is ignored as a whole;
 * inside a list, a bad entry is dropped alone. What was dropped is summarised by reason codes and
 * counts only, for one Sentry warning per launch; a name or a value never leaves this file.
 *
 * A pure function; nothing here logs or throws, whatever the value.
 */

import { WANTED_LIST, type RawRemoteConfigValue } from '@/config';

import type { AnalyticsToken } from './ids';
import { authorCode, matchWords } from './searchMatch';

/** One kept name: its code, and its normalised words for matching (D-109, rule 1). */
export type WantedName = { readonly code: AnalyticsToken; readonly words: readonly string[] };

export type WantedList = readonly WantedName[];

/** Why the whole value was ignored. */
export type WantedListRejection = 'not_json' | 'not_list';

/** Why one entry was dropped, in the order the checks run. */
export const WANTED_LIST_DROP_REASONS = [
  'over_limit',
  'not_string',
  'empty',
  'too_long',
  'no_code',
  'common_words_only',
  'duplicate_code',
] as const;

export type WantedListDropReason = (typeof WANTED_LIST_DROP_REASONS)[number];

export type ParsedWantedList = {
  readonly list: WantedList;
  /** `remote` when a Remote Config value was used (even if every entry was dropped). */
  readonly source: 'remote' | 'default';
  /** Reason codes and counts only, for Sentry; undefined when nothing was dropped or ignored. */
  readonly problem: string | undefined;
};

const NOTHING: ParsedWantedList = { list: [], source: 'default', problem: undefined };

function readJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

/** The whole value is ignored: the compiled default (an empty list) is used. */
function ignored(rejection: WantedListRejection): ParsedWantedList {
  return { list: [], source: 'default', problem: `ignored (${rejection})` };
}

/** The entry as kept, or why it is dropped. */
function checkEntry(
  entry: unknown,
  common: ReadonlySet<string>,
  codes: ReadonlySet<string>,
): WantedListDropReason | WantedName {
  if (typeof entry !== 'string') return 'not_string';
  const name = entry.trim();
  if (name === '') return 'empty';
  if ([...name].length > WANTED_LIST.maxNameLength) return 'too_long';
  const words = matchWords(name);
  const code = authorCode(name);
  if (words.length === 0 || code === undefined) return 'no_code';
  if (words.every((word) => common.has(word))) return 'common_words_only';
  if (codes.has(code)) return 'duplicate_code';
  return { code, words };
}

/**
 * Only a value whose source is `remote` counts (D-046): `default`, `static` or no value means
 * Remote Config has nothing, and the compiled default (an empty list) is used with nothing to
 * report. `commonWords` is `SEARCH_CONTENT.matchCommonWords` (D-109).
 */
export function parseWantedList(
  raw: RawRemoteConfigValue | undefined,
  commonWords: readonly string[],
): ParsedWantedList {
  if (raw?.source !== 'remote') return NOTHING;

  const json = readJson(raw.value);
  if (!json.ok) return ignored('not_json');
  if (!Array.isArray(json.value)) return ignored('not_list');

  const entries: readonly unknown[] = json.value;
  const common = new Set(commonWords.flatMap(matchWords));
  const codes = new Set<string>();
  const list: WantedName[] = [];
  const dropped = new Map<WantedListDropReason, number>();
  const drop = (reason: WantedListDropReason, count = 1) =>
    dropped.set(reason, (dropped.get(reason) ?? 0) + count);

  const kept = entries.slice(0, WANTED_LIST.maxEntries);
  if (entries.length > kept.length) drop('over_limit', entries.length - kept.length);
  for (const entry of kept) {
    const result = checkEntry(entry, common, codes);
    if (typeof result === 'string') {
      drop(result);
      continue;
    }
    codes.add(result.code);
    list.push(result);
  }

  const counts = WANTED_LIST_DROP_REASONS.flatMap((reason) => {
    const count = dropped.get(reason);
    return count === undefined ? [] : [`${reason} ${count}`];
  });
  return {
    list,
    source: 'remote',
    problem: counts.length === 0 ? undefined : `dropped entries (${counts.join(', ')})`,
  };
}
