/**
 * The order cap (R2, P8-01 answer 2). The store's checkout blocks a subtotal of the cap or more
 * (the SMART Checkout Rules' "Shipping Price Restriction", books only, not delivery;
 * `SHOPIFY_AUDIT.md`), so a cart's subtotal must stay strictly under it: with a ₹500 cap, ₹499 is
 * allowed and exactly ₹500 is refused. The cap is store configuration (`orderCap`, `src/config/`).
 *
 * Amounts are compared in hundredths, so a sum such as 0.1 + 0.2 never decides a boundary.
 */

function hundredths(amount: number): number {
  return Math.round(amount * 100);
}

/** Whether a book at `price` may join a cart whose counted subtotal is `counted`. */
export function fitsUnderCap(counted: number, price: number, cap: number): boolean {
  return hundredths(counted) + hundredths(price) < hundredths(cap);
}

/** Whether a counted subtotal has reached the cap, so the cart cannot go to checkout. */
export function isAtOrOverCap(counted: number, cap: number): boolean {
  return hundredths(counted) >= hundredths(cap);
}

/**
 * The largest whole amount that still fits (owner, P8-01 plan review): with ₹300 in the cart and
 * a ₹500 cap, ₹199, because a book that brings the cart to exactly ₹500 is refused. 0 when no
 * whole amount fits.
 */
export function wholeAmountLeft(counted: number, cap: number): number {
  const room = hundredths(cap) - hundredths(counted);
  if (room <= 0) return 0;
  return Math.ceil(room / 100) - 1;
}
