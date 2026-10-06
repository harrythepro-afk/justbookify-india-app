import { focusManager, QueryObserver, type QueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

import { connectFocusToAppState } from '@/query/focus';

import { createTestQueryClient } from '../helpers/queryClient';

let listener: ((status: AppStateStatus) => void) | undefined;
const mockRemove = jest.fn();
let client: QueryClient;
const unsubscribes: (() => void)[] = [];

function setAppState(status: AppStateStatus) {
  listener?.(status);
}

/** A watched query whose data is fresh for `staleTime`; resolves after its first fetch. */
async function watched(key: string, staleTime: number) {
  const queryFn = jest.fn().mockResolvedValue(key);
  const observer = new QueryObserver(client, { queryKey: ['test', key], queryFn, staleTime });
  await new Promise<void>((resolve) => {
    unsubscribes.push(
      observer.subscribe((result) => {
        if (result.isSuccess && !result.isFetching) resolve();
      }),
    );
  });
  return queryFn;
}

beforeEach(() => {
  listener = undefined;
  mockRemove.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    listener = handler as (status: AppStateStatus) => void;
    return { remove: mockRemove } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  client = createTestQueryClient();
  client.mount();
});

afterEach(() => {
  unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
  client.unmount();
  client.clear();
  focusManager.setFocused(undefined);
  jest.restoreAllMocks();
});

describe('connectFocusToAppState', () => {
  it('refetches stale queries when the app returns to the foreground, and only those', async () => {
    const stop = connectFocusToAppState();
    const stale = await watched('stale', 0);
    const fresh = await watched('fresh', 60_000);

    setAppState('background');
    setAppState('active');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stale).toHaveBeenCalledTimes(2);
    expect(fresh).toHaveBeenCalledTimes(1);
    stop();
  });

  it('does not refetch while the app stays in the background', async () => {
    const stop = connectFocusToAppState();
    const stale = await watched('stale', 0);

    setAppState('background');
    setAppState('inactive');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stale).toHaveBeenCalledTimes(1);
    stop();
  });

  it('stops listening when asked', () => {
    const stop = connectFocusToAppState();

    stop();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});
