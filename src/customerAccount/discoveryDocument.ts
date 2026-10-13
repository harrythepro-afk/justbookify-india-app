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
 * already in it. `check:dev-store` confirms the document is served.
 */
export function hasCustomerAccountGraphqlApi(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    httpsUrl((body as Record<string, unknown>).graphql_api) !== undefined
  );
}

// `https://<host>[/<path>]/customer/api/<version>/graphql`. Shopify's reference shows the store's
// domain and no path; the development store's document names
// `https://shopify.com/<shop ID>/account/customer/api/<version>/graphql` (P7-02, 13 October 2026).
const GRAPHQL_API =
  /^(https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?)((?:\/[A-Za-z0-9_-]+)*?)\/customer\/api\/[A-Za-z0-9-]+\/graphql$/;

/**
 * The Customer Account API's GraphQL endpoint at the app's pinned version (P7-02, D-124): the
 * discovered `graphql_api` is kept as it is up to `/customer/api/`, and its version is replaced by
 * `version`, so a new Shopify release never changes what the app reads. Undefined unless the URL
 * is https and has that shape, and unless every all-digit path segment (a shop ID) is the
 * configured shop's, as for the issuer (D-120).
 */
export function customerAccountGraphqlEndpoint(
  body: unknown,
  version: string,
  shopId: string,
): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const url = httpsUrl((body as Record<string, unknown>).graphql_api);
  const match = url === undefined ? null : GRAPHQL_API.exec(url);
  if (match === null) return undefined;
  const origin = match[1] ?? '';
  // The lazy group can match nothing at all; then the path is empty.
  const path = match[2] ?? '';
  const otherShop = path.split('/').some((segment) => /^\d+$/.test(segment) && segment !== shopId);
  return otherShop ? undefined : `${origin}${path}/customer/api/${version}/graphql`;
}
