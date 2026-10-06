import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshness } from '@/query/freshness';
import { StorefrontError } from '@/shopify/errors';
import { useCreateDevCheckout, useDevCheckoutVariants } from '@/shopify/hooks/devCheckout';
import { storefrontKeys } from '@/shopify/queryKeys';

import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../../helpers/queryClient';

const mockQuery = jest.fn();
const mockMutation = jest.fn();

// The hooks reach the network only through the Storefront client.
jest.mock('@/shopify/client', () => ({
  storefrontQuery: (...args: unknown[]) => mockQuery(...args),
  storefrontMutation: (...args: unknown[]) => mockMutation(...args),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

const PRODUCTS = {
  products: {
    nodes: [
      {
        title: 'Picture Book',
        variants: {
          nodes: [
            {
              id: 'gid://shopify/ProductVariant/2',
              title: 'Default Title',
              availableForSale: true,
              price: { amount: '99.0', currencyCode: 'INR' },
            },
          ],
        },
      },
    ],
  },
};

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockQuery.mockReset().mockResolvedValue(PRODUCTS);
  mockMutation.mockReset();
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

function renderVariants(enabled = true) {
  return renderHook(() => useDevCheckoutVariants(enabled), { wrapper: withQueryClient(client) });
}

describe('useDevCheckoutVariants', () => {
  it("passes the cache's cancel signal to the Storefront client", async () => {
    const { result } = await renderVariants();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        id: 'gid://shopify/ProductVariant/2',
        title: 'Picture Book',
        price: 99,
        currencyCode: 'INR',
      },
    ]);
    const [, options] = mockQuery.mock.calls[0] as [string, { signal?: AbortSignal }];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('cancels the request when the screen closes before it ends', async () => {
    let signal: AbortSignal | undefined;
    mockQuery.mockImplementation((_query: string, options: { signal: AbortSignal }) => {
      signal = options.signal;
      return new Promise(() => undefined);
    });
    const { unmount } = await renderVariants();
    await waitFor(() => expect(signal).toBeDefined());

    await unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('reads nothing while disabled', async () => {
    await renderVariants(false);

    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('uses the live-stock preset under the storefront key', async () => {
    const { result } = await renderVariants();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client.getQueryCache().find({ queryKey: storefrontKeys.devCheckout.variants() });
    expect(query?.observers[0]?.options.staleTime).toBe(freshness.liveStock.staleTime);
    expect(query?.options.gcTime).toBe(freshness.liveStock.gcTime);
  });

  it('reads again each time a screen using it opens', async () => {
    const first = await renderVariants();
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));

    const second = await renderVariants();
    await waitFor(() => expect(second.result.current.isFetching).toBe(false));

    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('is not retried by the cache after a failure', async () => {
    mockQuery.mockRejectedValue(new StorefrontError('timeout', { operationName: 'Test' }));
    const { result } = await renderVariants();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});

describe('useCreateDevCheckout', () => {
  it('creates the cart once, never retrying, under the storefront mutation key', async () => {
    mockMutation.mockRejectedValue(new StorefrontError('timeout', { operationName: 'Test' }));
    const { result } = await renderHook(() => useCreateDevCheckout(), {
      wrapper: withQueryClient(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync([
          { merchandiseId: 'gid://shopify/ProductVariant/2', quantity: 1 },
        ]),
      ).rejects.toBeInstanceOf(StorefrontError);
    });

    expect(mockMutation).toHaveBeenCalledTimes(1);
    expect(client.getMutationCache().getAll()[0]?.options.mutationKey).toEqual(
      storefrontKeys.devCheckout.createCart(),
    );
  });
});
