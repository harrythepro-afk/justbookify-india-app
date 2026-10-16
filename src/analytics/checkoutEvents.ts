/**
 * The checkout's usage events (P9-01, D-153): `begin_checkout`, `rental_order_success` and
 * `checkout_failed`, from counts, amounts, an order's number and fixed codes only. Never the cart's
 * ID, the checkout URL, the customer's token, or anything from Checkout Kit's `completed` payload
 * other than the order ID's number and the payment type's code (its email, phone, addresses and
 * payment details are never read). Every value passes the guard in `events.ts`, and nothing is
 * sent without consent (D-048).
 */

import {
  reportDropped,
  trackBeginCheckout,
  trackCheckoutFailed,
  trackRentalOrderSuccess,
} from './events';
import type {
  CheckoutErrorCode,
  CheckoutFailureStage,
  CheckoutPrepareCode,
  PaymentType,
} from '@/checkout/codes';

import { analyticsOrderId, analyticsToken } from './ids';

export {
  CHECKOUT_ERROR_CODES,
  CHECKOUT_PREPARE_CODES,
  checkoutErrorCode,
  paymentTypeOf,
  type CheckoutErrorCode,
  type CheckoutFailureStage,
  type CheckoutPrepareCode,
  type PaymentType,
} from '@/checkout/codes';

function money(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Checkout was presented, with the cart Shopify returned for it. */
export function trackCheckoutBegun(bookCount: number, countedSubtotal: number): void {
  trackBeginCheckout({ book_count: bookCount, cart_value: money(countedSubtotal) });
}

/** The order was placed; `orderNumber` is the number in its ID. */
export function trackOrderPlaced(
  orderNumber: string | undefined,
  bookCount: number,
  paymentType: PaymentType,
): void {
  const id =
    orderNumber === undefined ? undefined : analyticsOrderId(`gid://shopify/Order/${orderNumber}`);
  const code = analyticsToken(paymentType);
  if (id === undefined || code === undefined) {
    reportDropped('rental_order_success', id === undefined ? 'order_id' : 'payment_type');
    return;
  }
  trackRentalOrderSuccess({ order_id: id, book_count: bookCount, payment_type: code });
}

/** Checkout did not open, or ended without an order. */
export function trackCheckoutStopped(
  stage: CheckoutFailureStage,
  code: CheckoutPrepareCode | CheckoutErrorCode,
): void {
  const stageCode = analyticsToken(stage);
  const errorCode = analyticsToken(code);
  if (stageCode === undefined || errorCode === undefined) {
    reportDropped('checkout_failed', stageCode === undefined ? 'stage' : 'error_code');
    return;
  }
  trackCheckoutFailed({ stage: stageCode, error_code: errorCode });
}
