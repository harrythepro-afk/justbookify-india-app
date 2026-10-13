/**
 * Which cart this phone uses (P8-01): the cart's ID, read once per launch from secure storage
 * (`cartStorage.ts`, answer 4), kept in memory, and forgotten at "Log out" and when Shopify
 * refuses the refresh (`src/customerAccount/session.ts`), and when Shopify no longer has the cart.
 *
 * Each logout starts a new generation. A cart change or a read that began before it checks its
 * generation before saving or showing anything, so a change still in flight at logout never
 * writes the old cart, or a new cart made for it, back.
 *
 * The ID holds Shopify's secret key for the cart: never logged, reported, sent to analytics, put
 * in a cache key or shown. Storage problems are reported by code only.
 */

import { reportCartProblem } from '@/crashReporting/sentry';

import { deleteStoredCartId, readStoredCartId, writeStoredCartId } from './cartStorage';

export type CartIdState =
  { readonly status: 'loading' } | { readonly status: 'ready'; readonly cartId: string | null };

const LOADING: CartIdState = { status: 'loading' };

let state: CartIdState = LOADING;
let generation = 0;
let forgets = 0;
let loading: Promise<void> | undefined;
const listeners = new Set<() => void>();

function setState(next: CartIdState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function getCartIdState(): CartIdState {
  return state;
}

export function subscribeCartId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * How many times a cart has been forgotten in this run. Not secret: the cart's cache key holds it,
 * so the screens move to an empty cart at once when a cart is forgotten, even when the cache is
 * emptied after their last redraw ("Log out", P8-01).
 */
export function cartForgetCount(): number {
  return forgets;
}

/** The current generation; a change keeps it from its start and checks it before saving. */
export function cartGeneration(): number {
  return generation;
}

/**
 * Reads the stored ID once per launch. A store that cannot be read gives no cart for this launch
 * and deletes nothing, as for the login (D-121).
 */
export function loadCartId(): Promise<void> {
  loading ??= (async () => {
    const started = generation;
    let cartId: string | null = null;
    try {
      cartId = await readStoredCartId();
    } catch {
      reportCartProblem('storage_read_failed');
    }
    if (started === generation) setState({ status: 'ready', cartId });
  })();
  return loading;
}

/**
 * Saves the ID of a cart just created, if nothing was forgotten since `startedAt`. Returns false
 * when it was too late (a logout came first). A failed write keeps the ID for this launch.
 */
export async function rememberCartId(cartId: string, startedAt: number): Promise<boolean> {
  if (startedAt !== generation) return false;
  setState({ status: 'ready', cartId });
  try {
    await writeStoredCartId(cartId);
  } catch {
    reportCartProblem('storage_write_failed');
  }
  return true;
}

/**
 * Forgets the cart at "Log out" and a refused refresh (answer 4). Starts a new generation, so no
 * change in flight can save a cart afterwards.
 */
export function forgetCart(): Promise<void> {
  generation += 1;
  return clear();
}

/**
 * Forgets the cart with this ID when Shopify no longer has it (expired, or its order was placed).
 * A newer cart is kept. Not a new generation: a change in flight may replace the cart.
 */
export async function forgetGoneCart(cartId: string): Promise<void> {
  if (state.status === 'ready' && state.cartId === cartId) await clear();
}

async function clear(): Promise<void> {
  forgets += 1;
  setState({ status: 'ready', cartId: null });
  try {
    await deleteStoredCartId();
  } catch {
    reportCartProblem('storage_delete_failed');
  }
}

/** Tests only: back to a fresh launch. */
export function resetCartIdForTests(): void {
  state = LOADING;
  generation = 0;
  forgets = 0;
  loading = undefined;
  listeners.clear();
}
