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
    collectionBooks: (handle: string) =>
      [...storefrontKeys.all, 'catalogue', 'collectionBooks', handle] as const,
    bookCard: (handle: string) => [...storefrontKeys.all, 'catalogue', 'bookCard', handle] as const,
    collectionHandles: () => [...storefrontKeys.all, 'catalogue', 'collectionHandles'] as const,
  },
};
