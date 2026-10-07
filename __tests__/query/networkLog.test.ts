import { act, renderHook } from '@testing-library/react-native';
import type { NetworkState } from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

import {
  describeReading,
  LATER_READ_DELAY_MS,
  startNetworkLog,
  useNetworkLog,
} from '@/query/networkLog';

let mockNetworkListener: ((state: NetworkState) => void) | undefined;
let mockAppStateListener: ((status: AppStateStatus) => void) | undefined;
const mockRemoveNetwork = jest.fn();
const mockRemoveAppState = jest.fn();
const mockGetNetworkState = jest.fn<Promise<NetworkState>, []>();

jest.mock('expo-network', () => ({
  addNetworkStateListener: (listener: (state: NetworkState) => void) => {
    mockNetworkListener = listener;
    return { remove: mockRemoveNetwork };
  },
  getNetworkStateAsync: () => mockGetNetworkState(),
}));

const ONLINE = { isConnected: true, isInternetReachable: true, type: 'WIFI' } as NetworkState;
const OFFLINE = { isConnected: false, isInternetReachable: false, type: 'NONE' } as NetworkState;

let stop: (() => void) | undefined;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 7, 11, 22, 31));
  mockGetNetworkState.mockReset().mockResolvedValue(ONLINE);
  mockRemoveNetwork.mockClear();
  mockRemoveAppState.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    mockAppStateListener = listener as (status: AppStateStatus) => void;
    return { remove: mockRemoveAppState };
  });
});

afterEach(() => {
  stop?.();
  stop = undefined;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

it('keeps the last network event', async () => {
  stop = startNetworkLog();
  const { result } = await renderHook(() => useNetworkLog());

  await act(async () => {
    mockNetworkListener?.(OFFLINE);
  });

  expect(result.current.lastEvent).toEqual({
    at: '11:22:31',
    isConnected: false,
    isInternetReachable: false,
    type: 'NONE',
  });
});

it('notes when the app goes to the background', async () => {
  stop = startNetworkLog();
  const { result } = await renderHook(() => useNetworkLog());

  await act(async () => {
    mockAppStateListener?.('background');
  });

  expect(result.current.backgroundAt).toBe('11:22:31');
  expect(mockGetNetworkState).not.toHaveBeenCalled();
});

it('reads the network on return, and again a few seconds later', async () => {
  stop = startNetworkLog();
  const { result } = await renderHook(() => useNetworkLog());
  mockGetNetworkState.mockResolvedValueOnce(OFFLINE).mockResolvedValueOnce(ONLINE);

  await act(async () => {
    mockAppStateListener?.('active');
  });
  await settle();

  expect(result.current.readOnReturn?.isConnected).toBe(false);
  expect(result.current.readLater).toBeNull();

  await act(async () => {
    jest.advanceTimersByTime(LATER_READ_DELAY_MS);
  });
  await settle();

  expect(result.current.readLater?.isConnected).toBe(true);
  expect(mockGetNetworkState).toHaveBeenCalledTimes(2);
});

it('records an unreadable state as none', async () => {
  stop = startNetworkLog();
  const { result } = await renderHook(() => useNetworkLog());
  mockGetNetworkState.mockRejectedValue(new Error('not available'));

  await act(async () => {
    mockAppStateListener?.('active');
  });
  await settle();

  expect(result.current.readOnReturn).toBeNull();
});

it('stops listening and forgets when stopped', async () => {
  stop = startNetworkLog();
  const { result } = await renderHook(() => useNetworkLog());
  await act(async () => {
    mockNetworkListener?.(OFFLINE);
  });

  await act(async () => {
    stop?.();
  });
  stop = undefined;

  expect(mockRemoveNetwork).toHaveBeenCalledTimes(1);
  expect(mockRemoveAppState).toHaveBeenCalledTimes(1);
  expect(result.current.lastEvent).toBeNull();
});

it('describes a reading on one line', () => {
  expect(
    describeReading({
      at: '11:22:31',
      isConnected: true,
      isInternetReachable: false,
      type: 'WIFI',
    }),
  ).toBe('11:22:31 connected=true reachable=false type=WIFI');
  expect(
    describeReading({
      at: '11:22:34',
      isConnected: undefined,
      isInternetReachable: undefined,
      type: undefined,
    }),
  ).toBe('11:22:34 connected=undefined reachable=undefined type=unknown');
  expect(describeReading(null)).toBe('none');
});
