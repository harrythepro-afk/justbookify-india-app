/**
 * Shopify's OpenID configuration for the Customer Account API, read from the store's
 * `/.well-known/openid-configuration` (D-120). Pure: no network and no React Native import, so
 * `npm run check:dev-store` runs the same checks under Node.
 *
 * Shopify's URLs are taken from the document, never typed by hand: they may use the store's own
 * customer accounts domain. The document is refused as a whole unless every endpoint the app uses
 * is https and the issuer names the configured shop, which catches a client ID and shop ID taken
 * from different stores before any login starts.
 */

export type CustomerAccountDiscovery = {
  /** `https://shopify.com/authentication/<shop ID>`, compared with the ID token's `iss`. */
  readonly issuer: string;
  readonly authorizationEndpoint: string;
  readonly tokenEndpoint: string;
  /** Called as an API endpoint for mobile clients: 200 OK on success (Shopify, read 13 October 2026). */
  readonly endSessionEndpoint: string;
};

export type DiscoveryCheck =
  | { readonly ok: true; readonly discovery: CustomerAccountDiscovery }
  | { readonly ok: false; readonly code: 'discovery_invalid' | 'discovery_mismatch' };

// An https URL with a host, no whitespace, no fragment. Kept to a pattern because React Native's
// URL class does not implement the getters this would need.
const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?(?:\/[^\s#]*)?$/;
// Shopify's issuer for a shop: https://shopify.com/authentication/<shop ID> (one trailing slash allowed).
const ISSUER = /^https:\/\/[A-Za-z0-9.-]+\/authentication\/(\d{1,20})\/?$/;

function httpsUrl(value: unknown): string | undefined {
  return typeof value === 'string' && HTTPS_URL.test(value) ? value : undefined;
}

export function parseOpenIdConfiguration(body: unknown, shopId: string): DiscoveryCheck {
  if (typeof body !== 'object' || body === null) return { ok: false, code: 'discovery_invalid' };
  const document = body as Record<string, unknown>;

  const issuer = httpsUrl(document.issuer);
  const authorizationEndpoint = httpsUrl(document.authorization_endpoint);
  const tokenEndpoint = httpsUrl(document.token_endpoint);
  const endSessionEndpoint = httpsUrl(document.end_session_endpoint);
  if (
    issuer === undefined ||
    authorizationEndpoint === undefined ||
    tokenEndpoint === undefined ||
    endSessionEndpoint === undefined
  ) {
    return { ok: false, code: 'discovery_invalid' };
  }

  if (ISSUER.exec(issuer)?.[1] !== shopId) return { ok: false, code: 'discovery_mismatch' };

  return {
    ok: true,
    discovery: { issuer, authorizationEndpoint, tokenEndpoint, endSessionEndpoint },
  };
}

/**
 * Shopify's `/.well-known/customer-account-api`: the GraphQL URL, with the latest stable version
 * already in it. P7-01 makes no GraphQL call; `check:dev-store` only confirms the document is
 * served. P7-02 pins the version in `src/config/` rather than taking it from here.
 */
export function hasCustomerAccountGraphqlApi(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    httpsUrl((body as Record<string, unknown>).graphql_api) !== undefined
  );
}
