import { bookGenres, toBookPage } from '@/shopify/bookPage';
import { CatalogueDataError } from '@/shopify/bookCard';

import { bookPageProduct, genre } from '../helpers/catalogue';

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

describe('toBookPage (P6-05)', () => {
  it("keeps the card's fields and adds the description and genres", () => {
    const page = toBookPage(
      bookPageProduct({
        handle: 'harry-potter-and-the-half-blood-prince-book-6',
        title: 'Harry Potter and the Half-Blood Prince',
        vendor: 'J.K. Rowling',
        descriptionHtml: '<p><strong>Why You will Love It:</strong> magic</p>',
        genres: [genre('Fantasy', 20853), genre('Action & Adventure', 15724)],
      }),
      CONFIG,
    );

    expect(page).toMatchObject({
      handle: 'harry-potter-and-the-half-blood-prince-book-6',
      title: 'Harry Potter and the Half-Blood Prince',
      author: 'J.K. Rowling',
      price: '₹49',
      retailPrice: '₹350',
      availability: 'in-stock',
      orderable: true,
      genres: [
        { name: 'Fantasy', taxonomyValue: 'gid://shopify/TaxonomyValue/20853' },
        { name: 'Action & Adventure', taxonomyValue: 'gid://shopify/TaxonomyValue/15724' },
      ],
      description: [
        {
          kind: 'paragraph',
          spans: [
            { text: 'Why You will Love It:', bold: true, italic: false },
            { text: ' magic', bold: false, italic: false },
          ],
        },
      ],
    });
  });

  it.each([
    ['in stock', {}, 'in-stock', true],
    ['orderable at zero stock', { currentlyNotInStock: true }, 'orderable-at-zero-stock', true],
    ['rented out', { availableForSale: false }, 'rented-out', false],
  ] as const)('maps a book %s', (_case, overrides, availability, orderable) => {
    expect(toBookPage(bookPageProduct(overrides), CONFIG)).toMatchObject({
      availability,
      orderable,
    });
  });

  it('gives an empty description when Shopify has none', () => {
    expect(toBookPage(bookPageProduct({ descriptionHtml: '' }), CONFIG)?.description).toEqual([]);
  });

  it('gives null for a product without a variant', () => {
    expect(toBookPage(bookPageProduct({ noVariant: true }), CONFIG)).toBeNull();
  });

  it('throws on a price in another currency, as the card does', () => {
    expect(() => toBookPage(bookPageProduct({ currencyCode: 'USD' }), CONFIG)).toThrow(
      CatalogueDataError,
    );
  });
});

describe('bookGenres', () => {
  it('gives none when the metafield or its references are missing', () => {
    expect(bookGenres(null)).toEqual([]);
    expect(bookGenres(undefined)).toEqual([]);
    expect(bookGenres({ references: null })).toEqual([]);
    expect(bookGenres({ references: { nodes: [] } })).toEqual([]);
  });

  it("keeps Shopify's order, trims labels and shows a repeated one once", () => {
    expect(
      bookGenres({
        references: {
          nodes: [genre(' Humor & Comedy '), genre('Fantasy'), genre('Humor & Comedy')],
        },
      }),
    ).toEqual([
      { name: 'Humor & Comedy', taxonomyValue: null },
      { name: 'Fantasy', taxonomyValue: null },
    ]);
  });

  it('skips a node of another type, and a genre with no or a blank label', () => {
    const nodes = [
      {},
      { type: 'shopify--language-version', label: { value: 'ENG- English' } },
      genre(null),
      genre('   '),
      { type: 'shopify--genre', label: { value: null } },
      genre('Picture Book'),
    ];

    expect(bookGenres({ references: { nodes: nodes as { type: string }[] } })).toEqual([
      { name: 'Picture Book', taxonomyValue: null },
    ]);
  });
});

describe('bookGenres: taxonomy values (P6-10, D-113)', () => {
  it('reads the taxonomy value of each genre with its name', () => {
    expect(
      bookGenres({ references: { nodes: [genre('Manga', 15730), genre('Fantasy', 20853)] } }),
    ).toEqual([
      { name: 'Manga', taxonomyValue: 'gid://shopify/TaxonomyValue/15730' },
      { name: 'Fantasy', taxonomyValue: 'gid://shopify/TaxonomyValue/20853' },
    ]);
  });

  it('gives no value for a missing, empty or blank reference, and trims one', () => {
    const nodes = [
      genre('A'),
      { type: 'shopify--genre', label: { value: 'B' }, taxonomyReference: { value: null } },
      { type: 'shopify--genre', label: { value: 'C' }, taxonomyReference: { value: '  ' } },
      {
        type: 'shopify--genre',
        label: { value: 'D' },
        taxonomyReference: { value: ' gid://shopify/TaxonomyValue/15727 ' },
      },
    ];

    expect(bookGenres({ references: { nodes: nodes as { type: string }[] } })).toEqual([
      { name: 'A', taxonomyValue: null },
      { name: 'B', taxonomyValue: null },
      { name: 'C', taxonomyValue: null },
      { name: 'D', taxonomyValue: 'gid://shopify/TaxonomyValue/15727' },
    ]);
  });

  it('keeps the first value when a name repeats', () => {
    expect(
      bookGenres({ references: { nodes: [genre('Fairy tale', 15733), genre('Fairy tale', 1)] } }),
    ).toEqual([{ name: 'Fairy tale', taxonomyValue: 'gid://shopify/TaxonomyValue/15733' }]);
  });
});
