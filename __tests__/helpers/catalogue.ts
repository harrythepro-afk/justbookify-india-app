import type { BookCardProduct } from '@/shopify/bookCard';
import type { BookPageProduct } from '@/shopify/bookPage';
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
 * A made-up collection GID for a handle, the same every time, so a test can check the ID a screen
 * sends to analytics (P6-09).
 */
export function collectionGid(handle: string): string {
  let id = 7;
  for (const character of handle) id = (id * 31 + character.charCodeAt(0)) % 1_000_000_000_000;
  return `gid://shopify/Collection/${id}`;
}

/** Every collection the app's channel can read, as `fetchCollectionHandles` gives it. */
export function collectionMap(handles: readonly string[]): ReadonlyMap<string, string> {
  return new Map(handles.map((handle) => [handle, collectionGid(handle)]));
}

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

/** One reference in the genre metafield: a genre with a label, or a node of another type. */
export type GenreNode = { type?: string; label?: { value?: string | null } | null };

/** A genre metaobject as the BookPage operation reads it. */
export function genre(label: string | null): {
  type: string;
  label: { value: string } | null;
} {
  return { type: 'shopify--genre', label: label === null ? null : { value: label } };
}

/**
 * A product as the BookPage operation returns it (P6-05): the card's fields plus the
 * description and the genre metafield. Defaults: a short description and one genre.
 */
export function bookPageProduct(
  overrides: Overrides & {
    readonly descriptionHtml?: string;
    /** The metafield's references; `null` for a book with no genre metafield. */
    readonly genres?: readonly GenreNode[] | null;
  } = {},
): BookPageProduct {
  const genres = overrides.genres === undefined ? [genre('Fantasy')] : overrides.genres;
  return {
    ...bookProduct(overrides),
    descriptionHtml: overrides.descriptionHtml ?? '<p>A short description.</p>',
    genre: genres === null ? null : { references: { nodes: genres as { type: string }[] } },
  };
}
