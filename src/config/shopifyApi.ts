/**
 * The pinned Shopify API versions. Recorded with their dates in docs/SHOPIFY_INTEGRATION.md and
 * reviewed every quarter. Not store-specific: a second store uses the same versions.
 */
export const STOREFRONT_API_VERSION = '2026-10';

/**
 * The Customer Account API version (P7-02). `2026-04`, not the Storefront API's `2026-10`: the
 * only schema the app can generate types from is the one Shopify publishes in
 * `@shopify/hydrogen-react` 2026.4.4, which is `2026-04` (D-125). Supported until 16 April 2027;
 * moved up once Shopify publishes a later schema (SHOPIFY_INTEGRATION.md, quarterly review).
 *
 * The store's discovery document names the latest version in its GraphQL URL; the app replaces it
 * with this one, so a new Shopify release never changes what the app reads.
 */
export const CUSTOMER_ACCOUNT_API_VERSION = '2026-04';

/** GraphQL endpoint of the Storefront API for a shop domain without a scheme or path. */
export function storefrontEndpoint(storeDomain: string): string {
  return `https://${storeDomain}/api/${STOREFRONT_API_VERSION}/graphql.json`;
}
