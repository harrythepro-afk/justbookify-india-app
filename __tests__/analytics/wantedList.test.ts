/**
 * The wanted list (P6-11, D-115, D-116): parsed from Remote Config as untrusted input. A value that
 * is not JSON or not a list is ignored whole; inside a list each bad entry is dropped alone; what
 * was dropped is summarised by reason codes and counts only, never a name or a value.
 */

import {
  parseWantedList,
  WANTED_LIST_DROP_REASONS,
  type ParsedWantedList,
} from '@/analytics/wantedList';
import { SEARCH_CONTENT, WANTED_LIST } from '@/config';

function parse(value: string): ParsedWantedList {
  return parseWantedList({ value, source: 'remote' }, SEARCH_CONTENT.matchCommonWords);
}

function parseList(entries: readonly unknown[]): ParsedWantedList {
  return parse(JSON.stringify(entries));
}

function codes(parsed: ParsedWantedList): string[] {
  return parsed.list.map((name) => name.code);
}

describe('the parameter (D-115)', () => {
  it('is search_wanted_list, with 200 entries of at most 100 characters', () => {
    expect(WANTED_LIST).toEqual({
      parameter: 'search_wanted_list',
      maxEntries: 200,
      maxNameLength: 100,
    });
  });

  it('makes each code as D-109 makes an author’s code, and keeps the words for matching', () => {
    const parsed = parseList(['David Walliams', 'Rick Riordan', 'Tintin', 'Harry Potter']);

    expect(parsed).toEqual({
      list: [
        { code: 'david_walliams', words: ['david', 'walliams'] },
        { code: 'rick_riordan', words: ['rick', 'riordan'] },
        { code: 'tintin', words: ['tintin'] },
        { code: 'harry_potter', words: ['harry', 'potter'] },
      ],
      source: 'remote',
      problem: undefined,
    });
  });

  it('normalises accents, apostrophes, punctuation and spaces as D-109 does', () => {
    expect(codes(parseList(['  Hergé’s  Tintin! ', 'J.K. Rowling', 'Mary-Pope Osborne']))).toEqual([
      'herges_tintin',
      'j_k_rowling',
      'mary_pope_osborne',
    ]);
  });

  it.each([
    ['default', 'default' as const],
    ['static', 'static' as const],
  ])('gives the empty default with nothing to report for a %s value', (_case, source) => {
    expect(parseWantedList({ value: '["David Walliams"]', source }, [])).toEqual({
      list: [],
      source: 'default',
      problem: undefined,
    });
  });

  it('gives the empty default with nothing to report when Remote Config has no value', () => {
    expect(parseWantedList(undefined, [])).toEqual({
      list: [],
      source: 'default',
      problem: undefined,
    });
  });

  it('accepts an empty list with nothing to report', () => {
    expect(parse('[]')).toEqual({ list: [], source: 'remote', problem: undefined });
  });
});

describe('a value ignored as a whole (D-116)', () => {
  it.each([
    ['not JSON', 'David Walliams, Rick Riordan', 'not_json'],
    ['an empty string', '', 'not_json'],
    ['cut-off JSON', '["David Walliams", "Rick', 'not_json'],
    ['an object', '{"names": ["David Walliams"]}', 'not_list'],
    ['a string', '"David Walliams"', 'not_list'],
    ['a number', '42', 'not_list'],
    ['null', 'null', 'not_list'],
  ])('ignores %s and uses the empty default', (_case, value, reason) => {
    expect(parse(value)).toEqual({ list: [], source: 'default', problem: `ignored (${reason})` });
  });
});

describe('entries dropped alone (D-116)', () => {
  it.each([
    ['not a string', [42, null, true, ['David Walliams'], { name: 'x' }], 'not_string', 5],
    ['empty', ['', '   '], 'empty', 2],
    ['longer than 100 characters', ['a'.repeat(101)], 'too_long', 1],
    ['without a code: no Latin letters', ['हैरी पॉटर', '!!!'], 'no_code', 2],
    ['without a code: a leading digit', ['1984'], 'no_code', 1],
    ['without a code: a run of seven digits', ['Asha 9876543210'], 'no_code', 1],
    ['made only of common words', ['The', 'Of the'], 'common_words_only', 2],
  ])('drops an entry %s and keeps the others', (_case, bad, reason, count) => {
    const parsed = parseList(['David Walliams', ...bad, 'Rick Riordan']);

    expect(codes(parsed)).toEqual(['david_walliams', 'rick_riordan']);
    expect(parsed.source).toBe('remote');
    expect(parsed.problem).toBe(`dropped entries (${reason} ${count})`);
  });

  it('keeps a name of exactly 100 characters, counted in code points', () => {
    const name = `Asha ${'é'.repeat(95)}`;
    expect([...name]).toHaveLength(100);

    const parsed = parseList([name]);

    expect(parsed.list).toHaveLength(1);
    expect(parsed.problem).toBeUndefined();
  });

  it('drops a later entry whose code an earlier one has: case, accents, spacing', () => {
    const parsed = parseList([
      'David Walliams',
      'DAVID WALLIAMS',
      'Dávid  Walliams',
      'david-walliams',
    ]);

    expect(codes(parsed)).toEqual(['david_walliams']);
    expect(parsed.problem).toBe('dropped entries (duplicate_code 3)');
  });

  it('drops the second of two long names whose codes are the same 40 characters', () => {
    const first = 'Alexander Montgomery Fitzwilliam Smythe Senior';
    const second = 'Alexander Montgomery Fitzwilliam Smythe Junior';
    const parsed = parseList([first, second]);

    expect(codes(parsed)).toEqual(['alexander_montgomery_fitzwilliam_smythe']);
    // The words stay whole for matching; only the code is cut.
    expect(parsed.list[0]?.words).toEqual([
      'alexander',
      'montgomery',
      'fitzwilliam',
      'smythe',
      'senior',
    ]);
    expect(parsed.problem).toBe('dropped entries (duplicate_code 1)');
  });

  it('keeps the first 200 entries and counts the rest', () => {
    const names = Array.from({ length: 201 }, (_, index) => `Author ${toLetters(index)}`);

    const parsed = parseList(names);

    expect(parsed.list).toHaveLength(200);
    expect(parsed.list[199]?.code).toBe(`author_${toLetters(199)}`);
    expect(parsed.problem).toBe('dropped entries (over_limit 1)');
  });

  it('counts a very long list after the 200th without reading it', () => {
    const names = Array.from({ length: 5000 }, (_, index) =>
      index < 200 ? `Author ${toLetters(index)}` : index,
    );

    const parsed = parseList(names);

    expect(parsed.list).toHaveLength(200);
    // The numbers after the 200th are never checked, so never counted as not_string.
    expect(parsed.problem).toBe('dropped entries (over_limit 4800)');
  });

  it('counts the 200 by position in the list, dropped entries included', () => {
    const names = ['', ...Array.from({ length: 200 }, (_, index) => `Author ${toLetters(index)}`)];

    const parsed = parseList(names);

    expect(parsed.list).toHaveLength(199);
    expect(parsed.problem).toBe('dropped entries (over_limit 1, empty 1)');
  });

  it('lists every reason that applied, in a fixed order, with its count', () => {
    const parsed = parseList([
      'Rick Riordan',
      'rick riordan',
      'The',
      '1984',
      'b'.repeat(101),
      '',
      7,
      'Tintin',
    ]);

    expect(codes(parsed)).toEqual(['rick_riordan', 'tintin']);
    expect(parsed.problem).toBe(
      'dropped entries (not_string 1, empty 1, too_long 1, no_code 1, common_words_only 1, duplicate_code 1)',
    );
    expect(WANTED_LIST_DROP_REASONS).toEqual([
      'over_limit',
      'not_string',
      'empty',
      'too_long',
      'no_code',
      'common_words_only',
      'duplicate_code',
    ]);
  });
});

describe('privacy (D-116)', () => {
  const PRIVATE = [
    'Asha Rao',
    'asha.rao@example.com',
    '+91 98765 43210',
    'Asha 9876543210',
    'The',
    '',
    'x'.repeat(101),
    'Asha Rao',
  ];

  it('never puts a name or a value in the report, only reason codes and counts', () => {
    const parsed = parseList(PRIVATE);

    expect(parsed.problem).toMatch(/^dropped entries \(([a-z_]+ \d+(, )?)+\)$/);
    expect(parsed.problem).not.toMatch(/asha|rao|example|98765|43210|xxx/i);
  });

  it.each(['Asha Rao, 9876543210', '{"Asha Rao": 1}', '"asha.rao@example.com"'])(
    'never puts an ignored value in the report (%p)',
    (value) => {
      const parsed = parse(value);

      expect(parsed.problem).toMatch(/^ignored \((not_json|not_list)\)$/);
    },
  );

  it('never throws, whatever the value', () => {
    const hostile = ['[', ']', '[[[[[[[[[[]]]]]]]]]]', '\u0000', '[{"__proto__": 1}]', '"\\ud800"'];
    for (const value of hostile) expect(() => parse(value)).not.toThrow();
  });
});

/** 0 → a, 25 → z, 26 → ba: letters only, so a code never holds a digit run. */
function toLetters(index: number): string {
  let text = '';
  let rest = index;
  do {
    text = String.fromCharCode(97 + (rest % 26)) + text;
    rest = Math.floor(rest / 26);
  } while (rest > 0);
  return text;
}
