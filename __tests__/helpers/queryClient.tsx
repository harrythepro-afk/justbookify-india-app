import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createAppQueryClient } from '@/query/queryClient';

/**
 * The app's query client settings (D-061), for one test. A mutation keeps a five-minute
 * garbage-collection timer that clearing the cache does not stop, which would hold Jest open, so
 * here mutations have none. Nothing else differs from the app.
 */
export function createTestQueryClient(): QueryClient {
  const client = createAppQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({ ...defaults, mutations: { ...defaults.mutations, gcTime: Infinity } });
  return client;
}

/** Wraps a tree in a provider for the given client. */
export function withQueryClient(client: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Unmounts what the test rendered, then empties the client. In that order: a query that loses its
 * last screen after the cache is emptied starts a timer that would hold Jest open.
 */
export async function tearDownQueryClient(client: QueryClient | undefined): Promise<void> {
  await cleanup();
  client?.clear();
}
