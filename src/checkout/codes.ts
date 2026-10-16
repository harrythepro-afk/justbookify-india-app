/**
 * The checkout's fixed codes (P9-01, D-153): where and why checkout ended without an order, and how
 * an order was paid. Plain values with no Firebase or Checkout Kit import, so the sheet, the hook and
 * the events share them.
 */

/** Where checkout stopped: before it opened (`prepare`), or in Checkout Kit or the browser. */
export type CheckoutFailureStage = 'prepare' | 'checkout';

/** Why checkout did not open (`prepare`). */
export const CHECKOUT_PREPARE_CODES = [
  'no_network',
  'signed_out',
  'token_unavailable',
  'cart_gone',
  'rented_out',
  'over_cap',
  'shopify_error',
] as const;

/**
 * How checkout ended without an order (`checkout`): `closed` by the customer, or Checkout Kit's own
 * error code (`CheckoutErrorCode` in 3.9.1), anything else as `unknown`.
 */
export const CHECKOUT_ERROR_CODES = [
  'closed',
  'storefront_password_required',
  'cart_expired',
  'cart_completed',
  'invalid_cart',
  'client_error',
  'http_error',
  'error_sending_message',
  'error_receiving_message',
  'render_process_gone',
  'unknown',
] as const;

export type CheckoutPrepareCode = (typeof CHECKOUT_PREPARE_CODES)[number];
export type CheckoutErrorCode = (typeof CHECKOUT_ERROR_CODES)[number];

/** Checkout Kit's error code as one of the fixed codes; anything else is `unknown`. */
export function checkoutErrorCode(code: unknown): CheckoutErrorCode {
  return (CHECKOUT_ERROR_CODES as readonly unknown[]).includes(code) && code !== 'closed'
    ? (code as CheckoutErrorCode)
    : 'unknown';
}

/** How the order was paid, as a fixed code (D-153). */
export type PaymentType = 'cash_on_delivery' | 'prepaid' | 'unknown';

/**
 * The payment type from Checkout Kit's payment method `type` only (its `details` are never read).
 * Shopify's docs give no list of types, so only a type that plainly names cash on delivery or a
 * prepaid method is mapped; anything else is `unknown`.
 */
export function paymentTypeOf(type: unknown): PaymentType {
  if (typeof type !== 'string') return 'unknown';
  const word = type.toLowerCase();
  if (/cash|cod\b|manual/.test(word)) return 'cash_on_delivery';
  if (/card|upi|wallet|razorpay|paypal|shop_pay|apple_pay|google_pay|offsite|credit/.test(word)) {
    return 'prepaid';
  }
  return 'unknown';
}
