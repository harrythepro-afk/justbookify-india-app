import {
  parseGenreInput,
  SHARED_NAME_SEPARATOR,
  toGenreOptions,
  type GenreEntry,
  type GenreFilterValue,
} from '@/shopify/genres';

const LOCALE = 'en-IN';
const gid = (id: number) => `gid://shopify/TaxonomyValue/${id}`;
const input = (id: number) =>
  JSON.stringify({ taxonomyMetafield: { namespace: 'shopify', key: 'genre', value: gid(id) } });
const value = (id: number, count = 1): GenreFilterValue => ({ count, input: input(id) });
const entry = (label: string | null, id: number | null): GenreEntry => ({
  label,
  taxonomyReference: id === null ? null : gid(id),
});

// The development store on 8 October 2026 (gate, P6-07): Shopify's filter labels the five custom
// genres Design, Children, Drama, Documentary and Family; the store calls them as below.
const DEV_ENTRIES: readonly GenreEntry[] = [
  entry('Action & adventure', 15724),
  entry('Fantasy', 20853),
  entry('Humor & comedy', 15741),
  entry('Crime & mystery', 15729),
  entry('Comics & graphic novels', 15728),
  entry('Biography', 15726),
  entry('Manga', 15730),
  entry('Realistic fiction', 15732),
  entry('Picture book', 15727),
  entry('Fairy tale', 15733),
  entry('Non-fiction', 15731),
];
const DEV_VALUES: readonly GenreFilterValue[] = [
  value(15724, 16),
  value(15726, 1),
  value(15727, 3),
  value(15728, 3),
  value(15729, 4),
  value(15730, 4),
  value(15731, 1),
  value(15732, 14),
  value(15733, 2),
  value(20853, 13),
  value(15741, 13),
];

describe('toGenreOptions (D-101, D-102)', () => {
  it("names every value by the store's entry, A-Z, never by Shopify's built-in name", () => {
    const { options, faults } = toGenreOptions(DEV_VALUES, DEV_ENTRIES, LOCALE);

    expect(options.map((option) => option.name)).toEqual([
      'Action & adventure',
      'Biography',
      'Comics & graphic novels',
      'Crime & mystery',
      'Fairy tale',
      'Fantasy',
      'Humor & comedy',
      'Manga',
      'Non-fiction',
      'Picture book',
      'Realistic fiction',
    ]);
    for (const builtIn of ['Design', 'Children', 'Drama', 'Documentary', 'Family']) {
      expect(options.map((option) => option.name)).not.toContain(builtIn);
    }
    expect(faults).toEqual([]);
  });

  it("gives each option the value's own filter", () => {
    const { options } = toGenreOptions([value(15730, 4)], DEV_ENTRIES, LOCALE);

    expect(options).toEqual([
      { name: 'Manga', filter: { namespace: 'shopify', key: 'genre', value: gid(15730) } },
    ]);
  });

  it('leaves out values with no books', () => {
    const { options } = toGenreOptions([value(15730, 0), value(20853, 2)], DEV_ENTRIES, LOCALE);

    expect(options.map((option) => option.name)).toEqual(['Fantasy']);
  });

  it('sorts by the shown name, ignoring case', () => {
    const entries = [
      entry('non fiction', 15731),
      entry('Manga', 15730),
      entry('activity book', 20852),
    ];
    const { options } = toGenreOptions([value(15731), value(15730), value(20852)], entries, LOCALE);

    expect(options.map((option) => option.name)).toEqual(['activity book', 'Manga', 'non fiction']);
  });

  describe('a value with no entry', () => {
    it('is left out and reported, with no Shopify name in its place', () => {
      const { options, faults } = toGenreOptions([value(15730), value(20866)], DEV_ENTRIES, LOCALE);

      expect(options.map((option) => option.name)).toEqual(['Manga']);
      expect(faults).toEqual(['catalogue/genre-without-name']);
    });

    it('leaves every genre out when the entries could not be matched at all', () => {
      const { options, faults } = toGenreOptions(DEV_VALUES, [], LOCALE);

      expect(options).toEqual([]);
      expect(faults).toEqual(['catalogue/genre-without-name']);
    });
  });

  describe('two entries on one value', () => {
    it('gives one option with both names, A-Z, and reports it', () => {
      // The development store before 8 October 2026: custom genres all on "Other" (20866).
      const entries = [entry('Mythology', 20866), entry('Fairy tale', 20866)];
      const { options, faults } = toGenreOptions([value(20866, 5)], entries, LOCALE);

      expect(SHARED_NAME_SEPARATOR).toBe(' / ');
      expect(options).toEqual([
        {
          name: 'Fairy tale / Mythology',
          filter: { namespace: 'shopify', key: 'genre', value: gid(20866) },
        },
      ]);
      expect(faults).toEqual(['catalogue/genre-shared-value']);
    });

    it('merges two entries with the same name, without a fault', () => {
      const entries = [entry('Manga', 15730), entry(' Manga ', 15730)];
      const { options, faults } = toGenreOptions([value(15730)], entries, LOCALE);

      expect(options.map((option) => option.name)).toEqual(['Manga']);
      expect(faults).toEqual([]);
    });
  });

  describe('a blank label', () => {
    it('is ignored when another entry names the value', () => {
      const entries = [entry('  ', 15730), entry('Manga', 15730)];
      const { options, faults } = toGenreOptions([value(15730)], entries, LOCALE);

      expect(options.map((option) => option.name)).toEqual(['Manga']);
      expect(faults).toEqual([]);
    });

    it('leaves the value out, as with no entry, when it is the only one', () => {
      const entries = [entry('', 15730), entry(null, 15730), entry('Fantasy', 20853)];
      const { options, faults } = toGenreOptions([value(15730), value(20853)], entries, LOCALE);

      expect(options.map((option) => option.name)).toEqual(['Fantasy']);
      expect(faults).toEqual(['catalogue/genre-without-name']);
    });
  });

  it('trims names and ignores an entry with no taxonomy value', () => {
    const entries = [entry('  Manga  ', 15730), entry('Orphan', null)];
    const { options } = toGenreOptions([value(15730)], entries, LOCALE);

    expect(options.map((option) => option.name)).toEqual(['Manga']);
  });

  it('leaves out an input that is not a taxonomy filter, reported once', () => {
    const { options, faults } = toGenreOptions(
      [{ count: 3, input: '{"available":true}' }, { count: 3, input: 'not json' }, value(20853)],
      DEV_ENTRIES,
      LOCALE,
    );

    expect(options.map((option) => option.name)).toEqual(['Fantasy']);
    expect(faults).toEqual(['catalogue/genre-bad-input']);
  });
});

describe('parseGenreInput', () => {
  const expected = { namespace: 'shopify', key: 'genre', value: gid(15730) };

  it('reads the JSON text Shopify sends, and the same as an object', () => {
    expect(parseGenreInput(input(15730))).toEqual(expected);
    expect(parseGenreInput(JSON.parse(input(15730)))).toEqual(expected);
  });

  it.each([
    ['not JSON', '{'],
    ['an array', '[]'],
    ['null', 'null'],
    ['another filter', '{"available":true}'],
    ['an extra filter beside it', JSON.stringify({ ...JSON.parse(input(1)), available: true })],
    ['a missing value', '{"taxonomyMetafield":{"namespace":"shopify","key":"genre"}}'],
    ['a blank value', '{"taxonomyMetafield":{"namespace":"shopify","key":"genre","value":" "}}'],
    ['a number value', '{"taxonomyMetafield":{"namespace":"shopify","key":"genre","value":7}}'],
  ])('refuses %s', (_name, text) => {
    expect(parseGenreInput(text)).toBeNull();
  });

  it('refuses something that is not text or an object', () => {
    expect(parseGenreInput(42)).toBeNull();
    expect(parseGenreInput(undefined)).toBeNull();
  });
});
