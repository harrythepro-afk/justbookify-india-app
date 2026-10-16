/**
 * The backend's fixed error codes (D-162). A response carries only one of these, never a message,
 * Shopify's text or any request data, so the app can map them and logs can count them.
 */
export const ERROR_STATUS = {
  method_not_allowed: 405,
  payload_too_large: 413,
  unauthenticated: 401,
  not_found: 404,
  shopify_busy: 503,
  shopify_unavailable: 503,
  shopify_unexpected: 502,
  not_configured: 503,
  internal: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

/** What a Shopify identity check can fail with (D-161). */
export type IdentityErrorCode = Extract<
  ErrorCode,
  'unauthenticated' | 'shopify_busy' | 'shopify_unavailable' | 'shopify_unexpected'
>;
