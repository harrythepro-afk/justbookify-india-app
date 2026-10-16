import type { IdentityErrorCode } from '../http/codes.ts';
import { type FetchLike, USER_AGENT } from './fetchTypes.ts';

/**
 * The customer's identity, derived on the server from their own Customer Account API access token
 * (D-161; `ARCHITECTURE.md`, "Rules for the backend"). Shopify documents no introspection endpoint
 * and no key set for access tokens (read 16 October 2026), so the backend asks the Customer Account
 * API itself, with the customer's token, for the customer's ID. No secret is needed, and an ID sent
 * by the app is never read.
 *
 * Checked against the app's saved Customer Account API 2026-04 schema by a test (D-159).
 */
export const CUSTOMER_IDENTITY_QUERY = 'query BackendCustomerIdentity { customer { id } }';

const CUSTOMER_GID = /^gid:\/\/shopify\/Customer\/\d{1,20}$/;
/** Shopify's answer to this query is small; anything far larger is not its answer. */
const MAX_RESPONSE_CHARACTERS = 64 * 1024;

export type IdentityResult =
  | { readonly ok: true; readonly customerId: string }
  | { readonly ok: false; readonly code: IdentityErrorCode };

export interface VerifyOptions {
  readonly fetch: FetchLike;
  readonly endpoint: string;
  readonly timeoutMillis: number;
}

export async function verifyCustomerToken(
  token: string,
  options: VerifyOptions,
): Promise<IdentityResult> {
  let response: Response;
  let text: string;
  try {
    response = await options.fetch(options.endpoint, {
      method: 'POST',
      headers: {
        // Shopify's Customer Account API takes the token as it is, with no "Bearer".
        Authorization: token,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ query: CUSTOMER_IDENTITY_QUERY }),
      // Never follow a redirect with the customer's token.
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMillis),
    });
    text = await response.text();
  } catch {
    return { ok: false, code: 'shopify_unavailable' };
  }

  if (response.status === 401) return { ok: false, code: 'unauthenticated' };
  if (response.status === 429) return { ok: false, code: 'shopify_busy' };
  if (response.status >= 500) return { ok: false, code: 'shopify_unavailable' };
  if (response.status !== 200 || text.length > MAX_RESPONSE_CHARACTERS) {
    return { ok: false, code: 'shopify_unexpected' };
  }
  return readCustomerId(text);
}

function readCustomerId(text: string): IdentityResult {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, code: 'shopify_unexpected' };
  }
  if (typeof body !== 'object' || body === null) return { ok: false, code: 'shopify_unexpected' };
  const { data, errors } = body as { data?: unknown; errors?: unknown };

  if (Array.isArray(errors) && errors.length > 0) {
    return { ok: false, code: isThrottled(errors) ? 'shopify_busy' : 'shopify_unexpected' };
  }
  const customer =
    typeof data === 'object' && data !== null ? (data as { customer?: unknown }).customer : null;
  const id =
    typeof customer === 'object' && customer !== null ? (customer as { id?: unknown }).id : null;
  if (typeof id === 'string' && CUSTOMER_GID.test(id)) return { ok: true, customerId: id };
  return { ok: false, code: 'shopify_unexpected' };
}

function isThrottled(errors: readonly unknown[]): boolean {
  return errors.some((error) => {
    if (typeof error !== 'object' || error === null) return false;
    const extensions = (error as { extensions?: unknown }).extensions;
    return (
      typeof extensions === 'object' &&
      extensions !== null &&
      (extensions as { code?: unknown }).code === 'THROTTLED'
    );
  });
}
