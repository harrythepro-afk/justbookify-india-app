/**
 * The Customer Account API's HTTP requests outside the browser (D-119, D-121): the discovery
 * document, the token endpoint (code exchange and refresh) and the logout endpoint. The only file
 * in `src/customerAccount/` that may call `fetch` (ESLint).
 *
 * Every result carries a code, never a token, a URL, a body or Shopify's text, so callers can
 * report it as it is. **Refused** means the token endpoint answered the OAuth error
 * `invalid_grant`, whatever the HTTP status: Shopify itself no longer accepts the grant (the
 * architect's change A to P7-01). Anything else, including another 400 or 401 such as
 * `invalid_client`, is **unavailable**: the customer stays signed in (D-121).
 */

export const OAUTH_TIMEOUT_MILLIS = 15_000;

export type OAuthFailureCode =
  'network' | 'timeout' | 'malformed_response' | `http_${number}` | `oauth_${string}`;

export type JsonResult =
  | { readonly ok: true; readonly body: unknown }
  | { readonly ok: false; readonly code: OAuthFailureCode };

export type TokenResponseBody = {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly refreshToken?: string;
  readonly idToken?: string;
};

export type TokenResult =
  | { readonly ok: true; readonly tokens: TokenResponseBody }
  | {
      readonly ok: false;
      readonly kind: 'refused' | 'unavailable';
      readonly code: OAuthFailureCode;
    };

// OAuth error codes are short lowercase words (RFC 6749 5.2). Anything else is not echoed.
const OAUTH_ERROR_CODE = /^[a-z_]{1,40}$/;

/** Form encoding by hand: React Native's URLSearchParams does not implement every method. */
export function formEncode(params: Readonly<Record<string, string>>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

type Attempt =
  | { readonly ok: true; readonly response: Response }
  | { readonly ok: false; readonly code: 'network' | 'timeout' };

async function attempt(url: string, init: RequestInit): Promise<Attempt> {
  // AbortController rather than AbortSignal.timeout, which React Native does not provide.
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OAUTH_TIMEOUT_MILLIS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return { ok: true, response };
  } catch {
    // The error can carry the URL, so only the kind of failure is kept.
    return { ok: false, code: timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** A GET of a JSON document, such as the store's discovery documents. */
export async function getJson(url: string): Promise<JsonResult> {
  const result = await attempt(url, { method: 'GET', headers: { Accept: 'application/json' } });
  if (!result.ok) return result;
  if (!result.response.ok) return { ok: false, code: `http_${result.response.status}` };
  const body = await readJson(result.response);
  return body === undefined ? { ok: false, code: 'malformed_response' } : { ok: true, body };
}

function parseTokenBody(body: unknown): TokenResponseBody | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const fields = body as Record<string, unknown>;
  const accessToken = fields.access_token;
  const expiresIn = fields.expires_in;
  const refreshToken = fields.refresh_token;
  const idToken = fields.id_token;
  if (typeof accessToken !== 'string' || accessToken === '') return undefined;
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined;
  }
  if (refreshToken !== undefined && (typeof refreshToken !== 'string' || refreshToken === '')) {
    return undefined;
  }
  if (idToken !== undefined && (typeof idToken !== 'string' || idToken === '')) return undefined;
  return {
    accessToken,
    expiresIn,
    ...(refreshToken === undefined ? {} : { refreshToken }),
    ...(idToken === undefined ? {} : { idToken }),
  };
}

function oauthErrorOf(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const error = (body as Record<string, unknown>).error;
  return typeof error === 'string' ? error : undefined;
}

/**
 * A form POST to the token endpoint: `authorization_code` at login, `refresh_token` after. The
 * request carries no Origin header: Shopify's origins setting applies to web clients only.
 */
export async function postTokenRequest(
  tokenEndpoint: string,
  params: Readonly<Record<string, string>>,
): Promise<TokenResult> {
  const result = await attempt(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formEncode(params),
  });
  if (!result.ok) return { ok: false, kind: 'unavailable', code: result.code };

  const { response } = result;
  const body = await readJson(response);
  if (response.ok) {
    const tokens = parseTokenBody(body);
    return tokens === undefined
      ? { ok: false, kind: 'unavailable', code: 'malformed_response' }
      : { ok: true, tokens };
  }

  const error = oauthErrorOf(body);
  if (error === 'invalid_grant') return { ok: false, kind: 'refused', code: 'oauth_invalid_grant' };
  if (error !== undefined && OAUTH_ERROR_CODE.test(error)) {
    return { ok: false, kind: 'unavailable', code: `oauth_${error}` };
  }
  return { ok: false, kind: 'unavailable', code: `http_${response.status}` };
}

export type LogoutResult =
  { readonly ok: true } | { readonly ok: false; readonly code: OAuthFailureCode };

/**
 * Shopify's logout for mobile clients: the end-session endpoint called as an API, which answers
 * 200 OK; `id_token_hint` is required (Customer Account API reference, read 13 October 2026).
 */
export async function callLogoutEndpoint(
  endSessionEndpoint: string,
  idToken: string,
): Promise<LogoutResult> {
  const separator = endSessionEndpoint.includes('?') ? '&' : '?';
  const url = `${endSessionEndpoint}${separator}${formEncode({ id_token_hint: idToken })}`;
  const result = await attempt(url, { method: 'GET' });
  if (!result.ok) return result;
  await result.response.body?.cancel().catch(() => undefined);
  return result.response.ok ? { ok: true } : { ok: false, code: `http_${result.response.status}` };
}
