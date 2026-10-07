import { genreLabels, toBookPage } from '@/shopify/bookPage';
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
        genres: [genre('Fantasy'), genre('Action & Adventure')],
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
      genres: ['Fantasy', 'Action & Adventure'],
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

describe('genreLabels', () => {
  it('gives none when the metafield or its references are missing', () => {
    expect(genreLabels(null)).toEqual([]);
    expect(genreLabels(undefined)).toEqual([]);
    expect(genreLabels({ references: null })).toEqual([]);
    expect(genreLabels({ references: { nodes: [] } })).toEqual([]);
  });

  it("keeps Shopify's order, trims labels and shows a repeated one once", () => {
    expect(
      genreLabels({
        references: {
          nodes: [genre(' Humor & Comedy '), genre('Fantasy'), genre('Humor & Comedy')],
        },
      }),
    ).toEqual(['Humor & Comedy', 'Fantasy']);
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

    expect(genreLabels({ references: { nodes: nodes as { type: string }[] } })).toEqual([
      'Picture Book',
    ]);
  });
});
