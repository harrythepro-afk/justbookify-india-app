import {
  CatalogueDataError,
  formatPrice,
  storeLocale,
  toBookCard,
  type BookCard,
} from '@/shopify/bookCard';

import { bookProduct, EXAMPLES } from '../helpers/catalogue';

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(product = bookProduct()): BookCard {
  const result = toBookCard(product, CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

describe('availability (SHOPIFY_INTEGRATION.md, R8, D-015)', () => {
  it('maps an in-stock book', () => {
    expect(card(EXAMPLES.inStock())).toMatchObject({ availability: 'in-stock', orderable: true });
  });

  it('maps a rented-out book (not availableForSale) as not orderable', () => {
    expect(card(EXAMPLES.rentedOut())).toMatchObject({
      availability: 'rented-out',
      orderable: false,
    });
  });

  it('maps a book orderable at zero stock as orderable', () => {
    expect(card(EXAMPLES.orderableAtZeroStock())).toMatchObject({
      availability: 'orderable-at-zero-stock',
      orderable: true,
    });
  });

  it('maps a book in stock with "continue selling" on as in stock', () => {
    expect(card(EXAMPLES.continueSellingInStock()).availability).toBe('in-stock');
  });

  it('gives a zero-stock book the same card as an in-stock one apart from availability', () => {
    const { availability: zero, ...zeroRest } = card(
      bookProduct({ handle: 'same', title: 'Same', currentlyNotInStock: true }),
    );
    const { availability: inStock, ...inStockRest } = card(
      bookProduct({ handle: 'same', title: 'Same' }),
    );
    expect([zero, inStock]).toEqual(['orderable-at-zero-stock', 'in-stock']);
    // Two products, so their own IDs differ (the variant's too, since P8-01).
    const same = { id: '', variantId: '', cover: null };
    expect({ ...zeroRest, ...same }).toEqual({ ...inStockRest, ...same });
  });
});

describe('fields', () => {
  it('gives no cover when the product has no featured image', () => {
    expect(card(EXAMPLES.noCover()).cover).toBeNull();
  });

  it('keeps the cover URL, size and alt text', () => {
    const product = bookProduct({ handle: 'with-cover' });
    expect(card(product).cover).toEqual({
      url: 'https://cdn.example.com/covers/with-cover.jpg?width=600',
      width: 600,
      height: 900,
      altText: null,
    });
  });

  it('shows vendor as stored, without fixing its casing', () => {
    expect(card(bookProduct({ vendor: 'J.k. Rowling' })).author).toBe('J.k. Rowling');
  });

  it("keeps the variant's ID and the price as a number, for the cart (P8-01)", () => {
    const product = bookProduct({ price: '74.0' });
    expect(card(product)).toMatchObject({
      variantId: product.variants.nodes[0]?.id,
      price: '₹74',
      priceAmount: 74,
    });
  });

  it('keeps the handle, title and product ID', () => {
    const product = bookProduct({ handle: 'the-gruffalo', title: 'The Gruffalo' });
    expect(card(product)).toMatchObject({
      id: product.id,
      handle: 'the-gruffalo',
      title: 'The Gruffalo',
    });
  });

  it('returns null for a product without a variant', () => {
    expect(toBookCard(bookProduct({ noVariant: true }), CONFIG)).toBeNull();
  });
});

describe('prices (owner, P6-02)', () => {
  it('formats the rental and retail price as "₹49" and "₹350"', () => {
    expect(card()).toMatchObject({ price: '₹49', retailPrice: '₹350' });
  });

  it('gives no retail price when there is no compare-at price', () => {
    expect(card(bookProduct({ compareAtPrice: null })).retailPrice).toBeNull();
  });

  it.each(['49.0', '30.0'])(
    'gives no retail price when the compare-at price (%s) is not above the price',
    (compareAt) => {
      expect(card(bookProduct({ compareAtPrice: compareAt })).retailPrice).toBeNull();
    },
  );

  it('throws a currency-mismatch error for a price in another currency', () => {
    expect(() => toBookCard(bookProduct({ currencyCode: 'BHD' }), CONFIG)).toThrow(
      CatalogueDataError,
    );
    try {
      toBookCard(bookProduct({ currencyCode: 'BHD' }), CONFIG);
    } catch (error) {
      expect(error).toMatchObject({ code: 'catalogue/currency-mismatch' });
      expect(String((error as Error).message)).not.toContain('BHD');
    }
  });
});

describe('formatPrice', () => {
  it.each([
    [49, '₹49'],
    [34, '₹34'],
    [99, '₹99'],
    [49.5, '₹49.50'],
    [100000, '₹1,00,000'],
  ])('formats %s as %s', (amount, expected) => {
    expect(formatPrice(amount, 'INR', 'en-IN')).toBe(expected);
  });

  it('never leaves a space between the symbol and the digits', () => {
    expect(formatPrice(49, 'INR', 'en-IN')).not.toMatch(/[\s  ]/);
    // A locale that writes the symbol after the number with a no-break space.
    expect(formatPrice(49, 'EUR', 'de-DE')).not.toMatch(/[\s  ]/);
  });
});

describe('storeLocale', () => {
  it('builds en-IN from EN and IN', () => {
    expect(storeLocale({ language: 'EN', country: 'IN' })).toBe('en-IN');
  });

  it('drops a region from the language code', () => {
    expect(storeLocale({ language: 'PT_BR', country: 'BR' })).toBe('pt-BR');
  });
});
