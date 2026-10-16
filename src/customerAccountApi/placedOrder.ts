/**
 * Finding the order a checkout just placed (P9-01, D-151), in the customer's own orders (P7-02),
 * so the Cart tab's confirmation can show its number. Pure functions; the hook that reads the
 * orders is in `hooks/customer.ts`.
 *
 * Checkout Kit's `completed` event names the order by an ID whose form its docs do not give (it may
 * be `gid://shopify/OrderIdentity/<n>` rather than the Customer Account API's
 * `gid://shopify/Order/<n>`), so only the trailing number is compared. When that finds nothing
 * (the browser has no event, or the forms differ), the newest order that was **not** among the
 * customer's orders when checkout started, and is dated since then, is taken; the allowance
 * PLACED_ORDER_CLOCK_SKEW_MILLIS covers a phone clock that differs from Shopify's. Without the
 * orders from the start there is no such guess, so an earlier order is never shown as new.
 */

import type { OrderSummary } from './orders';

/** How far before checkout started an order may be dated and still count as placed by it. */
export const PLACED_ORDER_CLOCK_SKEW_MILLIS = 5 * 60 * 1000;

const ORDER_GID = /^gid:\/\/shopify\/(Order|OrderIdentity)\/(\d{1,20})(?:\?.*)?$/;

/** The form of an order ID from checkout, for Home's development line only: never the ID. */
export type OrderIdForm = 'Order' | 'OrderIdentity' | 'other';

export function orderIdForm(id: string | undefined): OrderIdForm {
  const match = id === undefined ? null : ORDER_GID.exec(id);
  return match === null ? 'other' : (match[1] as 'Order' | 'OrderIdentity');
}

/** The order's number in an `Order` or `OrderIdentity` ID; undefined for anything else. */
export function orderIdNumber(id: string | undefined): string | undefined {
  const match = id === undefined ? null : ORDER_GID.exec(id);
  return match === null ? undefined : match[2];
}

export type PlacedOrderSearch = {
  /** The number from Checkout Kit's `completed` event, when there was one. */
  readonly orderNumber?: string;
  /** When the customer tapped "Checkout", in milliseconds since the epoch (the phone's clock). */
  readonly startedAt: number;
  /** The IDs of the customer's orders read when checkout started; undefined if that read failed. */
  readonly knownOrderIds?: ReadonlySet<string>;
};

/** The placed order among the customer's orders (newest first), or undefined. */
export function findPlacedOrder(
  orders: readonly OrderSummary[],
  { orderNumber, startedAt, knownOrderIds }: PlacedOrderSearch,
): OrderSummary | undefined {
  if (orderNumber !== undefined) {
    const byId = orders.find((order) => orderIdNumber(order.id) === orderNumber);
    if (byId !== undefined) return byId;
  }
  if (knownOrderIds === undefined) return undefined;
  const since = startedAt - PLACED_ORDER_CLOCK_SKEW_MILLIS;
  let newest: OrderSummary | undefined;
  for (const order of orders) {
    if (knownOrderIds.has(order.id)) continue;
    const placed = Date.parse(order.processedAt);
    if (Number.isNaN(placed) || placed < since) continue;
    if (newest === undefined || placed > Date.parse(newest.processedAt)) newest = order;
  }
  return newest;
}
