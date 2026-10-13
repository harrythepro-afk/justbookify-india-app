/**
 * The cart's usage events (P8-01): `select_book`, `remove_book`, `view_cart`, `order_cap_reached`
 * and `book_unavailable_shown`, built from Shopify's product IDs, counts and amounts. Never the
 * cart's ID, a line's ID, a title or anything personal. Every value passes the guard in
 * `events.ts`, and nothing is sent without consent (D-048). A product ID that cannot be made into
 * an ID drops the event, reported by event and parameter name only.
 */

import {
  reportDropped,
  trackBookUnavailableShown,
  trackOrderCapReached,
  trackRemoveBook,
  trackSelectBook,
  trackViewCart,
} from './events';
import { analyticsProductId, analyticsToken } from './ids';

/** Where a selected book was found rented out (P8-01, answer 5 and the plan review). */
export type UnavailableStage = 'cart' | 'add_to_cart';

/** The money a cart event carries: the counted subtotal, in the store's currency. */
function cartValue(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Shopify confirmed the add; `cartSize` is the number of books in the cart afterwards. */
export function trackBookAddedToCart(productGid: string, cartSize: number): void {
  const id = analyticsProductId(productGid);
  if (id === undefined) {
    reportDropped('select_book', 'product_id');
    return;
  }
  trackSelectBook({ product_id: id, cart_size: cartSize });
}

/** Shopify confirmed the removal; `cartSize` is the number of books in the cart afterwards. */
export function trackBookRemovedFromCart(productGid: string, cartSize: number): void {
  const id = analyticsProductId(productGid);
  if (id === undefined) {
    reportDropped('remove_book', 'product_id');
    return;
  }
  trackRemoveBook({ product_id: id, cart_size: cartSize });
}

/** The Cart tab showed the cart, an empty one included (plan review, answer (c)). */
export function trackCartShown(bookCount: number, countedSubtotal: number): void {
  trackViewCart({ book_count: bookCount, cart_value: cartValue(countedSubtotal) });
}

/** An add was refused by the order cap (R2); the cart's counted subtotal then. */
export function trackCapReached(countedSubtotal: number): void {
  trackOrderCapReached({ cart_value: cartValue(countedSubtotal) });
}

/** A selected book was shown as rented out: in the cart, or when it was being added. */
export function trackBookUnavailable(productGid: string, stage: UnavailableStage): void {
  const id = analyticsProductId(productGid);
  const code = analyticsToken(stage);
  if (id === undefined || code === undefined) {
    reportDropped('book_unavailable_shown', id === undefined ? 'product_id' : 'stage');
    return;
  }
  trackBookUnavailableShown({ product_id: id, stage: code });
}
