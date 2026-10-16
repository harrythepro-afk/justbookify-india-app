import { type FetchLike, USER_AGENT } from './fetchTypes.ts';

/**
 * The Customer Account API's GraphQL endpoint for the configured store (D-161), found the way the
 * app finds it (D-124): the store's `/.well-known/customer-account-api` names the URL, which is
 * kept up to `/customer/api/` with the pinned version put in. Refused unless it is https with that
 * shape and every all-digit path segment is the configured shop's ID.
 */

// `https://<host>[/<path>]/customer/api/<version>/graphql`, the same pattern as the app's
// src/customerAccount/discoveryDocument.ts.
const GRAPHQL_API =
  /^(https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?)((?:\/[A-Za-z0-9_-]+)*?)\/customer\/api\/[A-Za-z0-9-]+\/graphql$/;
const HTTPS_URL = /^https:\/\/[A-Za-z0-9.-]+(?::\d{1,5})?(?:\/[^\s#]*)?$/;

export function graphqlEndpointFromDiscovery(
  body: unknown,
  version: string,
  shopId: string,
): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>).graphql_api;
  if (typeof value !== 'string' || !HTTPS_URL.test(value)) return undefined;
  const match = GRAPHQL_API.exec(value);
  if (match === null) return undefined;
  const origin = match[1] ?? '';
  const path = match[2] ?? '';
  const otherShop = path.split('/').some((segment) => /^\d+$/.test(segment) && segment !== shopId);
  return otherShop ? undefined : `${origin}${path}/customer/api/${version}/graphql`;
}

export type EndpointResult =
  | { readonly ok: true; readonly endpoint: string }
  | { readonly ok: false; readonly code: 'shopify_unavailable' | 'shopify_unexpected' };

export interface EndpointResolverOptions {
  readonly fetch: FetchLike;
  readonly storeDomain: string;
  readonly shopId: string;
  readonly version: string;
  readonly timeoutMillis: number;
}

/**
 * Reads the discovery document once per function instance and keeps the endpoint. A failed read
 * is not kept, so the next request tries again; requests during a read share it.
 */
export function createEndpointResolver(
  options: EndpointResolverOptions,
): () => Promise<EndpointResult> {
  let endpoint: string | undefined;
  let inFlight: Promise<EndpointResult> | undefined;

  async function load(): Promise<EndpointResult> {
    let response: Response;
    try {
      response = await options.fetch(
        `https://${options.storeDomain}/.well-known/customer-account-api`,
        {
          method: 'GET',
          headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
          signal: AbortSignal.timeout(options.timeoutMillis),
        },
      );
    } catch {
      return { ok: false, code: 'shopify_unavailable' };
    }
    if (response.status >= 500) return { ok: false, code: 'shopify_unavailable' };
    if (response.status !== 200) return { ok: false, code: 'shopify_unexpected' };
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return { ok: false, code: 'shopify_unexpected' };
    }
    const found = graphqlEndpointFromDiscovery(body, options.version, options.shopId);
    if (found === undefined) return { ok: false, code: 'shopify_unexpected' };
    endpoint = found;
    return { ok: true, endpoint: found };
  }

  return () => {
    if (endpoint !== undefined) return Promise.resolve({ ok: true, endpoint });
    inFlight ??= load().finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  };
}
