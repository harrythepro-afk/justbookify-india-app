import { Alert } from 'react-native';

import {
  trackBookAddedToCart,
  trackBookRemovedFromCart,
  trackBookUnavailable,
  trackCapReached,
} from '@/analytics/cartEvents';
import { openScreen } from '@/navigation/openGuard';
import {
  formatCartAmount,
  orderCapAmount,
  type AddOutcome,
  type CartChangeFailure,
  type RemoveOutcome,
} from '@/shopify/hooks/cart';

import { ERROR_MESSAGE, OFFLINE_MESSAGE } from './ScreenMessage';

// The cart's wording (owner, P8-01 plan review, 13 October 2026). Amounts in the store's currency
// format; the cap comes from the store configuration (R2).

/** A book that would take the cart to the cap or past it (message 1). */
export function capRefusalMessage(cap: string): string {
  return `Each order can have books worth less than ${cap}. Remove a book to add this one.`;
}

/** The Cart tab's room line (message 2), with the largest whole amount that still fits. */
export function roomLeftMessage(amount: string): string {
  return `You can add books worth up to ${amount} more.`;
}

/** The Cart tab when no whole amount fits any more. */
export function capReachedMessage(cap: string): string {
  return `Each order can have books worth less than ${cap}.`;
}

/** The Cart tab when Shopify's subtotal is at or over the cap (message 5). */
export function overCapMessage(worth: string, cap: string): string {
  return `Your books are worth ${worth}. Each order can have books worth less than ${cap}. Remove a book to continue.`;
}

export const EMPTY_CART_MESSAGE = 'Your cart is empty.';
export const RENTED_OUT_IN_CART_MESSAGE =
  'A book in your cart has been rented out. Remove it to continue.';
export const JUST_RENTED_OUT_MESSAGE = 'This book has just been rented out.';
export const GO_TO_CART = 'Go to Cart';
/** The cap pop-up's title (owner, 14 October 2026, D-140). The other alerts have none. */
export const CAP_ALERT_TITLE = 'Order limit reached';

const CART_HREF = '/cart';

function showMessage(message: string, withCartButton = false, title = ''): void {
  Alert.alert(
    title,
    message,
    withCartButton
      ? [
          { text: 'OK', style: 'cancel' },
          { text: GO_TO_CART, onPress: () => void openScreen(CART_HREF, 'navigate') },
        ]
      : [{ text: 'OK' }],
  );
}

function showFailure(failure: CartChangeFailure): void {
  if (failure.kind === 'failed') showMessage(failure.offline ? OFFLINE_MESSAGE : ERROR_MESSAGE);
}

/**
 * What the customer sees and what is recorded after "Add to Cart": nothing on the screen for a
 * book added (the button says "In cart", answer 6), the cap message with "Go to Cart", the
 * rented-out message, or the offline or error message. A tap ignored while another change runs,
 * or a change a logout overtook, shows nothing.
 */
export function afterAdd(productGid: string, result: AddOutcome | CartChangeFailure): void {
  switch (result.kind) {
    case 'added':
      trackBookAddedToCart(productGid, result.cart.books.length);
      return;
    case 'cap':
      trackCapReached(result.cart.countedSubtotal);
      showMessage(capRefusalMessage(formatCartAmount(orderCapAmount())), true, CAP_ALERT_TITLE);
      return;
    case 'rented-out':
      trackBookUnavailable(productGid, 'add_to_cart');
      showMessage(JUST_RENTED_OUT_MESSAGE);
      return;
    case 'busy':
    case 'failed':
      showFailure(result);
      return;
    case 'in-cart':
    case 'stale':
      return;
  }
}

/** After "Remove": the event once Shopify confirmed it, or the offline or error message. */
export function afterRemove(productGid: string, result: RemoveOutcome | CartChangeFailure): void {
  switch (result.kind) {
    case 'removed':
      trackBookRemovedFromCart(productGid, result.cart.books.length);
      return;
    case 'busy':
    case 'failed':
      showFailure(result);
      return;
    case 'stale':
      return;
  }
}

// The delivery hints and the pincode check (owner and architect, P8-02, approved at plan review on
// 14 October 2026). Amounts in the store's currency format, all from the store configuration.

export const FREE_DELIVERY = 'Free';
export const DELIVERY_NOTE = 'Final delivery charges are shown at checkout.';

/** The prepaid fee, shown prominently: "Delivery: ₹75" or "Delivery: Free". */
export function deliveryLine(fee: string): string {
  return `Delivery: ${fee}`;
}

/**
 * The smaller cash-on-delivery line: under the threshold, the rate and the rate from the threshold
 * ("Cash on delivery: ₹125, or ₹50 from ₹200"); from the threshold, the rate alone.
 */
export function codLine(
  fee: string,
  from?: { readonly fee: string; readonly threshold: string },
): string {
  return from === undefined
    ? `Cash on delivery: ${fee}`
    : `Cash on delivery: ${fee}, or ${from.fee} from ${from.threshold}`;
}

/** How much more makes prepaid delivery free; never shown past the order cap. */
export function freeDeliveryHint(amount: string): string {
  return `Add books worth ${amount} more for free delivery.`;
}

export const PINCODE_LABEL = 'Delivery pincode';
export const PINCODE_HINT = 'Six digits';
export const PINCODE_CHECK = 'Check';
export const PINCODE_CLEAR = 'Clear pincode';
export const PINCODE_OUTSIDE_MESSAGE = "Sorry, we don't deliver to this pincode yet.";
export const PINCODE_INVALID_MESSAGE = 'Enter a 6-digit pincode.';

/** A pincode inside the delivery area. The pincode is shown, never recorded (D-142). */
export function pincodeInAreaMessage(pincode: string): string {
  return `We deliver to ${pincode}.`;
}

// Checkout's wording (owner, P9-01 plan approval, 15 October 2026; D-148, D-151).
export const CHECKOUT_LABEL = 'Checkout';
export const OPENING_CHECKOUT_LABEL = 'Opening checkout…';
export const LOG_IN_TO_CHECK_OUT_LABEL = 'Log in to check out';
export const LOG_IN_TO_CHECK_OUT_NOTE = 'Log in to place your order. Your cart will be kept.';
export const CHECKOUT_FAILED_MESSAGE = "Checkout couldn't be opened. Please try again.";
export const GO_TO_MY_BOOKS = 'Go to My Books';

/** The confirmation after an order (owner's draft); without the number until it is found. */
export function orderPlacedMessage(orderName: string | undefined): string {
  return orderName === undefined
    ? "Thank you! Your order is placed. We'll deliver your books soon."
    : `Thank you! Your order ${orderName} is placed. We'll deliver your books soon.`;
}

/** After "Checkout" could not open: offline, or anything else (as the cart's other alerts). */
export function showCheckoutFailure(offline: boolean): void {
  showMessage(offline ? OFFLINE_MESSAGE : ERROR_MESSAGE);
}

/** Checkout Kit or the browser ended with an error; the cart is kept. */
export function showCheckoutError(): void {
  showMessage(CHECKOUT_FAILED_MESSAGE);
}
