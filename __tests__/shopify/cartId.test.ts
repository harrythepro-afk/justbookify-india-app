import {
  cartGeneration,
  forgetCart,
  forgetGoneCart,
  getCartIdState,
  loadCartId,
  rememberCartId,
  resetCartIdForTests,
  subscribeCartId,
} from '@/shopify/cartId';
import { isCartId } from '@/shopify/cartStorage';

import { CART_ID, NEW_CART_ID } from '../helpers/cart';

const mockStore = new Map<string, string>();
const mockFail = { read: false, write: false, delete: false };
jest.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'after-first-unlock-this-device-only',
  getItemAsync: jest.fn((key: string) =>
    mockFail.read ? Promise.reject(new Error('read')) : Promise.resolve(mockStore.get(key) ?? null),
  ),
  setItemAsync: jest.fn((key: string, value: string) => {
    if (mockFail.write) return Promise.reject(new Error('write'));
    mockStore.set(key, value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    if (mockFail.delete) return Promise.reject(new Error('delete'));
    mockStore.delete(key);
    return Promise.resolve();
  }),
}));

const mockReportCart = jest.fn();
jest.mock('@/crashReporting/sentry', () => ({
  reportCartProblem: (code: string) => mockReportCart(code),
}));

beforeEach(() => {
  mockStore.clear();
  Object.assign(mockFail, { read: false, write: false, delete: false });
  mockReportCart.mockReset();
  resetCartIdForTests();
});

describe('isCartId', () => {
  it("accepts Shopify's cart IDs in any token format", () => {
    expect(isCartId(CART_ID)).toBe(true);
    expect(isCartId('gid://shopify/Cart/abc')).toBe(true);
  });

  it('refuses anything else', () => {
    expect(isCartId('')).toBe(false);
    expect(isCartId('gid://shopify/Product/1')).toBe(false);
    expect(isCartId('gid://shopify/Cart/')).toBe(false);
    expect(isCartId('gid://shopify/Cart/a b')).toBe(false);
    expect(isCartId(`gid://shopify/Cart/${'a'.repeat(1_000)}`)).toBe(false);
  });
});

describe('the cart ID across launches (answer 4)', () => {
  it('is loading until the stored ID has been read', async () => {
    expect(getCartIdState()).toEqual({ status: 'loading' });
    await loadCartId();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
  });

  it('keeps the cart across launches under its own key', async () => {
    mockStore.set('cart_id', CART_ID);
    await loadCartId();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: CART_ID });
  });

  it('deletes a stored value that is not a cart ID', async () => {
    mockStore.set('cart_id', 'not-a-cart');
    await loadCartId();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
  });

  it('reads the store once per launch', async () => {
    mockStore.set('cart_id', CART_ID);
    await Promise.all([loadCartId(), loadCartId()]);
    mockStore.set('cart_id', NEW_CART_ID);
    await loadCartId();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: CART_ID });
  });

  it('starts with no cart when the store cannot be read, deleting nothing', async () => {
    mockStore.set('cart_id', CART_ID);
    mockFail.read = true;
    await loadCartId();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.get('cart_id')).toBe(CART_ID);
    expect(mockReportCart).toHaveBeenCalledWith('storage_read_failed');
  });

  it('tells subscribers about each change', async () => {
    const listener = jest.fn();
    subscribeCartId(listener);
    await loadCartId();
    await rememberCartId(CART_ID, cartGeneration());
    await forgetCart();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('remembering a new cart', () => {
  it('saves the ID in memory and in secure storage', async () => {
    await loadCartId();
    await expect(rememberCartId(NEW_CART_ID, cartGeneration())).resolves.toBe(true);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
    expect(mockStore.get('cart_id')).toBe(NEW_CART_ID);
  });

  it('keeps the ID for this launch when the write fails', async () => {
    await loadCartId();
    mockFail.write = true;
    await rememberCartId(NEW_CART_ID, cartGeneration());
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
    expect(mockReportCart).toHaveBeenCalledWith('storage_write_failed');
  });

  it('saves nothing when a logout came after the change started', async () => {
    await loadCartId();
    const startedAt = cartGeneration();
    await forgetCart();
    await expect(rememberCartId(NEW_CART_ID, startedAt)).resolves.toBe(false);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
  });
});

describe('forgetting', () => {
  it('forgets the cart at logout, in memory and in storage', async () => {
    mockStore.set('cart_id', CART_ID);
    await loadCartId();
    await forgetCart();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockStore.has('cart_id')).toBe(false);
  });

  it('wins over a read still in flight at launch', async () => {
    mockStore.set('cart_id', CART_ID);
    const loading = loadCartId();
    await forgetCart();
    await loading;
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
  });

  it('forgets in memory even when the stored value cannot be deleted', async () => {
    mockStore.set('cart_id', CART_ID);
    await loadCartId();
    mockFail.delete = true;
    await forgetCart();
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
    expect(mockReportCart).toHaveBeenCalledWith('storage_delete_failed');
  });

  it('forgets a cart Shopify no longer has, but keeps a newer one', async () => {
    mockStore.set('cart_id', CART_ID);
    await loadCartId();
    await rememberCartId(NEW_CART_ID, cartGeneration());
    await forgetGoneCart(CART_ID);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: NEW_CART_ID });
    await forgetGoneCart(NEW_CART_ID);
    expect(getCartIdState()).toEqual({ status: 'ready', cartId: null });
  });

  it('starts a new generation only at logout', async () => {
    mockStore.set('cart_id', CART_ID);
    await loadCartId();
    const before = cartGeneration();
    await forgetGoneCart(CART_ID);
    expect(cartGeneration()).toBe(before);
    await forgetCart();
    expect(cartGeneration()).toBe(before + 1);
  });

  it('never reports the cart ID', async () => {
    mockStore.set('cart_id', CART_ID);
    mockFail.read = true;
    await loadCartId();
    mockFail.write = true;
    await rememberCartId(NEW_CART_ID, cartGeneration());
    mockFail.delete = true;
    await forgetCart();
    expect(JSON.stringify(mockReportCart.mock.calls)).not.toMatch(/test-cart|test-key/);
  });
});
