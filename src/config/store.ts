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
  /** ISO 4217 code, for example "INR". */
  readonly currencyCode: string;
  /** Flat shipping fee for prepaid orders, in major currency units. */
  readonly shippingFeePrepaid: number;
  /** Flat shipping fee for cash-on-delivery orders, in major currency units. */
  readonly shippingFeeCod: number;
  /** Subtotal from which delivery is free, in major currency units. */
  readonly freeDeliveryThreshold: number;
  /** Checkout is blocked when the cart subtotal reaches this value (R2). */
  readonly orderCap: number;
  /** Two-digit pincode prefix ranges the store delivers to (R3). */
  readonly deliveryPincodeRanges: readonly PincodePrefixRange[];
};

export const STORE_ENV_NAMES = [
  'EXPO_PUBLIC_STORE_DOMAIN',
  'EXPO_PUBLIC_STORE_CURRENCY',
  'EXPO_PUBLIC_SHIPPING_FEE_PREPAID',
  'EXPO_PUBLIC_SHIPPING_FEE_COD',
  'EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD',
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
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const RANGE_PATTERN = /^(\d{2})(?:-(\d{2}))?$/;

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
  const currencyCode = env.EXPO_PUBLIC_STORE_CURRENCY?.trim();
  const shippingFeePrepaid = parseAmount(env.EXPO_PUBLIC_SHIPPING_FEE_PREPAID);
  const shippingFeeCod = parseAmount(env.EXPO_PUBLIC_SHIPPING_FEE_COD);
  const freeDeliveryThreshold = parseAmount(env.EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD);
  const orderCap = parseAmount(env.EXPO_PUBLIC_ORDER_CAP);
  const deliveryPincodeRanges = parseRanges(env.EXPO_PUBLIC_DELIVERY_PINCODE_RANGES);

  const invalid: StoreEnvName[] = [];
  if (storeDomain === undefined || !DOMAIN_PATTERN.test(storeDomain)) {
    invalid.push('EXPO_PUBLIC_STORE_DOMAIN');
  }
  if (currencyCode === undefined || !CURRENCY_PATTERN.test(currencyCode)) {
    invalid.push('EXPO_PUBLIC_STORE_CURRENCY');
  }
  if (shippingFeePrepaid === undefined) invalid.push('EXPO_PUBLIC_SHIPPING_FEE_PREPAID');
  if (shippingFeeCod === undefined) invalid.push('EXPO_PUBLIC_SHIPPING_FEE_COD');
  if (freeDeliveryThreshold === undefined) invalid.push('EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD');
  if (orderCap === undefined || orderCap === 0) invalid.push('EXPO_PUBLIC_ORDER_CAP');
  if (deliveryPincodeRanges === undefined) invalid.push('EXPO_PUBLIC_DELIVERY_PINCODE_RANGES');

  if (
    invalid.length > 0 ||
    storeDomain === undefined ||
    currencyCode === undefined ||
    shippingFeePrepaid === undefined ||
    shippingFeeCod === undefined ||
    freeDeliveryThreshold === undefined ||
    orderCap === undefined ||
    deliveryPincodeRanges === undefined
  ) {
    throw new StoreConfigError(invalid);
  }

  return {
    storeDomain,
    currencyCode,
    shippingFeePrepaid,
    shippingFeeCod,
    freeDeliveryThreshold,
    orderCap,
    deliveryPincodeRanges,
  };
}

let cached: StoreConfig | undefined;

/** Parsed on first use, so an unconfigured build still starts. Later tasks call this. */
export function getStoreConfig(): StoreConfig {
  cached ??= parseStoreConfig({
    EXPO_PUBLIC_STORE_DOMAIN: process.env.EXPO_PUBLIC_STORE_DOMAIN,
    EXPO_PUBLIC_STORE_CURRENCY: process.env.EXPO_PUBLIC_STORE_CURRENCY,
    EXPO_PUBLIC_SHIPPING_FEE_PREPAID: process.env.EXPO_PUBLIC_SHIPPING_FEE_PREPAID,
    EXPO_PUBLIC_SHIPPING_FEE_COD: process.env.EXPO_PUBLIC_SHIPPING_FEE_COD,
    EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD: process.env.EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD,
    EXPO_PUBLIC_ORDER_CAP: process.env.EXPO_PUBLIC_ORDER_CAP,
    EXPO_PUBLIC_DELIVERY_PINCODE_RANGES: process.env.EXPO_PUBLIC_DELIVERY_PINCODE_RANGES,
  });
  return cached;
}
