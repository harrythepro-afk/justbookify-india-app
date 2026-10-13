/**
 * Adding and removing books (P8-01), each as one flow of Storefront calls that the cart hooks run
 * as one mutation. Each Shopify mutation is sent once and never retried (D-057); a flow that
 * cannot reach Shopify fails at once and nothing runs later (D-065).
 *
 * **Adding** (answers 1, 2, 5 and the plan review):
 * 1. One copy per book: a book already in the cart is not added again.
 * 2. The cap's first check, with the book's own price: `counted + price < cap`.
 * 3. No cart yet: `cartCreate` with the book, and its ID is saved. A cart: `cartLinesAdd`. When
 *    Shopify refuses the add, the cart is read again; if it is gone (expired, or its order was
 *    placed), its ID is forgotten and a new cart is created with the book. The refused add changed
 *    nothing, so this is a different request, not a retry.
 * 4. Shopify refuses the book (`MERCHANDISE_NOT_APPLICABLE`), or keeps it at zero or not for sale:
 *    the book has just been rented out; a line Shopify kept is removed again.
 * 5. The cap's second check, against Shopify's own subtotal: at or over the cap, the line just
 *    added is removed again ("undone"); if that removal fails, the cart stays over the cap and the
 *    Cart tab says so.
 *
 * A logout during a flow makes it `stale`: nothing is saved and nothing is shown.
 */

import { getStoreConfig } from '@/config';

import type { BookCard } from './bookCard';
import {
  addCartLine,
  createCart,
  EMPTY_CART,
  isUserErrors,
  MERCHANDISE_NOT_APPLICABLE,
  readCart,
  removeCartLine,
  type Cart,
  type CartBook,
} from './cart';
import {
  cartGeneration,
  forgetGoneCart,
  getCartIdState,
  loadCartId,
  rememberCartId,
} from './cartId';
import { reportStorefrontError } from './errors';
import { fitsUnderCap, isAtOrOverCap } from './orderCap';

export type BookToAdd = Pick<BookCard, 'id' | 'variantId' | 'priceAmount'>;

export type AddOutcome =
  | { readonly kind: 'added'; readonly cart: Cart }
  /** Already in the cart (a tap that raced the cart's update). */
  | { readonly kind: 'in-cart'; readonly cart: Cart }
  /**
   * Refused by the cap. `undone` is false only when the add went through and could not be
   * removed again, so the cart is over the cap.
   */
  | { readonly kind: 'cap'; readonly cart: Cart; readonly undone: boolean }
  | { readonly kind: 'rented-out'; readonly cart: Cart }
  /** A logout came first: nothing to save or show. */
  | { readonly kind: 'stale' };

export type RemoveOutcome =
  { readonly kind: 'removed'; readonly cart: Cart } | { readonly kind: 'stale' };

/** The book's line in the cart, if any. */
export function cartLineFor(cart: Cart, variantId: string): CartBook | undefined {
  return cart.books.find((book) => book.variantId === variantId);
}

function currentCartId(): string | null {
  const state = getCartIdState();
  return state.status === 'ready' ? state.cartId : null;
}

/** Reads the cart by ID; a cart Shopify no longer has is forgotten and counts as empty. */
export async function readCartOrForget(
  cartId: string,
  { signal }: { readonly signal?: AbortSignal } = {},
): Promise<Cart> {
  const cart = await readCart(cartId, getStoreConfig(), { signal });
  if (cart !== null) return cart;
  await forgetGoneCart(cartId);
  return EMPTY_CART;
}

function isNotApplicable(error: unknown): boolean {
  return isUserErrors(error) && error.codes.includes(MERCHANDISE_NOT_APPLICABLE);
}

type Placed = { readonly cartId: string; readonly cart: Cart } | 'rented-out' | 'stale';

/** Creates a cart with the book and saves its ID, unless a logout came first. */
async function createWith(variantId: string, startedAt: number): Promise<Placed> {
  try {
    const created = await createCart(variantId, getStoreConfig());
    return (await rememberCartId(created.cartId, startedAt)) ? created : 'stale';
  } catch (error) {
    if (isNotApplicable(error)) return 'rented-out';
    throw error;
  }
}

/** Puts the book into the cart with this ID, or into a new cart when there is none any more. */
async function placeBook(
  cartId: string | null,
  variantId: string,
  startedAt: number,
): Promise<Placed> {
  if (cartId === null) return createWith(variantId, startedAt);
  try {
    return { cartId, cart: await addCartLine(cartId, variantId, getStoreConfig()) };
  } catch (error) {
    if (isNotApplicable(error)) return 'rented-out';
    if (!isUserErrors(error)) throw error;
    // Refused: if Shopify no longer has the cart, start a new one quietly.
    const again = await readCart(cartId, getStoreConfig());
    if (again !== null) throw error;
    await forgetGoneCart(cartId);
    return createWith(variantId, startedAt);
  }
}

/** Removes a line the flow does not want any more; null when that fails (reported by code). */
async function takeBack(cartId: string, lineId: string): Promise<Cart | null> {
  try {
    return await removeCartLine(cartId, lineId, getStoreConfig());
  } catch (error) {
    // The flow handles the failure itself, so the cache never sees it (D-057, D-061).
    reportStorefrontError(error);
    return null;
  }
}

/**
 * Adds one copy of a book. `current` is the cart on screen, or undefined when it has not been
 * read yet. Throws a StorefrontError (or a CartDataError) when the cart cannot be reached.
 */
export async function addBookToCart(
  book: BookToAdd,
  current: Cart | undefined,
): Promise<AddOutcome> {
  await loadCartId();
  const startedAt = cartGeneration();
  const isStale = () => cartGeneration() !== startedAt;
  const { orderCap } = getStoreConfig();
  const firstId = currentCartId();
  const cart = current ?? (firstId === null ? EMPTY_CART : await readCartOrForget(firstId));
  if (isStale()) return { kind: 'stale' };

  if (cartLineFor(cart, book.variantId) !== undefined) return { kind: 'in-cart', cart };
  if (!fitsUnderCap(cart.countedSubtotal, book.priceAmount, orderCap)) {
    return { kind: 'cap', cart, undone: true };
  }

  const placed = await placeBook(currentCartId(), book.variantId, startedAt);
  if (placed === 'stale' || isStale()) return { kind: 'stale' };
  if (placed === 'rented-out') return { kind: 'rented-out', cart };

  const line = cartLineFor(placed.cart, book.variantId);
  if (line === undefined) return { kind: 'rented-out', cart: placed.cart };
  if (line.rentedOut) {
    const after = await takeBack(placed.cartId, line.lineId);
    return isStale() ? { kind: 'stale' } : { kind: 'rented-out', cart: after ?? placed.cart };
  }
  if (isAtOrOverCap(placed.cart.countedSubtotal, orderCap)) {
    const after = await takeBack(placed.cartId, line.lineId);
    if (isStale()) return { kind: 'stale' };
    return after === null
      ? { kind: 'cap', cart: placed.cart, undone: false }
      : { kind: 'cap', cart: after, undone: true };
  }
  return { kind: 'added', cart: placed.cart };
}

/**
 * Removes one book's line. A cart Shopify no longer has counts as empty; a line already gone
 * counts as removed.
 */
export async function removeBookFromCart(lineId: string): Promise<RemoveOutcome> {
  await loadCartId();
  const startedAt = cartGeneration();
  const cartId = currentCartId();
  if (cartId === null) return { kind: 'removed', cart: EMPTY_CART };

  let cart: Cart;
  try {
    cart = await removeCartLine(cartId, lineId, getStoreConfig());
  } catch (error) {
    if (!isUserErrors(error)) throw error;
    const again = await readCart(cartId, getStoreConfig());
    if (again === null) {
      await forgetGoneCart(cartId);
      cart = EMPTY_CART;
    } else if (again.books.some((book) => book.lineId === lineId)) {
      throw error;
    } else {
      cart = again;
    }
  }
  return cartGeneration() === startedAt ? { kind: 'removed', cart } : { kind: 'stale' };
}
