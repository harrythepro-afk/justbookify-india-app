import {
  MutationObserver,
  onlineManager,
  QueryObserver,
  type QueryClient,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { NetworkState } from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

import type { StoreConfig } from '@/config/store';
import {
  connectOnlineToNetwork,
  isOfflineState,
  OFFLINE_RECHECK_MS,
  recheckNetwork,
} from '@/query/online';
import { storefrontMutation } from '@/shopify/client';
import { DEV_CHECKOUT_CART_CREATE_MUTATION } from '@/shopify/devCheckout';
import { StorefrontError } from '@/shopify/errors';

import { createTestQueryClient } from '../helpers/queryClient';

let networkListener: ((state: NetworkState) => void) | undefined;
const mockRemove = jest.fn();
const mockGetNetworkState = jest.fn<Promise<NetworkState>, []>();

jest.mock('expo-network', () => ({
  NetworkStateType: {
    NONE: 'NONE',
    UNKNOWN: 'UNKNOWN',
    CELLULAR: 'CELLULAR',
    WIFI: 'WIFI',
  },
  addNetworkStateListener: (listener: (state: NetworkState) => void) => {
    networkListener = listener;
    return { remove: mockRemove };
  },
  getNetworkStateAsync: () => mockGetNetworkState(),
}));

const mockStorefrontProblem = jest.fn();
const mockUnexpected = jest.fn();

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: (...args: unknown[]) => mockStorefrontProblem(...args),
  reportUnexpectedDataError: (...args: unknown[]) => mockUnexpected(...args),
}));

// Fake values only.
const mockConfig: StoreConfig = {
  storeDomain: 'example-dev-store.myshopify.com',
  storefrontAccessToken: 'public-token-for-tests',
  currencyCode: 'INR',
  country: 'IN',
  language: 'EN',
  shippingFeePrepaid: 75,
  shippingFeeCod: 125,
  freeDeliveryThreshold: 200,
  shippingDiscount: 75,
  orderCap: 500,
  deliveryPincodeRanges: [{ from: 10, to: 13 }],
};

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => mockConfig,
}));

const ONLINE = { isConnected: true, isInternetReachable: true, type: 'WIFI' } as NetworkState;
const OFFLINE = { isConnected: false, isInternetReachable: false, type: 'NONE' } as NetworkState;

let client: QueryClient;
let stop: (() => void) | undefined;
const unsubscribes: (() => void)[] = [];

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** The platform reports a network change. */
async function network(state: NetworkState): Promise<void> {
  networkListener?.(state);
  await flush();
}

/** Watches a query the way a screen does; resolves once `done` holds for its result. */
function observe(
  key: string,
  queryFn: () => Promise<string>,
  done: (result: QueryObserverResult<string>) => boolean,
  staleTime = 0,
): { observer: QueryObserver<string>; settled: Promise<QueryObserverResult<string>> } {
  const observer = new QueryObserver<string>(client, {
    queryKey: ['test', key],
    queryFn,
    staleTime,
  });
  const settled = new Promise<QueryObserverResult<string>>((resolve) => {
    unsubscribes.push(
      observer.subscribe((result) => {
        if (done(result)) resolve(result);
      }),
    );
  });
  return { observer, settled };
}

beforeEach(() => {
  networkListener = undefined;
  mockRemove.mockClear();
  mockStorefrontProblem.mockClear();
  mockUnexpected.mockClear();
  mockGetNetworkState.mockReset().mockResolvedValue(ONLINE);
  client = createTestQueryClient();
  client.mount();
});

afterEach(() => {
  unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
  stop?.();
  stop = undefined;
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

describe('isOfflineState', () => {
  it.each([
    ['not connected, no network', { isConnected: false, type: 'NONE' }, true],
    ['not connected, type unknown', { isConnected: false, type: 'UNKNOWN' }, false],
    ['connected', { isConnected: true, type: 'WIFI' }, false],
    ['connected but not reachable', { isConnected: true, isInternetReachable: false }, false],
    ['nothing known', {}, false],
    ['not connected, type missing', { isConnected: false }, true],
  ])('%s', (_name, state, offline) => {
    expect(isOfflineState(state as NetworkState)).toBe(offline);
  });
});

describe('connectOnlineToNetwork', () => {
  it('follows the network state the platform reports', async () => {
    stop = connectOnlineToNetwork();
    await flush();
    expect(onlineManager.isOnline()).toBe(true);

    await network(OFFLINE);
    expect(onlineManager.isOnline()).toBe(false);

    await network(ONLINE);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('reads the state once at the start', async () => {
    mockGetNetworkState.mockResolvedValue(OFFLINE);

    stop = connectOnlineToNetwork();
    await flush();

    expect(onlineManager.isOnline()).toBe(false);
  });

  it('lets a change event win over a slower first read', async () => {
    let answer: (state: NetworkState) => void = () => undefined;
    mockGetNetworkState.mockReturnValue(new Promise((resolve) => (answer = resolve)));

    stop = connectOnlineToNetwork();
    await network(OFFLINE);
    answer(ONLINE);
    await flush();

    expect(onlineManager.isOnline()).toBe(false);
  });

  it('counts the phone as online when the first read fails', async () => {
    mockGetNetworkState.mockRejectedValue(new Error('not available'));

    stop = connectOnlineToNetwork();
    await flush();

    expect(onlineManager.isOnline()).toBe(true);
  });

  it('counts an unknown connection type as online', async () => {
    stop = connectOnlineToNetwork();
    await network({ isConnected: false, type: 'UNKNOWN' } as NetworkState);

    expect(onlineManager.isOnline()).toBe(true);
  });

  it('stops listening and goes back to online when asked', async () => {
    stop = connectOnlineToNetwork();
    await network(OFFLINE);

    stop();
    stop = undefined;

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
  });
});

// Seen once in P6-03's phone check: the app stayed offline after a return from the background
// while the phone was online. The app re-reads the state itself (D-082).
describe('a false offline signal (D-082)', () => {
  let appStateListener: ((status: AppStateStatus) => void) | undefined;
  const removeAppState = jest.fn();
  // React Native's Jest mock makes `currentState` a function; the app reads a string, as on a phone.
  const mockedCurrentState = Object.getOwnPropertyDescriptor(AppState, 'currentState');

  beforeEach(() => {
    jest.useFakeTimers();
    appStateListener = undefined;
    removeAppState.mockClear();
    Object.defineProperty(AppState, 'currentState', {
      value: 'active',
      configurable: true,
      writable: true,
    });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      appStateListener = listener as (status: AppStateStatus) => void;
      return { remove: removeAppState };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    if (mockedCurrentState !== undefined) {
      Object.defineProperty(AppState, 'currentState', mockedCurrentState);
    }
  });

  /** Lets pending reads settle without moving the clock. */
  async function settle(): Promise<void> {
    await jest.advanceTimersByTimeAsync(0);
  }

  async function appGoes(status: AppStateStatus): Promise<void> {
    appStateListener?.(status);
    await settle();
  }

  it('re-reads the network on return to the foreground and goes back online', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    networkListener?.(OFFLINE);
    await appGoes('background');
    expect(onlineManager.isOnline()).toBe(false);
    mockGetNetworkState.mockClear().mockResolvedValue(ONLINE);

    await appGoes('active');

    expect(mockGetNetworkState).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('while offline in the foreground, re-checks every few seconds until it reads online', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    mockGetNetworkState.mockClear().mockResolvedValue(OFFLINE);
    networkListener?.(OFFLINE);

    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS - 1);
    expect(mockGetNetworkState).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(mockGetNetworkState).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(false);

    mockGetNetworkState.mockResolvedValue(ONLINE);
    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS);
    expect(mockGetNetworkState).toHaveBeenCalledTimes(2);
    expect(onlineManager.isOnline()).toBe(true);

    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS * 5);
    expect(mockGetNetworkState).toHaveBeenCalledTimes(2);
  });

  it('runs no timer while online', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    mockGetNetworkState.mockClear();

    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS * 5);

    expect(mockGetNetworkState).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('runs no timer in the background, and stops one when the app leaves', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    mockGetNetworkState.mockClear().mockResolvedValue(OFFLINE);
    networkListener?.(OFFLINE);
    expect(jest.getTimerCount()).toBe(1);

    await appGoes('background');
    expect(jest.getTimerCount()).toBe(0);
    networkListener?.(OFFLINE);
    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS * 5);

    expect(mockGetNetworkState).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('tries again later when a re-read fails while offline', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    networkListener?.(OFFLINE);
    mockGetNetworkState.mockClear().mockRejectedValueOnce(new Error('not available'));

    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS);
    expect(onlineManager.isOnline()).toBe(false);

    mockGetNetworkState.mockResolvedValue(ONLINE);
    await jest.advanceTimersByTimeAsync(OFFLINE_RECHECK_MS);
    expect(mockGetNetworkState).toHaveBeenCalledTimes(2);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('lets "Try again" re-read the network before it refetches', async () => {
    stop = connectOnlineToNetwork();
    await settle();
    networkListener?.(OFFLINE);
    mockGetNetworkState.mockClear().mockResolvedValue(ONLINE);

    await recheckNetwork();

    expect(mockGetNetworkState).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('does nothing on "Try again" when not connected, and stops everything when stopped', async () => {
    await recheckNetwork();
    expect(mockGetNetworkState).not.toHaveBeenCalled();

    stop = connectOnlineToNetwork();
    await settle();
    networkListener?.(OFFLINE);
    stop();
    stop = undefined;

    expect(removeAppState).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
    mockGetNetworkState.mockClear();
    await recheckNetwork();
    expect(mockGetNetworkState).not.toHaveBeenCalled();
  });
});

describe('queries offline', () => {
  it('pause a query started offline, without calling it, and run it once on reconnect', async () => {
    stop = connectOnlineToNetwork();
    await network(OFFLINE);
    const queryFn = jest.fn().mockResolvedValue('books');

    const { observer, settled } = observe('paused', queryFn, (result) => result.isSuccess);
    await flush();

    expect(queryFn).not.toHaveBeenCalled();
    expect(observer.getCurrentResult().fetchStatus).toBe('paused');
    expect(observer.getCurrentResult().isError).toBe(false);

    await network(ONLINE);

    expect((await settled).data).toBe('books');
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('keep cached data offline and refetch stale data on reconnect', async () => {
    stop = connectOnlineToNetwork();
    const queryFn = jest.fn().mockResolvedValue('books');
    const { observer, settled } = observe(
      'cached',
      queryFn,
      (result) => result.isSuccess && !result.isFetching,
    );
    await settled;

    await network(OFFLINE);
    expect(observer.getCurrentResult().data).toBe('books');
    expect(queryFn).toHaveBeenCalledTimes(1);

    await network(ONLINE);
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('do not refetch fresh data on reconnect', async () => {
    stop = connectOnlineToNetwork();
    const queryFn = jest.fn().mockResolvedValue('books');
    const { settled } = observe(
      'fresh',
      queryFn,
      (result) => result.isSuccess && !result.isFetching,
      60_000,
    );
    await settled;

    await network(OFFLINE);
    await network(ONLINE);

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});

describe('mutations offline (D-065)', () => {
  it('run at once, fail with no-network, are not reported, and never run again by themselves', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('Network request failed'));
    stop = connectOnlineToNetwork();
    await network(OFFLINE);

    const observer = new MutationObserver(client, {
      mutationFn: () =>
        storefrontMutation(DEV_CHECKOUT_CART_CREATE_MUTATION, {
          variables: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/1', quantity: 1 }] },
        }),
    });
    const error = await observer.mutate().then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(StorefrontError);
    expect((error as StorefrontError).kind).toBe('no-network');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [mutation] = client.getMutationCache().getAll();
    expect(mutation?.state.status).toBe('error');
    expect(mutation?.state.isPaused).toBe(false);

    await network(ONLINE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockStorefrontProblem).not.toHaveBeenCalled();
    expect(mockUnexpected).not.toHaveBeenCalled();
  });
});
