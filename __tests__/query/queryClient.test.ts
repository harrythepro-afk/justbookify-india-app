import {
  MutationObserver,
  QueryObserver,
  type QueryClient,
  type QueryObserverResult,
} from '@tanstack/react-query';

import { clearAllCaches } from '@/query/queryClient';
import { StorefrontError, type StorefrontErrorKind } from '@/shopify/errors';

import { createTestQueryClient } from '../helpers/queryClient';

const mockStorefrontProblem = jest.fn<void, [string, string]>();
const mockUnexpected = jest.fn<void, [string]>();

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: (code: string, operationName: string) =>
    mockStorefrontProblem(code, operationName),
  reportUnexpectedDataError: (code: string) => mockUnexpected(code),
}));

function storefrontError(kind: StorefrontErrorKind, codes?: string[]): StorefrontError {
  return new StorefrontError(kind, { operationName: 'TestOperation', codes });
}

type Options = {
  readonly queryKey: readonly unknown[];
  readonly queryFn: (context: { signal: AbortSignal }) => unknown;
};

let client: QueryClient;
const unsubscribes: (() => void)[] = [];

/** Watches a query the way a screen does, and resolves once `done` holds for its result. */
function observe(
  options: Options,
  done: (result: QueryObserverResult) => boolean = (result) => !result.isPending,
): Promise<QueryObserverResult> {
  const observer = new QueryObserver(client, options);
  return new Promise((resolve) => {
    unsubscribes.push(
      observer.subscribe((result) => {
        if (done(result)) resolve(result);
      }),
    );
  });
}

beforeEach(() => {
  client = createTestQueryClient();
  mockStorefrontProblem.mockClear();
  mockUnexpected.mockClear();
});

afterEach(() => {
  unsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
  client.clear();
});

describe('the app query client', () => {
  it('does not retry a failed query: the Storefront client already retries safe reads', async () => {
    const queryFn = jest.fn().mockRejectedValue(storefrontError('timeout'));

    const result = await observe({ queryKey: ['test', 'retry'], queryFn });

    expect(result.isError).toBe(true);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('does not retry a failed mutation', async () => {
    const mutationFn = jest.fn().mockRejectedValue(storefrontError('timeout'));
    const observer = new MutationObserver(client, { mutationFn });

    await expect(observer.mutate(undefined)).rejects.toBeInstanceOf(StorefrontError);
    expect(mutationFn).toHaveBeenCalledTimes(1);
  });

  it('reports a failed query once, however many screens watch it', async () => {
    const queryFn = jest.fn().mockRejectedValue(storefrontError('graphql-error'));
    const queryKey = ['test', 'shared'];

    await Promise.all([observe({ queryKey, queryFn }), observe({ queryKey, queryFn })]);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(mockStorefrontProblem.mock.calls).toEqual([
      ['storefront/graphql-error', 'TestOperation'],
    ]);
  });

  it("reports a mutation's user errors unless its meta says the caller handles them", async () => {
    const mutationFn = () => Promise.reject(storefrontError('user-errors', ['INVALID']));

    const handled = new MutationObserver(client, {
      mutationFn,
      meta: { handledCodes: ['INVALID'] },
    });
    await expect(handled.mutate()).rejects.toBeInstanceOf(StorefrontError);
    expect(mockStorefrontProblem).not.toHaveBeenCalled();

    const unhandled = new MutationObserver(client, { mutationFn });
    await expect(unhandled.mutate()).rejects.toBeInstanceOf(StorefrontError);
    expect(mockStorefrontProblem.mock.calls).toEqual([['storefront/user-errors', 'TestOperation']]);
  });

  it('reports an error that is not a Storefront error by its code only', async () => {
    const queryFn = () => Promise.reject(new TypeError('https://example.com/secret failed'));

    await observe({ queryKey: ['test', 'unexpected'], queryFn });

    expect(mockUnexpected.mock.calls).toEqual([['TypeError']]);
    expect(mockStorefrontProblem).not.toHaveBeenCalled();
  });

  it('does not report a query that is cancelled', async () => {
    const queryKey = ['test', 'cancelled'];
    await observe(
      {
        queryKey,
        queryFn: ({ signal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () => reject(storefrontError('cancelled'))),
          ),
      },
      (result) => result.isFetching,
    );

    await client.cancelQueries({ queryKey });
    await client.cancelQueries({ queryKey }, { revert: false });

    expect(mockStorefrontProblem).not.toHaveBeenCalled();
    expect(mockUnexpected).not.toHaveBeenCalled();
  });
});

describe('clearAllCaches', () => {
  it('cancels queries in flight and empties both caches', async () => {
    await client.fetchQuery({ queryKey: ['storefront', 'done'], queryFn: () => 'cached' });
    await client.fetchQuery({ queryKey: ['customer', 'done'], queryFn: () => 'cached' });
    await new MutationObserver(client, { mutationFn: () => Promise.resolve('ok') }).mutate();
    let signal: AbortSignal | undefined;
    const inFlight = client.fetchQuery({
      queryKey: ['storefront', 'in-flight'],
      queryFn: (context) => {
        signal = context.signal;
        return new Promise(() => undefined);
      },
    });

    await clearAllCaches(client);

    await expect(inFlight).rejects.toBeDefined();
    expect(signal?.aborted).toBe(true);
    expect(mockStorefrontProblem).not.toHaveBeenCalled();
    expect(mockUnexpected).not.toHaveBeenCalled();
    expect(client.getQueryCache().getAll()).toEqual([]);
    expect(client.getMutationCache().getAll()).toEqual([]);
  });
});
