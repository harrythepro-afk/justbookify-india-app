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

// `https://<host>/customer/api/<version>/graphql`: the shape Shopify's reference gives
// (read 13 October 2026). The host may be the store's own accounts domain.
const GRAPHQL_API =
  /^(https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?)\/customer\/api\/[A-Za-z0-9-]+\/graphql$/;

/**
 * The Customer Account API's GraphQL endpoint at the app's pinned version (P7-02, D-124): the
 * discovered `graphql_api` keeps its host, and its version is replaced by `version`, so a new
 * Shopify release never changes what the app reads. Undefined when the document has no https URL
 * of that shape.
 */
export function customerAccountGraphqlEndpoint(body: unknown, version: string): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const url = httpsUrl((body as Record<string, unknown>).graphql_api);
  const origin = url === undefined ? undefined : GRAPHQL_API.exec(url)?.[1];
  return origin === undefined ? undefined : `${origin}/customer/api/${version}/graphql`;
}
