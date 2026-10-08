/**
 * The search term is untrusted text (P6-06, D-097): trimmed, single-spaced, cut to 100 code
 * points, otherwise sent as typed; only letters and digits count towards the minimum (typing 3,
 * the search key 2; owner, answers 2 and 3); nothing throws, whatever the input.
 */

import { SEARCH_CONTENT } from '@/config';
import { cleanSearchTerm, countLettersAndDigits, searchableTerm } from '@/shopify/searchTerm';

describe('cleanSearchTerm', () => {
  it('trims the term and turns each run of spaces, tabs or line breaks into one space', () => {
    expect(cleanSearchTerm('   roald \t\n  dahl  ')).toBe('roald dahl');
  });

  it('keeps Shopify search syntax as typed, as the website does (owner, answer 2)', () => {
    for (const term of ['"harry"', '"harry', 'title:harry', 'harry:', '-harry', 'harry OR']) {
      expect(cleanSearchTerm(term)).toBe(term);
    }
  });

  it('keeps emoji and other scripts whole', () => {
    expect(cleanSearchTerm('harry 😀')).toBe('harry 😀');
    expect(cleanSearchTerm('हैरी')).toBe('हैरी');
  });

  it('cuts a long term to 100 code points', () => {
    expect(SEARCH_CONTENT.maxTermLength).toBe(100);
    expect(cleanSearchTerm('a'.repeat(250))).toBe('a'.repeat(100));
    expect(Array.from(cleanSearchTerm('x'.repeat(10_000))).length).toBe(100);
  });

  it('never splits an emoji at the cut', () => {
    const term = cleanSearchTerm(`${'a'.repeat(99)}😀😀`);
    expect(Array.from(term)).toHaveLength(100);
    expect(term.endsWith('😀')).toBe(true);
    // No lone surrogate is left at the end.
    expect(term.charCodeAt(term.length - 1)).toBe('😀'.charCodeAt(1));
  });

  it('drops a space left at the end by the cut', () => {
    expect(cleanSearchTerm(`${'a'.repeat(99)} b`)).toBe('a'.repeat(99));
  });

  it('never throws on hostile input', () => {
    const hostile = [
      '',
      ' ',
      '\u0000\u0001\u001f',
      '\uD83D',
      '\uDE00abc',
      '\\',
      '\\"',
      '${query}',
      '{ products { nodes { id } } }',
      '") { id } #',
      '‮evil',
      'a'.repeat(1_000_000),
    ];
    for (const raw of hostile) {
      expect(() => cleanSearchTerm(raw)).not.toThrow();
      expect(() => searchableTerm(raw, 'typing')).not.toThrow();
      expect(() => searchableTerm(raw, 'search-key')).not.toThrow();
      expect(Array.from(cleanSearchTerm(raw)).length).toBeLessThanOrEqual(100);
    }
  });
});

describe('countLettersAndDigits', () => {
  it('counts letters and digits in any script, and nothing else', () => {
    expect(countLettersAndDigits('harry')).toBe(5);
    expect(countLettersAndDigits('book 7')).toBe(5);
    expect(countLettersAndDigits('*&%#-:"() 😀')).toBe(0);
    expect(countLettersAndDigits('ह र')).toBe(2);
  });
});

describe('searchableTerm', () => {
  it('searches while typing from 3 letters or digits (owner, answer 3)', () => {
    expect(SEARCH_CONTENT.typingMinimum).toBe(3);
    expect(searchableTerm('ha', 'typing')).toBeNull();
    expect(searchableTerm('har', 'typing')).toBe('har');
    expect(searchableTerm('  har  ', 'typing')).toBe('har');
  });

  it('searches from 2 with the search key, for a short whole word (owner, answer 3)', () => {
    expect(SEARCH_CONTENT.searchKeyMinimum).toBe(2);
    expect(searchableTerm('h', 'search-key')).toBeNull();
    expect(searchableTerm('ha', 'search-key')).toBe('ha');
  });

  it('never searches for symbols alone (owner, answer 2)', () => {
    for (const raw of ['*', '&&', '%', '###', '-:-', '"""', '😀😀😀', '( )']) {
      expect(searchableTerm(raw, 'typing')).toBeNull();
      expect(searchableTerm(raw, 'search-key')).toBeNull();
    }
  });

  it('counts only letters and digits, but sends the whole term', () => {
    expect(searchableTerm('-ha', 'typing')).toBeNull();
    expect(searchableTerm('-har', 'typing')).toBe('-har');
    expect(searchableTerm('"ha"', 'search-key')).toBe('"ha"');
    expect(searchableTerm('a: b', 'search-key')).toBe('a: b');
  });
});
