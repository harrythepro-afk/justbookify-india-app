import { useQuery, type QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useRefetchStaleOnFocus } from '@/query/screenFocus';

import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../helpers/queryClient';

// Like React Navigation's: the callback runs when the screen mounts and on every later focus.
// `focusScreen()` stands for the screen regaining focus.
let mockFocusCallbacks: (() => void)[] = [];
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (callback: () => void) => {
      mockFocusCallbacks.push(callback);
      useEffect(() => callback(), [callback]);
    },
  };
});

async function focusScreen() {
  await act(async () => {
    mockFocusCallbacks.at(-1)?.();
  });
}

const KEY = ['storefront', 'catalogue', 'test'] as const;
const queryFn = jest.fn(async () => 'books');
let client: QueryClient;

function useScreen(staleTime: number) {
  useRefetchStaleOnFocus(KEY);
  return useQuery({ queryKey: KEY, queryFn, staleTime });
}

beforeEach(() => {
  client = createTestQueryClient();
  mockFocusCallbacks = [];
  queryFn.mockClear();
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

it('does not refetch on the first focus, when the screen mounts', async () => {
  const { result } = await renderHook(() => useScreen(0), { wrapper: withQueryClient(client) });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(queryFn).toHaveBeenCalledTimes(1);
});

it('refetches stale data when the screen regains focus', async () => {
  const { result } = await renderHook(() => useScreen(0), { wrapper: withQueryClient(client) });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  await focusScreen();

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
});

it('leaves fresh data alone when the screen regains focus', async () => {
  const { result } = await renderHook(() => useScreen(60_000), {
    wrapper: withQueryClient(client),
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  await focusScreen();
  await focusScreen();

  // Give a refetch, if one were started, the time to reach the query function.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(queryFn).toHaveBeenCalledTimes(1);
});

it('refetches only its own query, not other stale ones', async () => {
  const otherFn = jest.fn(async () => 'other');
  const { result } = await renderHook(
    () => {
      const other = useQuery({ queryKey: ['storefront', 'other'], queryFn: otherFn, staleTime: 0 });
      return { mine: useScreen(0), other };
    },
    { wrapper: withQueryClient(client) },
  );
  await waitFor(() => expect(result.current.other.isSuccess).toBe(true));
  await waitFor(() => expect(result.current.mine.isSuccess).toBe(true));

  await focusScreen();

  await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
  expect(otherFn).toHaveBeenCalledTimes(1);
});

it('does not re-run on a re-render with an equal key', async () => {
  const { result, rerender } = await renderHook(() => useScreen(0), {
    wrapper: withQueryClient(client),
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  await rerender({});
  await rerender({});

  expect(new Set(mockFocusCallbacks).size).toBe(1);
  expect(queryFn).toHaveBeenCalledTimes(1);
});
