/**
 * The search-match rules (P6-09, D-109): a term is recorded only as the store's own catalogue
 * item it matched, by ID or code, never as typed. Partial words, a term that matches two things,
 * letter case, punctuation and common words each have a rule.
 */

import {
  authorCode,
  matchSearchTerm,
  matchWantedName,
  matchWords,
  usesSearchSyntax,
  type SearchMatchBook,
  type SearchMatchCatalogue,
} from '@/analytics/searchMatch';
import { parseWantedList } from '@/analytics/wantedList';
import { SEARCH_CONTENT } from '@/config';

const HARRY_SERIES = 'gid://shopify/Collection/411000000001';
const TINTIN_SERIES = 'gid://shopify/Collection/411000000002';
const HUNGER_GAMES = 'gid://shopify/Collection/411000000003';
const BABY_SITTERS = 'gid://shopify/Collection/411000000004';
const CAT_KID = 'gid://shopify/Collection/411000000005';
const SIX_TO_EIGHT = 'gid://shopify/Collection/411000000006';
const MANGA = 'gid://shopify/TaxonomyValue/15730';
const FAIRY_TALE = 'gid://shopify/TaxonomyValue/2001';

let nextProduct = 900;
function book(title: string, author: string): SearchMatchBook {
  nextProduct += 1;
  return { id: `gid://shopify/Product/8000000000${nextProduct}`, title, author };
}

const HARRY_BOOKS = [
  book('Harry potter', 'J.k. Rowling'),
  book('Harry Potter and the Deathly Hallows', 'J.K. Rowling'),
  book('Harry Potter and the Order of the Phoenix', 'J.K. Rowling'),
  book('Harry Potter and the Goblet of Fire', 'J.K. Rowling'),
];
const DAHL_BOOKS = [
  book('Danny the Champion of the World', 'Roald Dahl'),
  book('James and the Giant Peach', 'Roald Dahl'),
  book('The BFG', 'Roald Dahl'),
];

function catalogue(books: readonly SearchMatchBook[]): SearchMatchCatalogue {
  return {
    books,
    series: [
      { name: 'Harry Potter', collectionGid: HARRY_SERIES },
      { name: 'Tintin', collectionGid: TINTIN_SERIES },
      { name: 'The Hunger Games', collectionGid: HUNGER_GAMES },
      { name: 'The Baby-Sitters Club', collectionGid: BABY_SITTERS },
      { name: 'Cat Kid Comic Club', collectionGid: CAT_KID },
    ],
    ageGroups: [{ name: '6-8 years', collectionGid: SIX_TO_EIGHT }],
    genres: [
      { name: 'Manga', taxonomyValueGid: MANGA },
      // Two store names on one value (D-102): the same ID either way.
      { name: 'Fairy tale', taxonomyValueGid: FAIRY_TALE },
      { name: 'Mythology', taxonomyValueGid: FAIRY_TALE },
    ],
    commonWords: SEARCH_CONTENT.matchCommonWords,
  };
}

describe('matchSearchTerm: the examples accepted at plan review', () => {
  it.each([
    // A partial name: the series is the one item that holds the word; seven titles do too, so
    // titles are ambiguous, and the series comes first anyway.
    ['harry', HARRY_BOOKS, { match_type: 'series', match_id: '411000000001' }],
    // The whole series name, which is also one book's whole title: the series comes first.
    ['Harry Potter', HARRY_BOOKS, { match_type: 'series', match_id: '411000000001' }],
    [
      'deathly hallows',
      HARRY_BOOKS,
      { match_type: 'title', match_id: HARRY_BOOKS[1]?.id.slice(22) },
    ],
    ['the bfg', DAHL_BOOKS, { match_type: 'title', match_id: DAHL_BOOKS[2]?.id.slice(22) }],
    ['bfg', DAHL_BOOKS, { match_type: 'title', match_id: DAHL_BOOKS[2]?.id.slice(22) }],
    ['dahl', DAHL_BOOKS, { match_type: 'author', match_id: 'roald_dahl' }],
    ['roald dahl', DAHL_BOOKS, { match_type: 'author', match_id: 'roald_dahl' }],
    // Two spellings of one author on the page are one code.
    ['j.k. rowling', HARRY_BOOKS, { match_type: 'author', match_id: 'j_k_rowling' }],
    ['rowling', HARRY_BOOKS, { match_type: 'author', match_id: 'j_k_rowling' }],
    // Works when the search finds nothing.
    ['tintin', [], { match_type: 'series', match_id: '411000000002' }],
    ['6-8 years', [], { match_type: 'age_group', match_id: '411000000006' }],
    ['manga', [], { match_type: 'genre', match_id: '15730' }],
    ['mythology', [], { match_type: 'genre', match_id: '2001' }],
    ['zzqxv', [], { match_type: 'other' }],
  ] as const)('%p gives %#', (term, books, expected) => {
    expect(matchSearchTerm(term, catalogue(books))).toEqual(expected);
  });
});

describe('partial words', () => {
  it.each(['harr', 'potte', 'dah', 'tinti', 'mang'])('%p matches nothing', (term) => {
    expect(matchSearchTerm(term, catalogue([...HARRY_BOOKS, ...DAHL_BOOKS]))).toEqual({
      match_type: 'other',
    });
  });

  it('matches words in order only: "potter harry" is not "Harry Potter"', () => {
    expect(matchSearchTerm('potter harry', catalogue(HARRY_BOOKS))).toEqual({
      match_type: 'other',
    });
  });
});

describe('a term that matches two things', () => {
  it('skips a type whose hits have different IDs and tries the next', () => {
    // "club" is in two series; one title holds it too.
    const clubBook = book('The Secret Club Mystery', 'Enid Blyton');
    expect(matchSearchTerm('club', catalogue([clubBook]))).toEqual({
      match_type: 'title',
      match_id: clubBook.id.slice(22),
    });
  });

  it('is other when the only hits are ambiguous', () => {
    // Two series hold "club"; there is no book to fall back on.
    expect(matchSearchTerm('club', catalogue([]))).toEqual({ match_type: 'other' });
    // Three titles hold "potter", but one series does, and it comes first.
    expect(matchSearchTerm('potter', catalogue(HARRY_BOOKS.slice(1)))).toEqual({
      match_type: 'series',
      match_id: '411000000001',
    });
  });

  it('prefers an exact name over a word run, whatever the type', () => {
    const wimpyBook = book('Wimpy', 'Jeff Kinney');
    const wimpy = {
      ...catalogue([wimpyBook]),
      series: [{ name: 'Wimpy Kid', collectionGid: CAT_KID }],
    };
    expect(matchSearchTerm('wimpy', wimpy)).toEqual({
      match_type: 'title',
      match_id: wimpyBook.id.slice(22),
    });
  });

  it('takes series, age group, genre, author, then title within a level', () => {
    const both = {
      ...catalogue([book('Geronimo Stilton', 'Geronimo Stilton')]),
      series: [{ name: 'Geronimo Stilton', collectionGid: TINTIN_SERIES }],
    };
    expect(matchSearchTerm('geronimo stilton', both)).toEqual({
      match_type: 'series',
      match_id: '411000000002',
    });
    const noSeries = { ...both, series: [] };
    expect(matchSearchTerm('geronimo stilton', noSeries)).toEqual({
      match_type: 'author',
      match_id: 'geronimo_stilton',
    });
  });
});

describe('letter case and punctuation', () => {
  it.each(['DAHL', 'Dahl', 'dahl!', '  dahl.', 'Dahl?'])('%p is the author', (term) => {
    expect(matchSearchTerm(term, catalogue(DAHL_BOOKS))).toEqual({
      match_type: 'author',
      match_id: 'roald_dahl',
    });
  });

  it('ignores accents and apostrophes on both sides', () => {
    const stone = book("Harry Potter and the Philosopher's Stone", 'J.K. Rowling');
    expect(matchSearchTerm('philosophers stone', catalogue([stone]))).toEqual({
      match_type: 'title',
      match_id: stone.id.slice(22),
    });
    const pokemon = book('Pokémon Adventures', 'Hidenori Kusaka');
    expect(matchSearchTerm('pokemon adventures', catalogue([pokemon]))).toEqual({
      match_type: 'title',
      match_id: pokemon.id.slice(22),
    });
  });

  it('treats a hyphen as a space', () => {
    expect(matchSearchTerm('baby sitters club', catalogue([]))).toEqual({
      match_type: 'series',
      match_id: '411000000004',
    });
  });

  it.each([
    '-dahl',
    'dahl -bfg',
    'title:dahl',
    '"roald dahl"',
    'dahl*',
    'dahl OR blyton',
    'NOT dahl',
    '(dahl)',
  ])('treats Shopify’s search syntax %p as other', (term) => {
    expect(usesSearchSyntax(term)).toBe(true);
    expect(matchSearchTerm(term, catalogue(DAHL_BOOKS))).toEqual({ match_type: 'other' });
  });

  it('keeps a lowercase "or" and an inner hyphen as words, not syntax', () => {
    expect(usesSearchSyntax('this or that')).toBe(false);
    expect(usesSearchSyntax('6-8 years')).toBe(false);
  });
});

describe('common words', () => {
  it('never matches a word run made only of common words', () => {
    // "the" is in every series and title that starts with it.
    expect(matchSearchTerm('the', catalogue([...DAHL_BOOKS, ...HARRY_BOOKS]))).toEqual({
      match_type: 'other',
    });
    expect(matchSearchTerm('and the', catalogue(HARRY_BOOKS))).toEqual({ match_type: 'other' });
    // "the" alone would hit The Hunger Games only among the series; still other.
    const series = {
      ...catalogue([]),
      series: [{ name: 'The Hunger Games', collectionGid: HUNGER_GAMES }],
    };
    expect(matchSearchTerm('the', series)).toEqual({ match_type: 'other' });
  });

  it('still matches a whole name made of common words', () => {
    const itBook = book('It', 'Stephen King');
    const common = { ...catalogue([itBook]), commonWords: ['it'] };
    expect(matchSearchTerm('it', common)).toEqual({
      match_type: 'title',
      match_id: itBook.id.slice(22),
    });
  });

  it('lets a common word be part of a longer term', () => {
    expect(matchSearchTerm('the hunger games', catalogue([]))).toEqual({
      match_type: 'series',
      match_id: '411000000003',
    });
    expect(matchSearchTerm('the giant peach', catalogue(DAHL_BOOKS))).toEqual({
      match_type: 'title',
      match_id: DAHL_BOOKS[1]?.id.slice(22),
    });
  });
});

describe('authors', () => {
  it('makes the code from the store’s name, never from the term', () => {
    expect(authorCode('Roald Dahl')).toBe('roald_dahl');
    expect(authorCode('J.K. Rowling')).toBe('j_k_rowling');
    expect(authorCode('Hidenori   Kusaka')).toBe('hidenori_kusaka');
  });

  it.each([
    ['a name in another script', 'सुधा मूर्ति'],
    ['a name that starts with a digit', '1984 Press'],
    ['a name with a long run of digits', 'Studio 9876543'],
    ['no name', '  '],
  ])('cannot code %s, which then never matches', (_case, name) => {
    expect(authorCode(name)).toBeUndefined();
    const only = { ...catalogue([book('Untitled', name)]), series: [], ageGroups: [], genres: [] };
    const term = matchWords(name).join(' ') || 'press';
    expect(matchSearchTerm(term, only).match_type).not.toBe('author');
  });

  it('cuts a long name to 40 characters', () => {
    const code = authorCode('Bartholomew Montgomery Fitzwilliam Abernathy-Smythe');
    expect(code?.length).toBeLessThanOrEqual(40);
    expect(code).toMatch(/^bartholomew_montgomery_fitzwilliam_abern/);
  });
});

describe('never the typed text', () => {
  const HOSTILE = [
    '',
    '   ',
    'parent@example.com',
    '+91 98765 43210',
    'Priya Sharma',
    '\u0000\u0007',
    '\ud800',
    '🧸🧸🧸',
    'a'.repeat(1000),
    '{"query": "mutation"}',
  ];

  it.each(HOSTILE)('gives other for %p, and never throws', (term) => {
    expect(matchSearchTerm(term, catalogue([...HARRY_BOOKS, ...DAHL_BOOKS]))).toEqual({
      match_type: 'other',
    });
  });

  it('sends an ID or a code that came from the store’s data', () => {
    const terms = ['harry', 'deathly hallows', 'dahl', 'tintin', 'manga', '6-8 years', 'bfg'];
    for (const term of terms) {
      const match = matchSearchTerm(term, catalogue([...HARRY_BOOKS, ...DAHL_BOOKS]));
      expect(match.match_type).not.toBe('other');
      expect(match.match_id).not.toBe(term);
      expect(match.match_id).toMatch(/^(\d{1,20}|[a-z][a-z0-9_]{0,39})$/);
    }
  });
});

describe('matchWantedName: the wanted list (P6-11, D-117)', () => {
  const COMMON = SEARCH_CONTENT.matchCommonWords;

  function listOf(names: readonly string[]) {
    return parseWantedList({ value: JSON.stringify(names), source: 'remote' }, COMMON).list;
  }

  const PHONE_CHECK = listOf(['David Walliams', 'Rick Riordan', 'Tintin', 'Harry Potter']);

  it.each([
    ['walliams', 'david_walliams'],
    ['riordan', 'rick_riordan'],
    ['David Walliams', 'david_walliams'],
    ['RICK  riordan!', 'rick_riordan'],
    ['tintin', 'tintin'],
    ['potter', 'harry_potter'],
  ])('%p is wanted %p', (term, code) => {
    expect(matchWantedName(term, PHONE_CHECK, COMMON)).toEqual({
      match_type: 'wanted',
      match_id: code,
    });
  });

  it('prefers an exact name (level 1) over a word run, whatever the order', () => {
    const list = listOf(['Harry Potter Collection', 'Potter']);

    expect(matchWantedName('potter', list, COMMON)).toEqual({
      match_type: 'wanted',
      match_id: 'potter',
    });
  });

  it('takes the first entry in the list’s order within a level', () => {
    const list = listOf(['Jeff Kinney Box Set', 'Jeff Kinney Diary']);

    expect(matchWantedName('jeff kinney', list, COMMON)).toEqual({
      match_type: 'wanted',
      match_id: 'jeff_kinney_box_set',
    });
    expect(matchWantedName('jeff kinney', [...list].reverse(), COMMON)).toEqual({
      match_type: 'wanted',
      match_id: 'jeff_kinney_diary',
    });
  });

  it.each(['walli', 'riorda', 'tinti', 'harr', 'david walli'])(
    'never matches a partial word: %p',
    (term) => {
      expect(matchWantedName(term, PHONE_CHECK, COMMON)).toEqual({ match_type: 'other' });
    },
  );

  it('matches words in order only, and never a term longer than the name', () => {
    expect(matchWantedName('walliams david', PHONE_CHECK, COMMON)).toEqual({ match_type: 'other' });
    expect(matchWantedName('david walliams books', PHONE_CHECK, COMMON)).toEqual({
      match_type: 'other',
    });
  });

  it.each(['-walliams', 'walliams OR riordan', 'author:walliams', '"walliams"', 'walli*'])(
    'gives other for Shopify’s syntax: %p',
    (term) => {
      expect(matchWantedName(term, PHONE_CHECK, COMMON)).toEqual({ match_type: 'other' });
    },
  );

  it('never matches a word run made only of common words, but matches a whole name', () => {
    const list = listOf(['The Gruffalo Club', 'Of Mice and Men']);

    expect(matchWantedName('the', list, COMMON)).toEqual({ match_type: 'other' });
    expect(matchWantedName('and', list, COMMON)).toEqual({ match_type: 'other' });
    expect(matchWantedName('the gruffalo', list, COMMON)).toEqual({
      match_type: 'wanted',
      match_id: 'the_gruffalo_club',
    });
  });

  it('gives other for an empty list, an empty term or symbols alone', () => {
    expect(matchWantedName('walliams', [], COMMON)).toEqual({ match_type: 'other' });
    expect(matchWantedName('', PHONE_CHECK, COMMON)).toEqual({ match_type: 'other' });
    expect(matchWantedName('!!!', PHONE_CHECK, COMMON)).toEqual({ match_type: 'other' });
  });

  it('sends the listed name’s code, never the typed text', () => {
    const match = matchWantedName('  WALLIAMS!! ', PHONE_CHECK, COMMON);

    expect(match).toEqual({ match_type: 'wanted', match_id: 'david_walliams' });
    expect(JSON.stringify(match)).not.toMatch(/WALLIAMS|!!/);
  });

  it('leaves the catalogue match unchanged: a listed series is still the store’s series', () => {
    const catalogue: SearchMatchCatalogue = {
      books: [],
      series: [{ name: 'Tintin', collectionGid: TINTIN_SERIES }],
      ageGroups: [],
      genres: [],
      commonWords: COMMON,
    };

    expect(matchSearchTerm('tintin', catalogue)).toEqual({
      match_type: 'series',
      match_id: '411000000002',
    });
  });
});
