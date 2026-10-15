/**
 * What the Cart tab shows after checkout (P9-01, D-148, D-151), held outside the cart's cache so it
 * survives the cart being forgotten (a new cache key) when an order is placed:
 *
 * - **The confirmation**: shown on the Cart tab in place of the empty cart, first without the
 *   order's number and then with it once the order is found in the customer's orders; cleared when
 *   the tab loses focus.
 * - **The held consent request** (D-129, owner's answers): after a login started on the Cart tab,
 *   when the request would be asked, it waits for a confirmed order in that login and is dropped
 *   when checkout ends without one.
 * - **The last checkout, for Home's development line only:** how it was presented and ended, the
 *   form of the order ID from Checkout Kit (never the ID) and whether the order was found.
 *
 * Memory only. Nothing personal: an order's name such as "#1004" is the only order value kept.
 */

import { useSyncExternalStore } from 'react';

import type { OrderIdForm } from '@/customerAccountApi/placedOrder';

export type CheckoutConfirmation = {
  /** Shopify's order name, such as "#1004", once the order is found; undefined until then. */
  readonly orderName: string | undefined;
};

export type LastCheckout = {
  readonly presentation: 'sheet' | 'browser';
  readonly ended: 'open' | 'placed' | 'closed' | 'failed';
  readonly orderIdForm?: OrderIdForm;
  readonly orderFound?: boolean;
};

type CheckoutState = {
  readonly confirmation: CheckoutConfirmation | null;
  readonly consentHeld: boolean;
  readonly last: LastCheckout | undefined;
};

const INITIAL: CheckoutState = { confirmation: null, consentHeld: false, last: undefined };

let state: CheckoutState = INITIAL;
const listeners = new Set<() => void>();

function update(next: Partial<CheckoutState>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCheckoutState(): CheckoutState {
  return state;
}

export function useCheckoutState(): CheckoutState {
  return useSyncExternalStore(subscribe, getCheckoutState, getCheckoutState);
}

export function showConfirmation(confirmation: CheckoutConfirmation): void {
  update({ confirmation });
}

export function clearConfirmation(): void {
  if (state.confirmation !== null) update({ confirmation: null });
}

/** After a login started on the Cart tab, when the consent request would be asked (D-129). */
export function holdConsentRequest(): void {
  update({ consentHeld: true });
}

/** The held request was shown, or checkout ended without an order, or the customer logged out. */
export function releaseConsentRequest(): void {
  if (state.consentHeld) update({ consentHeld: false });
}

export function recordLastCheckout(last: LastCheckout): void {
  update({ last });
}

/** Tests only. */
export function resetCheckoutStateForTests(): void {
  state = INITIAL;
  listeners.clear();
}
