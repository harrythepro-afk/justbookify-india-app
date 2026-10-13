import type { Cart } from '@/shopify/cart';
import { addBookToCart, removeBookFromCart, type BookToAdd } from '@/shopify/cartChanges';
import {
  cartGeneration,
  forgetCart,
  getCartIdState,
  loadCartId,
  rememberCartId,
  resetCartIdForTests,
} from '@/shopify/cartId';
import { StorefrontError } from '@/shopify/errors';

import {
  CART_CONFIG,
  CART_ID,
  cartFields,
  cartLine,
  linesPriced,
  NEW_CART_ID,
  type CartLineNode,
} from '../helpers/cart';

// The store configuration: India, ₹500 cap (R2).
jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN', orderCap: 500 }),
}));

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItemAsync: (key: string) => Promise.resolve(mockStore.get(key) ?? null),
  setItemAsync: (key: string, value: string) => {
    mockStore.set(key, value);
    return Promise.resolve();
  },
  deleteItemAsync: (key: string) => {
    mockStore.delete(key);
    return Promise.resolve();
  },
}));

const mockReportStorefront = jest.fn();
jest.mock('@/crashReporting/sentry', () => ({
  reportCartProblem: jest.fn(),
  reportStorefrontProblem: (code: string, operation: string) =>
    mockReportStorefront(code, operation),
}));

type Call = { readonly operation: string; readonly variables: Record<string, unknown> };
const calls: Call[] = [];
let mockAnswer: (call: Call) => unknown;

function operationName(document: string): string {
  return /(?:query|mutation)\s+(\w+)/.exec(document)?.[1] ?? '';
}

function mockShopifyCall(document: string, options?: { variables?: Record<string, unknown> }) {
  const call = { operation: operationName(document), variables: options?.variables ?? {} };
  calls.push(call);
  try {
    const result = mockAnswer(call);
    return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error('mock'));
  }
}

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopifyCall(document, options),
  storefrontMutation: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopifyCall(document, options),
}));

function userErrors(operation: string, code: string): StorefrontError {
  return new StorefrontError('user-errors', { operationName: operation, codes: [code] });
}

const NO_NETWORK = () => new StorefrontError('no-network', { operationName: 'CartLinesAdd' });

/** A Shopify cart that answers each operation like the real one would. */
class FakeShopify {
  lines: CartLineNode[];
  exists = true;
  newLine: (variantId: string) => CartLineNode;
  subtotalOverride: number | undefined;

  constructor(lines: CartLineNode[], newLine: (variantId: string) => CartLineNode) {
    this.lines = lines;
    this.newLine = newLine;
  }

  fields() {
    return cartFields(this.lines, this.subtotalOverride);
  }

  handle(call: Call): unknown {
    switch (call.operation) {
      case 'CartRead':
        return { cart: this.exists ? this.fields() : null };
      case 'CartCreate':
        this.exists = true;
        this.lines = [this.newLine(variantOf(call))];
        return { cartCreate: { cart: { ...this.fields(), id: NEW_CART_ID }, userErrors: [] } };
      case 'CartLinesAdd':
        if (!this.exists) throw userErrors('CartLinesAdd', 'INVALID');
        this.lines = [...this.lines, this.newLine(variantOf(call))];
        return { cartLinesAdd: { cart: this.fields(), userErrors: [] } };
      case 'CartLinesRemove': {
        if (!this.exists) throw userErrors('CartLinesRemove', 'INVALID');
        const ids = call.variables.lineIds as string[];
        this.lines = this.lines.filter((line) => !ids.includes(line.id));
        return { cartLinesRemove: { cart: this.fields(), userErrors: [] } };
      }
      default:
        throw new Error(`unexpected ${call.operation}`);
    }
  }
}

function variantOf(call: Call): string {
  const lines = call.variables.lines as { merchandiseId: string }[];
  return lines[0]?.merchandiseId ?? '';
}

/** A book to add, priced as the card shows it, and the line Shopify makes for it. */
function bookAt(price: number, overrides: Parameters<typeof cartLine>[0] = {}) {
  const line = cartLine({ price: price.toFixed(1), ...overrides });
  const book: BookToAdd = {
    id: line.merchandise.product.id,
    variantId: line.merchandise.id,
    priceAmount: price,
  };
  return { book, line };
}

async function startWith(cartId: string | null): Promise<void> {
  if (cartId !== null) mockStore.set('cart_id', cartId);
  await loadCartId();
}

function cartFrom(shopify: FakeShopify): Cart {
  // The cart the screen holds, as the cache has it.
  return jest
    .requireActual<typeof import('@/shopify/cart')>('@/shopify/cart')
    .toCart(shopify.fields(), CART_CONFIG);
}

beforeEach(() => {
  mockStore.clear();
  calls.length = 0;
  mockReportStorefront.mockReset();
  resetCartIdForTests();
});

describe('adding a book', () => {
  it('creates a cart with the book when there is none, and keeps its ID', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify([], () => line);
    shopify.exists = false;
    mockAnswer = (call) => shopify.handle(call);
    await startWith(null);

    const outcome = await addBookToCart(book, undefined);

    expect(outcome.kind).toBe('added');
    expect(calls.map((call) => call.operation)).toEqual(['CartCreate']);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
    expect(mockStore.get('cart_id')).toBe(NEW_CART_ID);
  });

  it('adds the book to the stored cart', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));

    expect(outcome).toMatchObject({ kind: 'added' });
    if (outcome.kind === 'added') expect(outcome.cart.books).toHaveLength(2);
    expect(calls).toEqual([
      {
        operation: 'CartLinesAdd',
        variables: { cartId: CART_ID, lines: [{ merchandiseId: book.variantId, quantity: 1 }] },
      },
    ]);
  });

  it('reads the cart first when the screen has not read it yet', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    await addBookToCart(book, undefined);
    expect(calls.map((call) => call.operation)).toEqual(['CartRead', 'CartLinesAdd']);
  });

  it('adds one copy per book: a book in the cart is not added again (answer 1)', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify([line], () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));
    expect(outcome.kind).toBe('in-cart');
    expect(calls).toEqual([]);
  });
});

describe('the order cap (R2, answer 2)', () => {
  it('allows a book that brings the subtotal to ₹499', async () => {
    const { book, line } = bookAt(49);
    // ₹450: 99 × 4 + 54.
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 54]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));
    expect(outcome.kind).toBe('added');
    if (outcome.kind === 'added') expect(outcome.cart.countedSubtotal).toBe(499);
  });

  it('refuses a book that would bring the subtotal to exactly ₹500, before asking Shopify', async () => {
    const { book, line } = bookAt(49);
    // ₹451.
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 55]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));
    expect(outcome).toMatchObject({ kind: 'cap', undone: true });
    if (outcome.kind === 'cap') expect(outcome.cart.countedSubtotal).toBe(451);
    expect(calls).toEqual([]);
  });

  it('refuses any book once five ₹99 books are in the cart (the phone check)', async () => {
    const { book, line } = bookAt(34);
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 99]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    await expect(addBookToCart(book, cartFrom(shopify))).resolves.toMatchObject({ kind: 'cap' });
  });

  it("undoes an add when Shopify's subtotal reaches the cap (plan review, answer (a))", async () => {
    // The card said ₹49, but Shopify now charges ₹50: ₹450 + ₹50 = ₹500.
    const { book } = bookAt(49);
    const charged = cartLine({ price: '50.0' });
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 54]), () => ({
      ...charged,
      merchandise: { ...charged.merchandise, id: book.variantId },
    }));
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));

    expect(outcome).toMatchObject({ kind: 'cap', undone: true });
    if (outcome.kind === 'cap') expect(outcome.cart.countedSubtotal).toBe(450);
    expect(calls.map((call) => call.operation)).toEqual(['CartLinesAdd', 'CartLinesRemove']);
    expect(shopify.lines).toHaveLength(5);
  });

  it("uses Shopify's subtotal over the app's sum after the add", async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) => {
      // Shopify reports ₹500 for the two books, whatever their line amounts say.
      if (call.operation === 'CartLinesAdd') shopify.subtotalOverride = 500;
      if (call.operation === 'CartLinesRemove') shopify.subtotalOverride = undefined;
      return shopify.handle(call);
    };
    await startWith(CART_ID);

    await expect(addBookToCart(book, cartFrom(shopify))).resolves.toMatchObject({
      kind: 'cap',
      undone: true,
    });
  });

  it('says the cart is over the cap when the undo fails (message 5 on the Cart tab)', async () => {
    const { book } = bookAt(49);
    const charged = cartLine({ price: '50.0' });
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 54]), () => ({
      ...charged,
      merchandise: { ...charged.merchandise, id: book.variantId },
    }));
    mockAnswer = (call) =>
      call.operation === 'CartLinesRemove' ? NO_NETWORK() : shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));
    expect(outcome).toMatchObject({ kind: 'cap', undone: false });
    if (outcome.kind === 'cap') expect(outcome.cart.countedSubtotal).toBe(500);
  });

  it('reports a failed undo by code only, when D-057 says so', async () => {
    const { book } = bookAt(49);
    const charged = cartLine({ price: '50.0' });
    const shopify = new FakeShopify(linesPriced([99, 99, 99, 99, 54]), () => ({
      ...charged,
      merchandise: { ...charged.merchandise, id: book.variantId },
    }));
    mockAnswer = (call) =>
      call.operation === 'CartLinesRemove'
        ? new StorefrontError('graphql-error', { operationName: 'CartLinesRemove' })
        : shopify.handle(call);
    await startWith(CART_ID);

    await addBookToCart(book, cartFrom(shopify));
    expect(mockReportStorefront).toHaveBeenCalledWith(
      'storefront/graphql-error',
      'CartLinesRemove',
    );
  });

  it('counts only the books that can be ordered against the cap (answer 5)', async () => {
    const { book, line } = bookAt(99);
    // ₹396 counted, plus a ₹99 rented-out book that is not counted.
    const shopify = new FakeShopify(
      [...linesPriced([99, 99, 99, 99]), cartLine({ price: '99.0', availableForSale: false })],
      () => line,
    );
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    await expect(addBookToCart(book, cartFrom(shopify))).resolves.toMatchObject({
      kind: 'added',
    });
  });
});

describe('a cart Shopify no longer has', () => {
  it('is replaced quietly with a new cart holding the book', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    shopify.exists = false;
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, undefined);

    expect(outcome.kind).toBe('added');
    if (outcome.kind === 'added') expect(outcome.cart.books).toHaveLength(1);
    expect(calls.map((call) => call.operation)).toEqual(['CartRead', 'CartCreate']);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
  });

  it('is replaced when the add is refused because the cart has gone', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);
    const onScreen = cartFrom(shopify);
    shopify.exists = false;

    const outcome = await addBookToCart(book, onScreen);

    expect(outcome.kind).toBe('added');
    expect(calls.map((call) => call.operation)).toEqual(['CartLinesAdd', 'CartRead', 'CartCreate']);
    expect(mockStore.get('cart_id')).toBe(NEW_CART_ID);
  });

  it('keeps the error when the add is refused and the cart still exists', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) =>
      call.operation === 'CartLinesAdd'
        ? userErrors('CartLinesAdd', 'INVALID')
        : shopify.handle(call);
    await startWith(CART_ID);

    await expect(addBookToCart(book, cartFrom(shopify))).rejects.toMatchObject({
      kind: 'user-errors',
    });
    expect(calls.map((call) => call.operation)).toEqual(['CartLinesAdd', 'CartRead']);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: CART_ID });
  });
});

describe('a book rented out as it is added', () => {
  it("is refused when Shopify says the merchandise can't be added", async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify(linesPriced([99]), () => line);
    mockAnswer = (call) =>
      call.operation === 'CartLinesAdd'
        ? userErrors('CartLinesAdd', 'MERCHANDISE_NOT_APPLICABLE')
        : shopify.handle(call);
    await startWith(CART_ID);

    await expect(addBookToCart(book, cartFrom(shopify))).resolves.toMatchObject({
      kind: 'rented-out',
    });
  });

  it('is refused for a first cart too', async () => {
    const { book } = bookAt(49);
    mockAnswer = () => userErrors('CartCreate', 'MERCHANDISE_NOT_APPLICABLE');
    await startWith(null);

    await expect(addBookToCart(book, undefined)).resolves.toMatchObject({ kind: 'rented-out' });
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
  });

  it('has a line Shopify kept at zero removed again', async () => {
    const { book } = bookAt(49);
    const zero = cartLine({ price: '49.0', quantity: 0 });
    const shopify = new FakeShopify(linesPriced([99]), () => ({
      ...zero,
      merchandise: { ...zero.merchandise, id: book.variantId },
    }));
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await addBookToCart(book, cartFrom(shopify));
    expect(outcome.kind).toBe('rented-out');
    if (outcome.kind === 'rented-out') expect(outcome.cart.books).toHaveLength(1);
    expect(calls.map((call) => call.operation)).toEqual(['CartLinesAdd', 'CartLinesRemove']);
  });
});

describe('failures and logout', () => {
  it('fails at once offline, with one request and nothing queued (D-065)', async () => {
    const { book } = bookAt(49);
    mockAnswer = () => NO_NETWORK();
    await startWith(CART_ID);

    await expect(
      addBookToCart(book, cartFrom(new FakeShopify([], () => cartLine()))),
    ).rejects.toMatchObject({
      kind: 'no-network',
    });
    expect(calls).toHaveLength(1);
  });

  it('saves nothing when a logout comes during the add (answer 4)', async () => {
    const { book, line } = bookAt(49);
    const shopify = new FakeShopify([], () => line);
    shopify.exists = false;
    let release: () => void = () => undefined;
    mockAnswer = (call) =>
      new Promise((resolve) => {
        release = () => resolve(shopify.handle(call));
      });
    await startWith(null);

    const adding = addBookToCart(book, undefined);
    await Promise.resolve();
    await forgetCart();
    release();

    await expect(adding).resolves.toEqual({ kind: 'stale' });
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
  });
});

describe('removing a book', () => {
  it('removes its line', async () => {
    const lines = linesPriced([99, 49]);
    const shopify = new FakeShopify(lines, () => cartLine());
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await removeBookFromCart(lines[0]!.id);
    expect(outcome).toMatchObject({ kind: 'removed' });
    if (outcome.kind === 'removed') expect(outcome.cart.books).toHaveLength(1);
    expect(calls).toEqual([
      { operation: 'CartLinesRemove', variables: { cartId: CART_ID, lineIds: [lines[0]!.id] } },
    ]);
  });

  it('counts a cart Shopify no longer has as empty, and forgets it', async () => {
    const lines = linesPriced([99]);
    const shopify = new FakeShopify(lines, () => cartLine());
    shopify.exists = false;
    mockAnswer = (call) => shopify.handle(call);
    await startWith(CART_ID);

    const outcome = await removeBookFromCart(lines[0]!.id);
    expect(outcome).toMatchObject({ kind: 'removed', cart: { books: [] } });
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
  });

  it('counts a line already gone as removed', async () => {
    const lines = linesPriced([99, 49]);
    const shopify = new FakeShopify([lines[1]!], () => cartLine());
    mockAnswer = (call) =>
      call.operation === 'CartLinesRemove'
        ? userErrors('CartLinesRemove', 'INVALID')
        : shopify.handle(call);
    await startWith(CART_ID);

    await expect(removeBookFromCart(lines[0]!.id)).resolves.toMatchObject({ kind: 'removed' });
  });

  it('keeps the error when the line is still there', async () => {
    const lines = linesPriced([99]);
    const shopify = new FakeShopify(lines, () => cartLine());
    mockAnswer = (call) =>
      call.operation === 'CartLinesRemove'
        ? userErrors('CartLinesRemove', 'INVALID')
        : shopify.handle(call);
    await startWith(CART_ID);

    await expect(removeBookFromCart(lines[0]!.id)).rejects.toMatchObject({ kind: 'user-errors' });
  });

  it('has nothing to remove without a cart', async () => {
    mockAnswer = () => new Error('no call expected');
    await startWith(null);
    await expect(removeBookFromCart('line')).resolves.toMatchObject({
      kind: 'removed',
      cart: { books: [] },
    });
    expect(calls).toEqual([]);
  });

  it('is stale when a logout comes during the removal', async () => {
    const lines = linesPriced([99]);
    const shopify = new FakeShopify(lines, () => cartLine());
    let release: () => void = () => undefined;
    mockAnswer = (call) =>
      new Promise((resolve) => {
        release = () => resolve(shopify.handle(call));
      });
    await startWith(CART_ID);

    const removing = removeBookFromCart(lines[0]!.id);
    await Promise.resolve();
    await forgetCart();
    release();
    await expect(removing).resolves.toEqual({ kind: 'stale' });
  });
});

it('is not confused by a newer cart saved meanwhile', async () => {
  await startWith(null);
  await rememberCartId(CART_ID, cartGeneration());
  expect(getCartIdState()).toEqual({ status: 'ready', cartId: CART_ID });
});
