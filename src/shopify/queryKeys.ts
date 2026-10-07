import type { BookListOptions } from './catalogue';

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
  catalogue: {
    // Without `list`, the collection's own order with every book (Home, the development
    // preview); the key is unchanged from P6-03.
    collectionBooks: (handle: string, list?: BookListOptions) =>
      list === undefined
        ? ([...storefrontKeys.all, 'catalogue', 'collectionBooks', handle] as const)
        : ([...storefrontKeys.all, 'catalogue', 'collectionBooks', handle, list] as const),
    allBooks: (list: BookListOptions) =>
      [...storefrontKeys.all, 'catalogue', 'allBooks', list] as const,
    bookCard: (handle: string) => [...storefrontKeys.all, 'catalogue', 'bookCard', handle] as const,
    collectionHandles: () => [...storefrontKeys.all, 'catalogue', 'collectionHandles'] as const,
  },
};
