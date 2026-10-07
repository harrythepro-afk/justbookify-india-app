import type { BookCardProduct } from '@/shopify/bookCard';
import type { CurrencyCode } from '@/shopify/generated/storefront.types';

type Overrides = {
  readonly handle?: string;
  readonly title?: string;
  readonly vendor?: string;
  readonly cover?: boolean;
  readonly availableForSale?: boolean;
  readonly currentlyNotInStock?: boolean;
  readonly price?: string;
  readonly compareAtPrice?: string | null;
  readonly currencyCode?: CurrencyCode;
  readonly noVariant?: boolean;
};

let nextId = 1;

/**
 * A product as the catalogue operations return it, shaped like the development store's sample
 * books (`TESTING.md`, "Sample catalogue (P6-01)"). Defaults: an in-stock ₹49 book with a cover
 * and a ₹350 retail price.
 */
export function bookProduct(overrides: Overrides = {}): BookCardProduct {
  const id = nextId++;
  const handle = overrides.handle ?? `book-${id}`;
  const currencyCode: CurrencyCode = overrides.currencyCode ?? 'INR';
  const compareAtPrice =
    overrides.compareAtPrice === undefined ? '350.0' : overrides.compareAtPrice;
  return {
    id: `gid://shopify/Product/${id}`,
    handle,
    title: overrides.title ?? `Book ${id}`,
    vendor: overrides.vendor ?? 'Julia Donaldson',
    featuredImage:
      overrides.cover === false
        ? null
        : {
            url: `https://cdn.example.com/covers/${handle}.jpg?width=600`,
            width: 600,
            height: 900,
            altText: null,
          },
    variants: {
      nodes: overrides.noVariant
        ? []
        : [
            {
              id: `gid://shopify/ProductVariant/${id}`,
              availableForSale: overrides.availableForSale ?? true,
              currentlyNotInStock: overrides.currentlyNotInStock ?? false,
              price: { amount: overrides.price ?? '49.0', currencyCode },
              compareAtPrice:
                compareAtPrice === null ? null : { amount: compareAtPrice, currencyCode },
            },
          ],
    },
  };
}

/** The development store's named examples, by case. */
export const EXAMPLES = {
  inStock: () => bookProduct({ handle: 'the-diary-of-a-wimpy-kid-no-brainer' }),
  rentedOut: () =>
    bookProduct({ handle: 'the-gruffalo', title: 'The Gruffalo', availableForSale: false }),
  orderableAtZeroStock: () =>
    bookProduct({
      handle: 'harry-potter-and-the-deathly-hallows-book-7',
      title: 'Harry Potter and the Deathly Hallows',
      vendor: 'J.K. Rowling',
      currentlyNotInStock: true,
    }),
  continueSellingInStock: () =>
    bookProduct({ handle: 'sudha-murty-three-thousand-stitches', vendor: 'Sudha Murty' }),
  noCover: () =>
    bookProduct({
      handle: 'peter-and-the-wolf-read-it-yourself',
      title: 'Peter and the Wolf',
      cover: false,
    }),
};
