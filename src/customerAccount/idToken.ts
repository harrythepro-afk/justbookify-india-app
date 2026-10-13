/**
 * The ID token's claims and the checks the app makes itself (D-121): `expo-auth-session` sends
 * the nonce but does not verify the token.
 *
 * The signature is not checked. The token comes straight from Shopify's token endpoint over TLS
 * in the authorization code flow, which OpenID Connect Core 1.0 (3.1.3.7) allows in place of a
 * signature check. The app is an untrusted client anyway: nothing on Shopify or the backend trusts
 * what the app says the token holds (`SECURITY.md`).
 */

export type IdTokenClaims = {
  readonly iss: string;
  readonly aud: readonly string[];
  readonly exp: number;
  readonly iat: number;
  readonly nonce?: string;
  /** Shown on the Account tab only; never stored elsewhere, logged or reported. */
  readonly email?: string;
};

export type IdTokenProblem =
  | 'id_token_malformed'
  | 'nonce_mismatch'
  | 'issuer_mismatch'
  | 'audience_mismatch'
  | 'id_token_expired'
  | 'id_token_from_future';

export type IdTokenCheck =
  | { readonly ok: true; readonly claims: IdTokenClaims }
  | { readonly ok: false; readonly code: IdTokenProblem };

/** How far ahead of the phone's clock an `iat` may be before the token is refused. */
export const MAX_CLOCK_SKEW_SECONDS = 5 * 60;

const BASE64URL = /^[A-Za-z0-9_-]+$/;

/** UTF-8 JSON from base64url, with no library: `atob` gives bytes, decoded as UTF-8 here. */
function decodeBase64UrlJson(segment: string): unknown {
  if (!BASE64URL.test(segment)) return undefined;
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const bytes = atob(padded);
    const percentEncoded = Array.from(
      bytes,
      (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
    ).join('');
    return JSON.parse(decodeURIComponent(percentEncoded));
  } catch {
    return undefined;
  }
}

function plausibleEmail(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value)
    ? value
    : undefined;
}

/** The payload's claims, or undefined when the token is not a JWT with the claims the app needs. */
export function decodeIdTokenClaims(idToken: string): IdTokenClaims | undefined {
  const parts = idToken.split('.');
  if (parts.length !== 3 || parts[1] === undefined) return undefined;
  const payload = decodeBase64UrlJson(parts[1]);
  if (typeof payload !== 'object' || payload === null) return undefined;
  const claims = payload as Record<string, unknown>;

  const { iss, aud, exp, iat, nonce } = claims;
  const audience =
    typeof aud === 'string'
      ? [aud]
      : Array.isArray(aud) && aud.every((entry) => typeof entry === 'string')
        ? (aud as string[])
        : undefined;
  if (typeof iss !== 'string' || audience === undefined) return undefined;
  if (typeof exp !== 'number' || typeof iat !== 'number') return undefined;
  if (nonce !== undefined && typeof nonce !== 'string') return undefined;

  const email = plausibleEmail(claims.email);
  return {
    iss,
    aud: audience,
    exp,
    iat,
    ...(nonce === undefined ? {} : { nonce }),
    ...(email === undefined ? {} : { email }),
  };
}

export type IdTokenExpectation = {
  readonly issuer: string;
  readonly clientId: string;
  /**
   * At login: the nonce the app sent, which the token must carry. After a refresh: the login's
   * nonce, checked only if the new token carries one (OpenID Connect Core 12.2).
   */
  readonly nonce: string;
  readonly nonceRequired: boolean;
  /** Seconds since the epoch. */
  readonly now: number;
};

export function checkIdToken(idToken: string, expected: IdTokenExpectation): IdTokenCheck {
  const claims = decodeIdTokenClaims(idToken);
  if (claims === undefined) return { ok: false, code: 'id_token_malformed' };
  if (claims.nonce === undefined ? expected.nonceRequired : claims.nonce !== expected.nonce) {
    return { ok: false, code: 'nonce_mismatch' };
  }
  if (claims.iss !== expected.issuer) return { ok: false, code: 'issuer_mismatch' };
  if (!claims.aud.includes(expected.clientId)) return { ok: false, code: 'audience_mismatch' };
  if (claims.exp <= expected.now) return { ok: false, code: 'id_token_expired' };
  if (claims.iat > expected.now + MAX_CLOCK_SKEW_SECONDS) {
    return { ok: false, code: 'id_token_from_future' };
  }
  return { ok: true, claims };
}
