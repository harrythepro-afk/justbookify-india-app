import { MutationObserver, type QueryClient } from '@tanstack/react-query';

import { clearStorefrontCache } from '@/shopify/cache';
import { storefrontKeys } from '@/shopify/queryKeys';

import { createTestQueryClient } from '../helpers/queryClient';

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
});

afterEach(() => {
  client.clear();
});

function keysInCache(): unknown[] {
  return client
    .getQueryCache()
    .getAll()
    .map((query) => query.queryKey);
}

describe('clearStorefrontCache', () => {
  it('removes Storefront queries and mutations and leaves other data sources alone', async () => {
    await client.fetchQuery({ queryKey: storefrontKeys.devCheckout.variants(), queryFn: () => [] });
    await client.fetchQuery({ queryKey: ['customer', 'orders'], queryFn: () => [] });
    await new MutationObserver(client, {
      mutationKey: storefrontKeys.devCheckout.createCart(),
      mutationFn: () => Promise.resolve('cart'),
    }).mutate();
    await new MutationObserver(client, {
      mutationKey: ['customer', 'update'],
      mutationFn: () => Promise.resolve('done'),
    }).mutate();

    await clearStorefrontCache(client);

    expect(keysInCache()).toEqual([['customer', 'orders']]);
    expect(
      client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.options.mutationKey),
    ).toEqual([['customer', 'update']]);
  });

  it('cancels a Storefront query in flight', async () => {
    let signal: AbortSignal | undefined;
    const inFlight = client.fetchQuery({
      queryKey: storefrontKeys.devCheckout.variants(),
      queryFn: (context) => {
        signal = context.signal;
        return new Promise(() => undefined);
      },
    });

    await clearStorefrontCache(client);

    await expect(inFlight).rejects.toBeDefined();
    expect(signal?.aborted).toBe(true);
    expect(keysInCache()).toEqual([]);
  });

  it('keeps every Storefront key under the storefront root', () => {
    expect(storefrontKeys.devCheckout.variants()[0]).toBe('storefront');
    expect(storefrontKeys.devCheckout.createCart()[0]).toBe('storefront');
  });
});
