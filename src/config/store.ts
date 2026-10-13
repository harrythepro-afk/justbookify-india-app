/**
 * Store-specific values for the India store. Every value comes from an EXPO_PUBLIC_ variable,
 * so a second store (Bahrain) needs configuration, not code changes.
 *
 * Variables are listed one by one with static `process.env.NAME` access because Expo inlines
 * EXPO_PUBLIC_ values at build time only for that exact form. Reading `process.env` as a whole
 * object does not work in a built app.
 */

export type PincodePrefixRange = { readonly from: number; readonly to: number };

export type StoreConfig = {
  /** Shop domain without a scheme or path. */
  readonly storeDomain: string;
  /** Public Storefront API access token from the Headless channel. Public by design. */
  readonly storefrontAccessToken: string;
  /** ISO 4217 code, for example "INR". */
  readonly currencyCode: string;
  /**
   * Buyer's country, ISO 3166-1 two-letter code such as "IN". Sent with every Storefront API
   * operation, so prices and availability are for this market (D-058).
   */
  readonly country: string;
  /** Shopify language code such as "EN", sent with every Storefront API operation (D-058). */
  readonly language: string;
  /** Flat shipping fee for prepaid orders, in major currency units. */
  readonly shippingFeePrepaid: number;
  /**
   * Flat shipping fee for cash-on-delivery orders, in major currency units. A cart hint only:
   * checkout sets the final amount. The ACOD app adds no fee of its own (D-031).
   */
  readonly shippingFeeCod: number;
  /**
   * Subtotal from which the automatic shipping discount applies, in major currency units: prepaid
   * delivery becomes free (D-023, D-031).
   */
  readonly freeDeliveryThreshold: number;
  /**
   * The automatic shipping discount, in major currency units, taken off either delivery rate from
   * `freeDeliveryThreshold` (the SMART Checkout Rules shipping discount, D-031, D-141). A cart hint
   * only: checkout sets the final amount.
   */
  readonly shippingDiscount: number;
  /** Checkout is blocked when the cart subtotal reaches this value (R2). */
  readonly orderCap: number;
  /** Two-digit pincode prefix ranges the store delivers to (R3). */
  readonly deliveryPincodeRanges: readonly PincodePrefixRange[];
};

export const STORE_ENV_NAMES = [
  'EXPO_PUBLIC_STORE_DOMAIN',
  'EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN',
  'EXPO_PUBLIC_STORE_CURRENCY',
  'EXPO_PUBLIC_STORE_COUNTRY',
  'EXPO_PUBLIC_STORE_LANGUAGE',
  'EXPO_PUBLIC_SHIPPING_FEE_PREPAID',
  'EXPO_PUBLIC_SHIPPING_FEE_COD',
  'EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD',
  'EXPO_PUBLIC_SHIPPING_DISCOUNT',
  'EXPO_PUBLIC_ORDER_CAP',
  'EXPO_PUBLIC_DELIVERY_PINCODE_RANGES',
] as const;

export type StoreEnvName = (typeof STORE_ENV_NAMES)[number];

export type RawStoreEnv = Readonly<Record<StoreEnvName, string | undefined>>;

/** Carries variable names only. Values are never echoed, so a bad value cannot leak. */
export class StoreConfigError extends Error {
  readonly invalid: readonly StoreEnvName[];

  constructor(invalid: readonly StoreEnvName[]) {
    super(`Missing or invalid store configuration: ${invalid.join(', ')}.`);
    this.name = 'StoreConfigError';
    this.invalid = invalid;
  }
}

const DOMAIN_PATTERN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
// Shopify's LanguageCode values: two or three letters, sometimes with a region, such as PT_BR.
const LANGUAGE_PATTERN = /^[A-Z]{2,3}(_[A-Z]{2,4})?$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const RANGE_PATTERN = /^(\d{2})(?:-(\d{2}))?$/;
const TOKEN_PATTERN = /^\S+$/;
// Shopify's secret tokens carry a prefix such as shpat_ (Admin API) or shpss_ (shared secret).
// Rejecting them stops a server-only credential from being bundled into the app by mistake.
const SECRET_TOKEN_PREFIX = /^shp[a-z]{2}_/i;

function parseToken(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text !== undefined && TOKEN_PATTERN.test(text) && !SECRET_TOKEN_PREFIX.test(text)
    ? text
    : undefined;
}

function parseAmount(value: string | undefined): number | undefined {
  const text = value?.trim();
  return text !== undefined && AMOUNT_PATTERN.test(text) ? Number(text) : undefined;
}

function parseRanges(value: string | undefined): PincodePrefixRange[] | undefined {
  if (value === undefined) return undefined;

  const ranges: PincodePrefixRange[] = [];
  for (const part of value.split(',')) {
    const match = RANGE_PATTERN.exec(part.trim());
    if (match === null) return undefined;
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : Number(match[2]);
    if (to < from) return undefined;
    ranges.push({ from, to });
  }
  return ranges;
}

export function parseStoreConfig(env: RawStoreEnv): StoreConfig {
  const storeDomain = env.EXPO_PUBLIC_STORE_DOMAIN?.trim().toLowerCase();
  const storefrontAccessToken = parseToken(env.EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN);
  const currencyCode = env.EXPO_PUBLIC_STORE_CURRENCY?.trim();
  const country = env.EXPO_PUBLIC_STORE_COUNTRY?.trim();
  const language = env.EXPO_PUBLIC_STORE_LANGUAGE?.trim();
  const shippingFeePrepaid = parseAmount(env.EXPO_PUBLIC_SHIPPING_FEE_PREPAID);
  const shippingFeeCod = parseAmount(env.EXPO_PUBLIC_SHIPPING_FEE_COD);
  const freeDeliveryThreshold = parseAmount(env.EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD);
  const shippingDiscount = parseAmount(env.EXPO_PUBLIC_SHIPPING_DISCOUNT);
  const orderCap = parseAmount(env.EXPO_PUBLIC_ORDER_CAP);
  const deliveryPincodeRanges = parseRanges(env.EXPO_PUBLIC_DELIVERY_PINCODE_RANGES);

  const invalid: StoreEnvName[] = [];
  if (storeDomain === undefined || !DOMAIN_PATTERN.test(storeDomain)) {
    invalid.push('EXPO_PUBLIC_STORE_DOMAIN');
  }
  if (storefrontAccessToken === undefined) invalid.push('EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN');
  if (currencyCode === undefined || !CURRENCY_PATTERN.test(currencyCode)) {
    invalid.push('EXPO_PUBLIC_STORE_CURRENCY');
  }
  if (country === undefined || !COUNTRY_PATTERN.test(country)) {
    invalid.push('EXPO_PUBLIC_STORE_COUNTRY');
  }
  if (language === undefined || !LANGUAGE_PATTERN.test(language)) {
    invalid.push('EXPO_PUBLIC_STORE_LANGUAGE');
  }
  if (shippingFeePrepaid === undefined) invalid.push('EXPO_PUBLIC_SHIPPING_FEE_PREPAID');
  if (shippingFeeCod === undefined) invalid.push('EXPO_PUBLIC_SHIPPING_FEE_COD');
  if (freeDeliveryThreshold === undefined) invalid.push('EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD');
  if (shippingDiscount === undefined) invalid.push('EXPO_PUBLIC_SHIPPING_DISCOUNT');
  if (orderCap === undefined || orderCap === 0) invalid.push('EXPO_PUBLIC_ORDER_CAP');
  if (deliveryPincodeRanges === undefined) invalid.push('EXPO_PUBLIC_DELIVERY_PINCODE_RANGES');

  if (
    invalid.length > 0 ||
    storeDomain === undefined ||
    storefrontAccessToken === undefined ||
    currencyCode === undefined ||
    country === undefined ||
    language === undefined ||
    shippingFeePrepaid === undefined ||
    shippingFeeCod === undefined ||
    freeDeliveryThreshold === undefined ||
    shippingDiscount === undefined ||
    orderCap === undefined ||
    deliveryPincodeRanges === undefined
  ) {
    throw new StoreConfigError(invalid);
  }

  return {
    storeDomain,
    storefrontAccessToken,
    currencyCode,
    country,
    language,
    shippingFeePrepaid,
    shippingFeeCod,
    freeDeliveryThreshold,
    shippingDiscount,
    orderCap,
    deliveryPincodeRanges,
  };
}

let cached: StoreConfig | undefined;

/** Parsed on first use, so an unconfigured build still starts. Later tasks call this. */
export function getStoreConfig(): StoreConfig {
  cached ??= parseStoreConfig({
    EXPO_PUBLIC_STORE_DOMAIN: process.env.EXPO_PUBLIC_STORE_DOMAIN,
    EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN: process.env.EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN,
    EXPO_PUBLIC_STORE_CURRENCY: process.env.EXPO_PUBLIC_STORE_CURRENCY,
    EXPO_PUBLIC_STORE_COUNTRY: process.env.EXPO_PUBLIC_STORE_COUNTRY,
    EXPO_PUBLIC_STORE_LANGUAGE: process.env.EXPO_PUBLIC_STORE_LANGUAGE,
    EXPO_PUBLIC_SHIPPING_FEE_PREPAID: process.env.EXPO_PUBLIC_SHIPPING_FEE_PREPAID,
    EXPO_PUBLIC_SHIPPING_FEE_COD: process.env.EXPO_PUBLIC_SHIPPING_FEE_COD,
    EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD: process.env.EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD,
    EXPO_PUBLIC_SHIPPING_DISCOUNT: process.env.EXPO_PUBLIC_SHIPPING_DISCOUNT,
    EXPO_PUBLIC_ORDER_CAP: process.env.EXPO_PUBLIC_ORDER_CAP,
    EXPO_PUBLIC_DELIVERY_PINCODE_RANGES: process.env.EXPO_PUBLIC_DELIVERY_PINCODE_RANGES,
  });
  return cached;
}

export type StoreConfigStatus = 'configured' | 'not configured';

/** For screens that may say whether the store is set up. It never exposes a value. */
export function getStoreConfigStatus(): StoreConfigStatus {
  try {
    getStoreConfig();
    return 'configured';
  } catch (error) {
    if (error instanceof StoreConfigError) return 'not configured';
    throw error;
  }
}
