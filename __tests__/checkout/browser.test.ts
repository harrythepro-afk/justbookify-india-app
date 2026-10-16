import { AppState, type AppStateStatus } from 'react-native';

import { openCheckoutInBrowser } from '@/checkout/browser';

const mockOpen = jest.fn<Promise<{ type: string }>, [string, unknown]>();
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (url: string, options: unknown) => mockOpen(url, options),
}));

let appStateListener: ((state: AppStateStatus) => void) | undefined;
const mockRemove = jest.fn();
jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
  appStateListener = listener as (state: AppStateStatus) => void;
  return { remove: mockRemove } as never;
});

const URL = 'https://example-dev.myshopify.com/cart/c/test-cart-0001?key=test-key';

function appState(next: AppStateStatus) {
  appStateListener?.(next);
}

beforeEach(() => {
  mockOpen.mockReset();
  mockRemove.mockClear();
  appStateListener = undefined;
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
});

describe('openCheckoutInBrowser (D-152)', () => {
  it("opens the checkout URL in the app's own task, so recents cannot go around it", async () => {
    mockOpen.mockResolvedValue({ type: 'opened' });

    await expect(openCheckoutInBrowser(URL, () => undefined)).resolves.toBe('opened');

    expect(mockOpen).toHaveBeenCalledWith(URL, { createTask: false, showTitle: true });
  });

  it('calls back once when the app returns to the foreground after leaving it', async () => {
    mockOpen.mockResolvedValue({ type: 'opened' });
    const onReturn = jest.fn();
    await openCheckoutInBrowser(URL, onReturn);

    appState('active');
    expect(onReturn).not.toHaveBeenCalled();
    appState('background');
    appState('active');
    appState('background');
    appState('active');

    expect(onReturn).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalled();
  });

  it('calls back when the browser resolves on being closed (iPhone, a later task)', async () => {
    mockOpen.mockResolvedValue({ type: 'cancel' });
    const onReturn = jest.fn();
    await openCheckoutInBrowser(URL, onReturn);
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('rejects, and stops listening, when the browser cannot be opened', async () => {
    mockOpen.mockRejectedValue(new Error('no browser'));
    const onReturn = jest.fn();
    await expect(openCheckoutInBrowser(URL, onReturn)).rejects.toThrow();
    expect(mockRemove).toHaveBeenCalled();
  });
});
