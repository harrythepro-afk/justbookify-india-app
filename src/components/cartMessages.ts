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
