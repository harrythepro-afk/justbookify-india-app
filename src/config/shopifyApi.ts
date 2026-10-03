/**
 * The one pinned Storefront API version. Recorded with its date in docs/SHOPIFY_INTEGRATION.md
 * and reviewed every quarter. Not store-specific: a second store uses the same version.
 */
export const STOREFRONT_API_VERSION = '2026-10';

/** GraphQL endpoint of the Storefront API for a shop domain without a scheme or path. */
export function storefrontEndpoint(storeDomain: string): string {
  return `https://${storeDomain}/api/${STOREFRONT_API_VERSION}/graphql.json`;
}
