import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import DevCheckoutScreen from '@/app/dev-checkout';
import type { StoreConfigStatus } from '@/config/store';
import { DevCheckoutError } from '@/shopify/devCheckout';

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';
const mockCreateDevCheckoutUrl = jest.fn<Promise<string>, []>();
const mockPresent = jest.fn();
const mockRemove = jest.fn();
const mockListeners = new Map<string, (event?: unknown) => void>();

jest.mock('@shopify/checkout-sheet-kit', () => {
  const checkout = {
    present: (url: string) => mockPresent(url),
    addEventListener: (name: string, callback: (event?: unknown) => void) => {
      mockListeners.set(name, callback);
      return { remove: mockRemove };
    },
  };
  return {
    ShopifyCheckoutSheetProvider: ({ children }: { children: ReactNode }) => children,
    useShopifyCheckoutSheet: () => checkout,
  };
});

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Redirect: ({ href }: { href: string }) => <Text>Redirect to {href}</Text> };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfigStatus: () => mockStoreStatus,
}));

jest.mock('@/shopify/devCheckout', () => ({
  ...jest.requireActual('@/shopify/devCheckout'),
  createDevCheckoutUrl: () => mockCreateDevCheckoutUrl(),
}));

const CHECKOUT_URL = 'https://example-dev-store.myshopify.com/cart/c/test-cart';

// Testing Library 14's act and fireEvent are asynchronous and must be awaited.
async function emit(name: string, event?: unknown) {
  const listener = mockListeners.get(name);
  if (listener === undefined) throw new Error(`No listener for ${name}`);
  await act(async () => listener(event));
}

async function pressOpen() {
  await fireEvent.press(screen.getByRole('button', { name: 'Open test checkout' }));
}

describe('DevCheckoutScreen', () => {
  beforeEach(() => {
    mockAppEnv = 'development';
    mockStoreStatus = 'configured';
    mockCreateDevCheckoutUrl.mockReset();
    mockPresent.mockReset();
    mockRemove.mockReset();
    mockListeners.clear();
  });

  it.each(['staging', 'production'])('sends a %s build back to the start screen', async (env) => {
    mockAppEnv = env;

    await render(<DevCheckoutScreen />);

    expect(screen.getByText('Redirect to /')).toBeOnTheScreen();
    expect(screen.queryByText('Test checkout')).not.toBeOnTheScreen();
    expect(mockListeners.size).toBe(0);
  });

  it('creates a cart and presents its checkout URL without showing it', async () => {
    mockCreateDevCheckoutUrl.mockResolvedValueOnce(CHECKOUT_URL);
    await render(<DevCheckoutScreen />);

    await pressOpen();

    expect(mockPresent).toHaveBeenCalledWith(CHECKOUT_URL);
    expect(screen.getByText('Checkout is open.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('shows the completed result and keeps it when checkout then closes', async () => {
    mockCreateDevCheckoutUrl.mockResolvedValueOnce(CHECKOUT_URL);
    await render(<DevCheckoutScreen />);
    await pressOpen();

    await emit('completed', { orderDetails: { id: 'gid://shopify/OrderIdentity/1' } });
    expect(screen.getByText('Checkout completed: the order was placed.')).toBeOnTheScreen();

    await emit('close');
    expect(screen.getByText('Checkout completed: the order was placed.')).toBeOnTheScreen();
  });

  it('says when checkout closes without an order', async () => {
    mockCreateDevCheckoutUrl.mockResolvedValueOnce(CHECKOUT_URL);
    await render(<DevCheckoutScreen />);
    await pressOpen();

    await emit('close');

    expect(screen.getByText('Checkout closed without an order.')).toBeOnTheScreen();
  });

  it('shows only the code of a checkout error', async () => {
    await render(<DevCheckoutScreen />);

    await emit('error', { code: 'storefront_password_required', message: CHECKOUT_URL });

    expect(screen.getByText('Checkout error: storefront_password_required.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('shows a cart error and does not present checkout', async () => {
    mockCreateDevCheckoutUrl.mockRejectedValueOnce(new DevCheckoutError('no-available-variant'));
    await render(<DevCheckoutScreen />);

    await pressOpen();

    expect(mockPresent).not.toHaveBeenCalled();
    expect(
      screen.getByText('No product variant on the store is available for sale.'),
    ).toBeOnTheScreen();
  });

  it('hides the text of an unexpected error', async () => {
    mockCreateDevCheckoutUrl.mockRejectedValueOnce(new Error(`failed at ${CHECKOUT_URL}`));
    await render(<DevCheckoutScreen />);

    await pressOpen();

    expect(screen.getByText('Unexpected error opening checkout.')).toBeOnTheScreen();
    expect(screen.queryByText(/myshopify/)).not.toBeOnTheScreen();
  });

  it('offers no button when the store is not configured', async () => {
    mockStoreStatus = 'not configured';

    await render(<DevCheckoutScreen />);

    expect(screen.queryByRole('button', { name: 'Open test checkout' })).not.toBeOnTheScreen();
    expect(screen.getByText('Store configuration: not configured')).toBeOnTheScreen();
  });

  it('removes its checkout listeners when it unmounts', async () => {
    const { unmount } = await render(<DevCheckoutScreen />);

    await act(async () => unmount());

    expect(mockRemove).toHaveBeenCalledTimes(3);
  });
});
