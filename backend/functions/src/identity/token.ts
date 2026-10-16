/**
 * The customer's Customer Account API access token from `Authorization: Bearer <token>` (D-161).
 * Shopify documents no token format, so only the shape is checked here: one token of 20 to 4,096
 * visible ASCII characters. Shopify decides whether it is valid. The token is never logged, stored
 * or returned.
 */
const BEARER = /^Bearer ([\x21-\x7E]{20,4096})$/i;

export function parseBearerToken(header: string | string[] | undefined): string | undefined {
  if (typeof header !== 'string') return undefined;
  return BEARER.exec(header)?.[1];
}
