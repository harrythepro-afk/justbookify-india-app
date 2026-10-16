import { createEndpointResolver } from './endpoint.ts';
import type { FetchLike } from './fetchTypes.ts';
import { type IdentityResult, verifyCustomerToken } from './customer.ts';
import { parseBearerToken } from './token.ts';

/** The Customer Account API version, the same as the app's (D-124, D-161). */
export const CUSTOMER_ACCOUNT_API_VERSION = '2026-04';
export const DISCOVERY_TIMEOUT_MILLIS = 3_000;
export const SHOPIFY_TIMEOUT_MILLIS = 5_000;

export interface IdentityCheckOptions {
  readonly fetch: FetchLike;
  readonly storeDomain: string;
  readonly shopId: string;
}

export type IdentityCheck = (
  authorization: string | string[] | undefined,
) => Promise<IdentityResult>;

/**
 * Every customer request's first step (D-161): the bearer token's shape, then Shopify. No retry
 * inside a request, so the whole check stays within the function's 10 seconds.
 */
export function createIdentityCheck(options: IdentityCheckOptions): IdentityCheck {
  const resolveEndpoint = createEndpointResolver({
    fetch: options.fetch,
    storeDomain: options.storeDomain,
    shopId: options.shopId,
    version: CUSTOMER_ACCOUNT_API_VERSION,
    timeoutMillis: DISCOVERY_TIMEOUT_MILLIS,
  });

  return async (authorization) => {
    const token = parseBearerToken(authorization);
    if (token === undefined) return { ok: false, code: 'unauthenticated' };
    const endpoint = await resolveEndpoint();
    if (!endpoint.ok) return endpoint;
    return verifyCustomerToken(token, {
      fetch: options.fetch,
      endpoint: endpoint.endpoint,
      timeoutMillis: SHOPIFY_TIMEOUT_MILLIS,
    });
  };
}
