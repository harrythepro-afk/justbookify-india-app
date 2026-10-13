import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { clearAllCaches } from '@/query/queryClient';
import { forgetCart, getCartIdState, resetCartIdForTests } from '@/shopify/cartId';
import { StorefrontError } from '@/shopify/errors';
import {
  resetCartChangesForTests,
  useAddToCart,
  useCart,
  useCartButtonState,
  useCartCount,
  useCartSummary,
  useRemoveFromCart,
  type BookToAdd,
} from '@/shopify/hooks/cart';
import { storefrontKeys } from '@/shopify/queryKeys';

import { CART_ID, cartFields, cartLine, NEW_CART_ID, type CartLineNode } from '../../helpers/cart';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../../helpers/queryClient';

jest.mock('@/config', () => ({
  ...jest.requireActual('@/config'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN', orderCap: 500 }),
}));

const mockStore = new Map<string, string>();
jest.mock('@/shopify/cartStorage', () => ({
  readStoredCartId: () => Promise.resolve(mockStore.get('cart_id') ?? null),
  writeStoredCartId: (id: string) => {
    mockStore.set('cart_id', id);
    return Promise.resolve();
  },
  deleteStoredCartId: () => {
    mockStore.delete('cart_id');
    return Promise.resolve();
  },
}));

const mockReportStorefront = jest.fn();
const mockReportUnexpected = jest.fn();
jest.mock('@/crashReporting/sentry', () => ({
  reportCartProblem: jest.fn(),
  reportStorefrontProblem: (...args: unknown[]) => mockReportStorefront(...args),
  reportUnexpectedDataError: (...args: unknown[]) => mockReportUnexpected(...args),
}));

// The Cart tab reads Shopify again whenever it regains focus.
const mockFocusCallbacks: (() => void)[] = [];
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      mockFocusCallbacks.push(callback);
      callback();
    }, [callback]);
  },
}));

type Pending = { readonly operation: string; readonly release: () => void };
const operations: string[] = [];
const held: Pending[] = [];
let mockLines: CartLineNode[] = [];
let mockCartExists = true;
let mockHold = false;
let mockFail: Error | undefined;
let mockNewLine: (variantId: string) => CartLineNode = () => cartLine();

function mockOperationName(document: string): string {
  return /(?:query|mutation)\s+(\w+)/.exec(document)?.[1] ?? '';
}

function mockShopify(document: string, options?: { variables?: Record<string, unknown> }) {
  const operation = mockOperationName(document);
  operations.push(operation);
  const variables = options?.variables ?? {};
  const run = () => {
    if (mockFail !== undefined) throw mockFail;
    switch (operation) {
      case 'CartRead':
        return { cart: mockCartExists ? cartFields(mockLines) : null };
      case 'CartCreate': {
        const lines = variables.lines as { merchandiseId: string }[];
        mockCartExists = true;
        mockLines = [mockNewLine(lines[0]!.merchandiseId)];
        return {
          cartCreate: { cart: { ...cartFields(mockLines), id: NEW_CART_ID }, userErrors: [] },
        };
      }
      case 'CartLinesAdd': {
        const lines = variables.lines as { merchandiseId: string }[];
        mockLines = [...mockLines, mockNewLine(lines[0]!.merchandiseId)];
        return { cartLinesAdd: { cart: cartFields(mockLines), userErrors: [] } };
      }
      case 'CartLinesRemove': {
        const ids = variables.lineIds as string[];
        mockLines = mockLines.filter((line) => !ids.includes(line.id));
        return { cartLinesRemove: { cart: cartFields(mockLines), userErrors: [] } };
      }
      default:
        throw new Error(operation);
    }
  };
  if (!mockHold) {
    try {
      return Promise.resolve(run());
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error('mock'));
    }
  }
  return new Promise((resolve, reject) => {
    held.push({
      operation,
      release: () => {
        try {
          resolve(run());
        } catch (error) {
          reject(error instanceof Error ? error : new Error('mock'));
        }
      },
    });
  });
}

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
  storefrontMutation: (document: string, options?: { variables?: Record<string, unknown> }) =>
    mockShopify(document, options),
}));

/** A book as a card holds it, and the line Shopify makes when it is added. */
function book(price = 49, overrides: Parameters<typeof cartLine>[0] = {}) {
  const line = cartLine({ price: price.toFixed(1), ...overrides });
  const toAdd: BookToAdd = {
    id: line.merchandise.product.id,
    variantId: line.merchandise.id,
    priceAmount: price,
  };
  return { toAdd, line };
}

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockStore.clear();
  operations.length = 0;
  held.length = 0;
  mockFocusCallbacks.length = 0;
  mockLines = [];
  mockCartExists = true;
  mockHold = false;
  mockFail = undefined;
  mockNewLine = () => cartLine();
  mockReportStorefront.mockReset();
  mockReportUnexpected.mockReset();
  resetCartIdForTests();
  resetCartChangesForTests();
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

async function renderCartHooks(variantId = '') {
  return renderHook(
    () => ({
      add: useAddToCart(),
      remove: useRemoveFromCart(),
      summary: useCartSummary(),
      count: useCartCount(),
      button: useCartButtonState(variantId),
    }),
    { wrapper: withQueryClient(client) },
  );
}

describe('reading the cart', () => {
  it('is empty with no stored cart, without asking Shopify', async () => {
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());
    expect(result.current.summary?.books).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(operations).toEqual([]);
  });

  it('reads the stored cart after a cold start (answer 4)', async () => {
    mockStore.set('cart_id', CART_ID);
    mockLines = [cartLine(), cartLine()];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(2));
    expect(operations).toEqual(['CartRead']);
  });

  it('replaces an expired cart quietly with an empty one and forgets its ID', async () => {
    mockStore.set('cart_id', CART_ID);
    mockCartExists = false;
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());
    expect(result.current.summary?.books).toEqual([]);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
    expect(mockReportStorefront).not.toHaveBeenCalled();
    expect(mockReportUnexpected).not.toHaveBeenCalled();
  });

  it('counts every book, a rented-out one included (plan review, answer (b))', async () => {
    mockStore.set('cart_id', CART_ID);
    mockLines = [cartLine(), cartLine({ availableForSale: false })];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(2));
  });

  it('reads Shopify again on the Cart tab every time it regains focus', async () => {
    mockStore.set('cart_id', CART_ID);
    mockLines = [cartLine()];
    const { result } = await renderHook(() => useCart(), { wrapper: withQueryClient(client) });
    await waitFor(() => expect(result.current.data?.books).toHaveLength(1));
    const reads = operations.length;

    mockLines = [];
    await act(async () => mockFocusCallbacks.at(-1)?.());

    await waitFor(() => expect(result.current.data?.books).toHaveLength(0));
    expect(operations.length).toBe(reads + 1);
  });
});

describe('adding', () => {
  it('turns the button to "Adding…" and then "In cart", and the count up (answer 6)', async () => {
    const { toAdd, line } = book();
    mockNewLine = () => line;
    mockHold = true;
    const { result } = await renderCartHooks(toAdd.variantId);
    await waitFor(() => expect(result.current.summary).toBeDefined());
    expect(result.current.button).toBe('add');

    let adding: Promise<unknown> = Promise.resolve();
    await act(async () => {
      adding = result.current.add(toAdd);
    });
    expect(result.current.button).toBe('adding');

    await act(async () => {
      held.forEach((call) => call.release());
      await adding;
    });
    expect(result.current.button).toBe('in-cart');
    expect(result.current.count).toBe(1);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
  });

  it('never adds twice on a double tap', async () => {
    const { toAdd, line } = book();
    mockNewLine = () => line;
    mockHold = true;
    const { result } = await renderCartHooks(toAdd.variantId);
    await waitFor(() => expect(result.current.summary).toBeDefined());

    let first: Promise<unknown> = Promise.resolve();
    let second: Promise<unknown> = Promise.resolve();
    await act(async () => {
      first = result.current.add(toAdd);
      second = result.current.add(toAdd);
    });
    await expect(second).resolves.toEqual({ kind: 'busy' });

    await act(async () => {
      held.forEach((call) => call.release());
      await first;
    });
    expect(operations).toEqual(['CartCreate']);
    expect(mockLines).toHaveLength(1);
  });

  it('never creates two carts when two books are tapped quickly', async () => {
    const a = book(49);
    const b = book(74);
    mockHold = true;
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());

    let first: Promise<unknown> = Promise.resolve();
    let second: Promise<unknown> = Promise.resolve();
    await act(async () => {
      first = result.current.add(a.toAdd);
      second = result.current.add(b.toAdd);
    });
    await expect(second).resolves.toEqual({ kind: 'busy' });
    await act(async () => {
      held.forEach((call) => call.release());
      await first;
    });
    expect(operations.filter((name) => name === 'CartCreate')).toHaveLength(1);
  });

  it('ignores "Remove" while an add runs', async () => {
    mockStore.set('cart_id', CART_ID);
    const kept = cartLine();
    mockLines = [kept];
    const { toAdd, line } = book();
    mockNewLine = () => line;
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(1));
    mockHold = true;

    let adding: Promise<unknown> = Promise.resolve();
    let removing: Promise<unknown> = Promise.resolve();
    await act(async () => {
      adding = result.current.add(toAdd);
      removing = result.current.remove(kept.id);
    });
    await expect(removing).resolves.toEqual({ kind: 'busy' });
    await act(async () => {
      held.forEach((call) => call.release());
      await adding;
    });
    expect(operations).toEqual(['CartRead', 'CartLinesAdd']);
  });

  it('allows the next change once one has finished', async () => {
    const a = book(49);
    const b = book(74);
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());
    mockNewLine = () => a.line;
    await act(async () => {
      await result.current.add(a.toAdd);
    });
    mockNewLine = () => b.line;
    await act(async () => {
      await expect(result.current.add(b.toAdd)).resolves.toMatchObject({ kind: 'added' });
    });
    expect(result.current.count).toBe(2);
  });

  it('says it failed offline, sends one request and queues nothing (D-065)', async () => {
    mockFail = new StorefrontError('no-network', { operationName: 'CartCreate' });
    const { toAdd } = book();
    const { result } = await renderCartHooks(toAdd.variantId);
    await waitFor(() => expect(result.current.summary).toBeDefined());

    await act(async () => {
      await expect(result.current.add(toAdd)).resolves.toEqual({ kind: 'failed', offline: true });
    });
    expect(operations).toEqual(['CartCreate']);
    expect(result.current.button).toBe('add');
    // No network is never reported (D-057).
    expect(mockReportStorefront).not.toHaveBeenCalled();
    expect(
      client
        .getMutationCache()
        .getAll()
        .every((m) => m.state.status !== 'pending'),
    ).toBe(true);
  });

  it('says it failed for any other error, reported by code only', async () => {
    mockFail = new StorefrontError('graphql-error', { operationName: 'CartCreate' });
    const { toAdd } = book();
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());

    await act(async () => {
      await expect(result.current.add(toAdd)).resolves.toEqual({
        kind: 'failed',
        offline: false,
      });
    });
    expect(mockReportStorefront).toHaveBeenCalledWith('storefront/graphql-error', 'CartCreate');
  });

  it('marks the catalogue stale when a book turns out to be rented out', async () => {
    mockFail = new StorefrontError('user-errors', {
      operationName: 'CartCreate',
      codes: ['MERCHANDISE_NOT_APPLICABLE'],
    });
    client.setQueryData([...storefrontKeys.all, 'catalogue', 'book', 'x'], { title: 'x' });
    const { toAdd } = book();
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.summary).toBeDefined());

    await act(async () => {
      await expect(result.current.add(toAdd)).resolves.toMatchObject({ kind: 'rented-out' });
    });
    expect(
      client.getQueryState([...storefrontKeys.all, 'catalogue', 'book', 'x'])?.isInvalidated,
    ).toBe(true);
    // A refusal the flow handles is not reported.
    expect(mockReportStorefront).not.toHaveBeenCalled();
  });
});

describe('removing', () => {
  it('removes the line and the count goes down', async () => {
    mockStore.set('cart_id', CART_ID);
    const lines = [cartLine(), cartLine()];
    mockLines = [...lines];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(2));

    await act(async () => {
      await expect(result.current.remove(lines[0]!.id)).resolves.toMatchObject({
        kind: 'removed',
      });
    });
    expect(result.current.count).toBe(1);
  });

  it('never removes twice on a double tap', async () => {
    mockStore.set('cart_id', CART_ID);
    const lines = [cartLine()];
    mockLines = [...lines];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(1));
    mockHold = true;

    let first: Promise<unknown> = Promise.resolve();
    let second: Promise<unknown> = Promise.resolve();
    await act(async () => {
      first = result.current.remove(lines[0]!.id);
      second = result.current.remove(lines[0]!.id);
    });
    await expect(second).resolves.toEqual({ kind: 'busy' });
    await act(async () => {
      held.forEach((call) => call.release());
      await first;
    });
    expect(operations.filter((name) => name === 'CartLinesRemove')).toHaveLength(1);
  });
});

describe('logout (answer 4)', () => {
  it('forgets the cart: the count goes to 0 and Shopify is not asked for the old cart', async () => {
    mockStore.set('cart_id', CART_ID);
    mockLines = [cartLine(), cartLine()];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(2));
    const reads = operations.length;

    // What "Log out" does (src/customerAccount/session.ts): forget the cart, then empty the cache.
    await act(async () => {
      await forgetCart();
      await clearAllCaches(client);
    });

    await waitFor(() => expect(result.current.summary?.books).toEqual([]));
    expect(result.current.count).toBe(0);
    expect(mockStore.has('cart_id')).toBe(false);
    expect(operations.length).toBe(reads);
  });

  it('shows nothing from an add still in flight at logout, and saves no cart', async () => {
    const { toAdd, line } = book();
    mockNewLine = () => line;
    mockHold = true;
    const { result } = await renderCartHooks(toAdd.variantId);
    await waitFor(() => expect(result.current.summary).toBeDefined());

    let adding: Promise<unknown> = Promise.resolve();
    await act(async () => {
      adding = result.current.add(toAdd);
    });
    await act(async () => {
      await forgetCart();
      await clearAllCaches(client);
    });
    await act(async () => {
      held.forEach((call) => call.release());
      await expect(adding).resolves.toEqual({ kind: 'stale' });
    });

    expect(result.current.button).toBe('add');
    expect(result.current.count).toBe(0);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
  });
});

describe('privacy', () => {
  it('never puts the cart ID in a cache key, a report or an error', async () => {
    mockStore.set('cart_id', CART_ID);
    mockLines = [cartLine()];
    const { result } = await renderCartHooks();
    await waitFor(() => expect(result.current.count).toBe(1));
    mockFail = new StorefrontError('graphql-error', { operationName: 'CartLinesAdd' });
    await act(async () => {
      await result.current.add(book().toAdd);
    });

    const keys = JSON.stringify([
      ...client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
      ...client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.options.mutationKey),
    ]);
    expect(keys).not.toMatch(/test-cart|test-key/);
    const reports = JSON.stringify([
      mockReportStorefront.mock.calls,
      mockReportUnexpected.mock.calls,
    ]);
    expect(reports).not.toMatch(/test-cart|test-key/);
    expect(NEW_CART_ID).not.toBe(CART_ID);
  });
});
