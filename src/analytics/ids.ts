/**
 * Values an analytics event may carry besides counts and amounts (D-053). Each is a branded
 * string that only the constructors below can make, so a name, an email, a phone number, an
 * address or any other free text cannot be passed to an event by type. The guard (`guard.ts`)
 * checks them again at runtime.
 */

declare const brand: unique symbol;
type Brand<Name extends string> = string & { readonly [brand]: Name };

export type AnalyticsProductId = Brand<'AnalyticsProductId'>;
export type AnalyticsCollectionId = Brand<'AnalyticsCollectionId'>;
export type AnalyticsOrderId = Brand<'AnalyticsOrderId'>;
/** A genre as Shopify's taxonomy numbers it (D-110): the store's genre names are never sent. */
export type AnalyticsTaxonomyValueId = Brand<'AnalyticsTaxonomyValueId'>;
/** A fixed snake-case code chosen by the app, such as a filter type, a stage or an error code. */
export type AnalyticsToken = Brand<'AnalyticsToken'>;

/** The numeric part of a Shopify ID, the only form of an ID that is sent. */
export const ANALYTICS_ID_PATTERN = /^\d{1,20}$/;

/** Lowercase snake case, starting with a letter, at most 40 characters. */
export const ANALYTICS_TOKEN_PATTERN = /^[a-z][a-z0-9_]{0,39}$/;

/** Seven digits in a row could be a phone number; only ID fields may hold them. */
export const LONG_DIGIT_RUN = /\d{7,}/;

function numericId(gid: string, resource: string): string | undefined {
  const prefix = `gid://shopify/${resource}/`;
  if (!gid.startsWith(prefix)) return undefined;
  const id = gid.slice(prefix.length);
  return ANALYTICS_ID_PATTERN.test(id) ? id : undefined;
}

/** From a Shopify product GID; undefined for anything else. */
export function analyticsProductId(gid: string): AnalyticsProductId | undefined {
  return numericId(gid, 'Product') as AnalyticsProductId | undefined;
}

/** From a Shopify collection GID; undefined for anything else. */
export function analyticsCollectionId(gid: string): AnalyticsCollectionId | undefined {
  return numericId(gid, 'Collection') as AnalyticsCollectionId | undefined;
}

/** From a Shopify order GID; undefined for anything else. */
export function analyticsOrderId(gid: string): AnalyticsOrderId | undefined {
  return numericId(gid, 'Order') as AnalyticsOrderId | undefined;
}

/** From a Shopify taxonomy value GID, such as a genre's; undefined for anything else. */
export function analyticsTaxonomyValueId(gid: string): AnalyticsTaxonomyValueId | undefined {
  return numericId(gid, 'TaxonomyValue') as AnalyticsTaxonomyValueId | undefined;
}

/** A snake-case code; undefined for anything else, including any run of seven digits. */
export function analyticsToken(value: string): AnalyticsToken | undefined {
  return ANALYTICS_TOKEN_PATTERN.test(value) && !LONG_DIGIT_RUN.test(value)
    ? (value as AnalyticsToken)
    : undefined;
}
