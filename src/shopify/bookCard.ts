/**
 * What a book card shows, mapped from a Storefront product (P6-02). Screens and components read
 * `BookCard` only, never a raw Shopify field. Facts from `SHOPIFY_INTEGRATION.md` ("Product data
 * the app reads"); card rules in D-073.
 */

import type { StoreConfig } from '@/config';

import type { CollectionBooksQuery } from './generated/storefront.generated';

/** One product as the catalogue operations select it. */
export type BookCardProduct = NonNullable<
  CollectionBooksQuery['collection']
>['products']['nodes'][number];

/**
 * The three Storefront states of a book's one variant. Orderable at zero stock is orderable (R8,
 * D-015) and looks exactly like in stock on the card (D-073); the book page keeps the difference
 * only to make sure it never calls such a book unavailable.
 */
export type BookAvailability = 'in-stock' | 'orderable-at-zero-stock' | 'rented-out';

export type BookCover = {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string | null;
};

export type BookCard = {
  /** The product's GID. */
  readonly id: string;
  /** The GID of the book's one variant, which the cart holds (P8-01). */
  readonly variantId: string;
  readonly handle: string;
  readonly title: string;
  /** `vendor`, as stored: casing differs between products and is not corrected. */
  readonly author: string;
  /** Null when the product has no featured image. */
  readonly cover: BookCover | null;
  readonly availability: BookAvailability;
  /** True unless rented out: the card shows "Add to Cart", otherwise "Notify me". */
  readonly orderable: boolean;
  /** The rental price, formatted, such as "₹49". */
  readonly price: string;
  /** The rental price in the store's currency, for the order cap's check before adding (R2). */
  readonly priceAmount: number;
  /** The retail (compare-at) price, formatted, or null when there is none above the price. */
  readonly retailPrice: string | null;
};

export type CatalogueDataErrorKind = 'currency-mismatch';

const MESSAGES: Record<CatalogueDataErrorKind, string> = {
  'currency-mismatch': "The store's prices are not in the configured currency.",
};

/** A catalogue response the app must not show. Our own wording only, never Shopify's values. */
export class CatalogueDataError extends Error {
  readonly kind: CatalogueDataErrorKind;
  /** For crash reports: matches the pattern `safeErrorCode()` passes through (D-061). */
  readonly code: `catalogue/${CatalogueDataErrorKind}`;

  constructor(kind: CatalogueDataErrorKind) {
    super(MESSAGES[kind]);
    this.name = 'CatalogueDataError';
    this.kind = kind;
    this.code = `catalogue/${kind}`;
  }
}

/** A BCP 47 locale from the store's language and country (D-058): EN and IN give "en-IN". */
export function storeLocale(config: Pick<StoreConfig, 'language' | 'country'>): string {
  const language = config.language.split('_')[0]?.toLowerCase() ?? 'en';
  return `${language}-${config.country}`;
}

// Spaces Intl may put between the symbol and the digits: plain, no-break and narrow no-break.
const SYMBOL_SPACING = /[   ]/g;

/**
 * A price in the store's format: no decimals for whole amounts ("₹49"), two otherwise
 * ("₹49.50"), with the locale's digit grouping ("₹1,00,000" for en-IN). Spaces are removed, so
 * the text is the same on every phone's engine and in Node (owner, P6-02).
 */
export function formatPrice(amount: number, currencyCode: string, locale: string): string {
  const whole = Math.round(amount * 100) % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
    .format(amount)
    .replace(SYMBOL_SPACING, '');
}

type Money = { readonly amount: unknown; readonly currencyCode: string };

function amountIn(money: Money, currencyCode: string): number {
  if (money.currencyCode !== currencyCode) throw new CatalogueDataError('currency-mismatch');
  return Number(money.amount);
}

function availabilityOf(variant: {
  readonly availableForSale: boolean;
  readonly currentlyNotInStock: boolean;
}): BookAvailability {
  if (!variant.availableForSale) return 'rented-out';
  return variant.currentlyNotInStock ? 'orderable-at-zero-stock' : 'in-stock';
}

/**
 * The card for one product, or null when the product has no variant. A price in another
 * currency than the store's throws, so a wrong market is never shown.
 */
export function toBookCard(
  product: BookCardProduct,
  config: Pick<StoreConfig, 'currencyCode' | 'language' | 'country'>,
): BookCard | null {
  const variant = product.variants.nodes[0];
  if (variant === undefined) return null;

  const locale = storeLocale(config);
  const price = amountIn(variant.price, config.currencyCode);
  const compareAt =
    variant.compareAtPrice === null || variant.compareAtPrice === undefined
      ? null
      : amountIn(variant.compareAtPrice, config.currencyCode);
  const availability = availabilityOf(variant);
  const image = product.featuredImage;

  return {
    id: product.id,
    variantId: variant.id,
    handle: product.handle,
    title: product.title,
    author: product.vendor,
    cover:
      image === null || image === undefined
        ? null
        : {
            url: image.url,
            width: image.width ?? null,
            height: image.height ?? null,
            altText: image.altText ?? null,
          },
    availability,
    orderable: availability !== 'rented-out',
    price: formatPrice(price, config.currencyCode, locale),
    priceAmount: price,
    retailPrice:
      compareAt !== null && compareAt > price
        ? formatPrice(compareAt, config.currencyCode, locale)
        : null,
  };
}
