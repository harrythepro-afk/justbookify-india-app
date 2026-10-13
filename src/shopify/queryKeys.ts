import type { BookListOptions, SearchOptions } from './catalogue';

/**
 * Cache keys for Storefront API data, all under the `storefront` root (D-061), so
 * `clearStorefrontCache` can remove this data source's entries and nothing else.
 */
export const storefrontKeys = {
  all: ['storefront'] as const,
  devCheckout: {
    variants: () => [...storefrontKeys.all, 'devCheckout', 'variants'] as const,
    createCart: () => [...storefrontKeys.all, 'devCheckout', 'createCart'] as const,
  },
  // The customer's cart (P8-01). The key never holds the cart's ID, which carries Shopify's
  // secret key for the cart: there is one cart per phone, named by `src/shopify/cartId.ts`. It
  // holds how many times a cart has been forgotten, so a forgotten cart is never shown again.
  cart: {
    all: () => [...storefrontKeys.all, 'cart', 'current'] as const,
    current: (forgets: number) => [...storefrontKeys.all, 'cart', 'current', forgets] as const,
    change: () => [...storefrontKeys.all, 'cart', 'change'] as const,
  },
  catalogue: {
    // Without `list`, the collection's own order with every book (Home, the development
    // preview); the key is unchanged from P6-03.
    collectionBooks: (handle: string, list?: BookListOptions) =>
      list === undefined
        ? ([...storefrontKeys.all, 'catalogue', 'collectionBooks', handle] as const)
        : ([...storefrontKeys.all, 'catalogue', 'collectionBooks', handle, list] as const),
    // A collection's Genre filter values for a list with "Available now" on or off (D-101).
    collectionGenres: (handle: string, available: boolean) =>
      [...storefrontKeys.all, 'catalogue', 'collectionGenres', handle, available] as const,
    // The store's genre entries, whose labels name the genres (D-102).
    genreEntries: () => [...storefrontKeys.all, 'catalogue', 'genreEntries'] as const,
    bookCard: (handle: string) => [...storefrontKeys.all, 'catalogue', 'bookCard', handle] as const,
    book: (handle: string) => [...storefrontKeys.all, 'catalogue', 'book', handle] as const,
    collectionHandles: () => [...storefrontKeys.all, 'catalogue', 'collectionHandles'] as const,
    // The term is held in the in-memory cache only, like every other key (D-059, D-097).
    search: (term: string, search: SearchOptions) =>
      [...storefrontKeys.all, 'catalogue', 'search', term, search] as const,
  },
};
