import { CUSTOMER_ACCOUNT_API_VERSION, getCustomerAccountConfig, getStoreConfig } from '@/config';
import { reportCustomerAccountProblem } from '@/crashReporting/sentry';

import { customerAccountGraphqlEndpoint } from './discoveryDocument';
import { getJson } from './oauthHttp';

/**
 * The Customer Account API's GraphQL endpoint (P7-02, D-124): the URL from the store's
 * `/.well-known/customer-account-api` up to `/customer/api/`, the version pinned in
 * `src/config/shopifyApi.ts`. Read
 * once per launch and kept in memory; callers during the read share it. A failed read is not
 * kept, so the next call tries again. Reported by code only, never offline or after a timeout.
 */

export type EndpointResult =
  | { readonly ok: true; readonly endpoint: string }
  | { readonly ok: false; readonly reason: 'no-network' | 'timeout' | 'unavailable' };

let endpoint: string | undefined;
let inFlight: Promise<EndpointResult> | undefined;

export function getCustomerAccountApiEndpoint(): Promise<EndpointResult> {
  if (endpoint !== undefined) return Promise.resolve({ ok: true, endpoint });
  inFlight ??= loadEndpoint().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

async function loadEndpoint(): Promise<EndpointResult> {
  let storeDomain: string;
  let shopId: string;
  try {
    storeDomain = getStoreConfig().storeDomain;
    shopId = getCustomerAccountConfig().shopId;
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  const result = await getJson(`https://${storeDomain}/.well-known/customer-account-api`);
  if (!result.ok) {
    if (result.code === 'network') return { ok: false, reason: 'no-network' };
    if (result.code === 'timeout') return { ok: false, reason: 'timeout' };
    reportCustomerAccountProblem(`api_discovery_${result.code}`);
    return { ok: false, reason: 'unavailable' };
  }
  const found = customerAccountGraphqlEndpoint(result.body, CUSTOMER_ACCOUNT_API_VERSION, shopId);
  if (found === undefined) {
    reportCustomerAccountProblem('api_discovery_invalid');
    return { ok: false, reason: 'unavailable' };
  }
  endpoint = found;
  return { ok: true, endpoint: found };
}

/** For tests: back to a fresh launch. */
export function resetCustomerAccountApiEndpointForTests(): void {
  endpoint = undefined;
  inFlight = undefined;
}
