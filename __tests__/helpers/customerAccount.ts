/**
 * Invented Customer Account API values for tests (P7-01). None is a real token, ID or address.
 */

export const TEST_SHOP_ID = '987654321012';
export const TEST_CLIENT_ID = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
export const TEST_ISSUER = `https://shopify.com/authentication/${TEST_SHOP_ID}`;
export const TEST_STORE_DOMAIN = 'example-dev.myshopify.com';
export const TEST_REDIRECT_URI = `shop.${TEST_SHOP_ID}.app://callback`;

export const TEST_OPENID_CONFIGURATION = {
  issuer: TEST_ISSUER,
  authorization_endpoint: `https://shopify.com/authentication/${TEST_SHOP_ID}/oauth/authorize`,
  token_endpoint: `https://shopify.com/authentication/${TEST_SHOP_ID}/oauth/token`,
  end_session_endpoint: `https://shopify.com/authentication/${TEST_SHOP_ID}/logout`,
  jwks_uri: `https://shopify.com/authentication/${TEST_SHOP_ID}/.well-known/jwks.json`,
};

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

/** An unsigned JWT with the given claims; the app does not check the signature (D-121). */
export function makeIdToken(claims: Record<string, unknown>): string {
  return `${base64UrlJson({ alg: 'RS256', typ: 'JWT' })}.${base64UrlJson(claims)}.c2lnbmF0dXJl`;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Claims that pass every check for the given nonce. */
export function validClaims(nonce: string, extra: Record<string, unknown> = {}) {
  const now = nowSeconds();
  return {
    iss: TEST_ISSUER,
    aud: TEST_CLIENT_ID,
    exp: now + 3600,
    iat: now,
    nonce,
    email: 'reader@example.com',
    ...extra,
  };
}
