import { appQueryClient } from '@/query/queryClient';

import { storefrontKeys } from './queryKeys';

/**
 * Cancels Storefront queries in flight and removes every Storefront query and mutation from the
 * app's cache (D-061). Entries of other data sources stay.
 */
export async function clearStorefrontCache(client = appQueryClient): Promise<void> {
  const filters = { queryKey: storefrontKeys.all };
  await client.cancelQueries(filters);
  client.removeQueries(filters);
  const mutationCache = client.getMutationCache();
  mutationCache
    .findAll({ mutationKey: storefrontKeys.all })
    .forEach((mutation) => mutationCache.remove(mutation));
}
