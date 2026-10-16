import {
  completedOutcome,
  presentCheckoutSheet,
  resetCheckoutSheetForTests,
} from '@/checkout/sheet';

type Callback = (data?: unknown) => void;
const mockListeners = new Map<string, Set<Callback>>();
const mockPresent = jest.fn();
const mockGeolocation = jest.fn();
const mockConstructed: unknown[][] = [];

jest.mock('@shopify/checkout-sheet-kit', () => ({
  ColorScheme: { web: 'web_default' },
  ShopifyCheckoutSheet: class {
    constructor(...args: unknown[]) {
      mockConstructed.push(args);
    }
    addEventListener(name: string, callback: Callback) {
      const set = mockListeners.get(name) ?? new Set<Callback>();
      set.add(callback);
      mockListeners.set(name, set);
      return { remove: () => set.delete(callback) };
    }
    present(url: string) {
      mockPresent(url);
    }
    initiateGeolocationRequest(allow: boolean) {
      mockGeolocation(allow);
      return Promise.resolve();
    }
  },
}));

function emit(name: string, data?: unknown) {
  for (const callback of [...(mockListeners.get(name) ?? [])]) callback(data);
}

function listenerCount(name: string): number {
  return mockListeners.get(name)?.size ?? 0;
}

const URL = 'https://example-dev.myshopify.com/cart/c/test-cart-0001?key=test-key';

beforeEach(() => {
  mockListeners.clear();
  mockPresent.mockReset();
  mockGeolocation.mockClear();
  mockConstructed.length = 0;
  resetCheckoutSheetForTests();
});

describe('presentCheckoutSheet (D-151)', () => {
  it('makes one sheet with preloading off, the website colours and no location handling', async () => {
    await presentCheckoutSheet(URL, () => undefined);
    await presentCheckoutSheet(URL, () => undefined);

    expect(mockConstructed).toEqual([
      [{ preloading: false, colorScheme: 'web_default' }, { handleGeolocationRequests: false }],
    ]);
    expect(mockPresent.mock.calls).toEqual([[URL], [URL]]);
  });

  it('answers every location request with no', async () => {
    await presentCheckoutSheet(URL, () => undefined);
    emit('geolocationRequest', { origin: 'https://example-dev.myshopify.com' });
    expect(mockGeolocation.mock.calls).toEqual([[false]]);
  });

  it('ends once at completed; the close after it is not a second outcome; listeners go', async () => {
    const onEnd = jest.fn();
    await presentCheckoutSheet(URL, onEnd);

    emit('completed', {
      orderDetails: { id: 'gid://shopify/OrderIdentity/1004', paymentMethods: [{ type: 'COD' }] },
    });
    emit('close');

    expect(onEnd.mock.calls).toEqual([
      [
        {
          kind: 'completed',
          orderNumber: '1004',
          orderIdForm: 'OrderIdentity',
          paymentType: 'cash_on_delivery',
        },
      ],
    ]);
    expect(listenerCount('completed') + listenerCount('close') + listenerCount('error')).toBe(0);
  });

  it('ends with closed when the customer closes checkout without an order', async () => {
    const onEnd = jest.fn();
    await presentCheckoutSheet(URL, onEnd);
    emit('close');
    expect(onEnd.mock.calls).toEqual([[{ kind: 'closed' }]]);
    expect(listenerCount('close')).toBe(0);
  });

  it('leaves a recoverable error to Checkout Kit and ends at an unrecoverable one, by code', async () => {
    const onEnd = jest.fn();
    await presentCheckoutSheet(URL, onEnd);

    emit('error', { code: 'http_error', recoverable: true, message: 'parent@example.com' });
    expect(onEnd).not.toHaveBeenCalled();

    emit('error', { code: 'render_process_gone', recoverable: false, message: 'gone' });
    emit('error', { code: 'unknown', recoverable: false });
    expect(onEnd.mock.calls).toEqual([[{ kind: 'failed', code: 'render_process_gone' }]]);
    expect(listenerCount('error')).toBe(0);
  });

  it("never lets a throw reach Checkout Kit, which would log the event's raw data", async () => {
    await presentCheckoutSheet(URL, () => {
      throw new Error('the screen failed');
    });
    expect(() =>
      emit('completed', { orderDetails: { id: 'gid://shopify/Order/1' } }),
    ).not.toThrow();
  });

  it('removes its listeners when the sheet cannot be presented', async () => {
    mockPresent.mockImplementationOnce(() => {
      throw new Error('no native module');
    });
    await expect(presentCheckoutSheet(URL, () => undefined)).rejects.toThrow();
    expect(listenerCount('completed') + listenerCount('close') + listenerCount('error')).toBe(0);
  });
});

describe('completedOutcome', () => {
  it("reads only the order ID's number and form and the payment type, from any shape", () => {
    expect(completedOutcome(undefined)).toEqual({
      kind: 'completed',
      orderNumber: undefined,
      orderIdForm: 'other',
      paymentType: 'unknown',
    });
    expect(completedOutcome({ orderDetails: { id: 7, paymentMethods: 'card' } })).toMatchObject({
      orderNumber: undefined,
      paymentType: 'unknown',
    });
    const throwing = {
      get orderDetails(): never {
        throw new Error('bad payload');
      },
    };
    expect(completedOutcome(throwing)).toMatchObject({ kind: 'completed', paymentType: 'unknown' });
  });
});
