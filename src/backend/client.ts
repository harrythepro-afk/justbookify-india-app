/**
 * The app's calls to our backend (P10-02, D-166). The only file in the app, apart from the
 * Shopify transports, that may call `fetch` (ESLint).
 *
 * So far one development-only call: `checkBackendIdentity()` asks `GET /whoami` (D-162) whether
 * the backend accepts the customer's current Customer Account API token, which proves that
 * Shopify accepts the token from a server (risk 26).
 *
 * - **Token:** only from `getValidAccessToken()` (D-121), as `Authorization: Bearer <token>`
 *   (D-161). Signed out, the request goes **without** an Authorization header, so the backend's
 *   own answer shows. Signed in with no usable token (offline at a refresh), nothing is sent.
 * - **Answer:** a fixed code only, never the response's text. No retry; one 12-second limit,
 *   above the function's own 10 seconds.
 * - Nothing is logged or reported, and no token, URL or response body reaches a result.
 */

import { getBackendConfig } from '@/config';
import { getCustomerSessionState, getValidAccessToken } from '@/customerAccount/session';

export const BACKEND_TIMEOUT_MILLIS = 12_000;

/** The backend's fixed error codes (`backend/functions/src/http/codes.ts`, D-162). */
export const BACKEND_ERROR_CODES = [
  'method_not_allowed',
  'payload_too_large',
  'unauthenticated',
  'not_found',
  'shopify_busy',
  'shopify_unavailable',
  'shopify_unexpected',
  'not_configured',
  'internal',
] as const;

export type BackendErrorCode = (typeof BACKEND_ERROR_CODES)[number];

export type BackendCheckResult =
  | 'ok'
  | BackendErrorCode
  /** This build has no backend address (`src/config/backend.ts`). */
  | 'app_not_configured'
  /** Signed in, but no valid access token could be had just now. */
  | 'token_unavailable'
  | 'network'
  | 'timeout'
  /** A status or body that is not one of the backend's own answers. */
  | `http_${number}`
  | 'unexpected';

function isBackendErrorCode(value: unknown): value is BackendErrorCode {
  return BACKEND_ERROR_CODES.some((code) => code === value);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)[name]
    : undefined;
}

/** Whether this build has a backend address: development builds with EXPO_PUBLIC_BACKEND_URL. */
export function hasBackend(): boolean {
  return getBackendConfig() !== undefined;
}

/** Development builds only: Home's "Backend: check" (D-166). */
export async function checkBackendIdentity(): Promise<BackendCheckResult> {
  const config = getBackendConfig();
  if (config === undefined) return 'app_not_configured';

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (getCustomerSessionState().status === 'signedIn') {
    const token = await getValidAccessToken();
    if (token === undefined) return 'token_unavailable';
    headers.Authorization = `Bearer ${token}`;
  }

  // AbortController rather than AbortSignal.timeout, which React Native does not provide.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, BACKEND_TIMEOUT_MILLIS);
  let response: Response;
  let body: unknown;
  try {
    response = await fetch(`${config.baseUrl}/whoami`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    body = await readJson(response);
  } catch {
    // The error can carry the URL, so only the kind of failure is kept.
    return timedOut ? 'timeout' : 'network';
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 200) return field(body, 'status') === 'ok' ? 'ok' : 'unexpected';
  const code = field(body, 'error');
  return isBackendErrorCode(code) ? code : `http_${response.status}`;
}
