import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshness } from '@/query/freshness';
import { useBookCard, useCollectionBooks } from '@/shopify/hooks/catalogue';
import { storefrontKeys } from '@/shopify/queryKeys';

import { bookProduct, EXAMPLES } from '../../helpers/catalogue';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../../helpers/queryClient';

const mockQuery = jest.fn();

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN' }),
}));

// junior-readers on the development store: 26 books, so 20 and then 6.
const JUNIOR_READERS = Array.from({ length: 26 }, (_, index) =>
  bookProduct({ handle: `junior-${index + 1}` }),
);

function page(after: string | null) {
  const start = after === null ? 0 : 20;
  const nodes = JUNIOR_READERS.slice(start, start + 20);
  const hasNextPage = start + 20 < JUNIOR_READERS.length;
  return {
    collection: {
      title: 'Junior Readers',
      products: { pageInfo: { hasNextPage, endCursor: `end-${start}` }, nodes },
    },
  };
}

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockQuery.mockReset();
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

describe('useCollectionBooks', () => {
  beforeEach(() => {
    mockQuery.mockImplementation(
      async (_query: string, options: { variables: { after: string | null } }) =>
        page(options.variables.after),
    );
  });

  it('reads 26 books in two pages, 20 then 6, and then has no next page', async () => {
    const { result } = await renderHook(() => useCollectionBooks('junior-readers'), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const firstPage = result.current.data?.pages[0];
    expect(firstPage?.kind === 'found' && firstPage.books).toHaveLength(20);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    const pages = result.current.data?.pages ?? [];
    expect(pages.map((p) => (p.kind === 'found' ? p.books.length : -1))).toEqual([20, 6]);
    expect(mockQuery.mock.calls.map((call) => call[1].variables.after)).toEqual([null, 'end-0']);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('caches under the storefront key root with the catalogue preset (D-061, D-062)', async () => {
    const { result } = await renderHook(() => useCollectionBooks('junior-readers'), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client
      .getQueryCache()
      .find({ queryKey: storefrontKeys.catalogue.collectionBooks('junior-readers') });
    expect(query?.queryKey[0]).toBe('storefront');
    expect(query?.options).toMatchObject({
      staleTime: freshness.catalogue.staleTime,
      gcTime: freshness.catalogue.gcTime,
    });
  });

  it('gives a not-found page and no next page for a missing collection', async () => {
    mockQuery.mockResolvedValue({ collection: null });

    const { result } = await renderHook(() => useCollectionBooks('no-such-collection'), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toEqual([{ kind: 'not-found' }]);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('passes the cache cancel signal to the client', async () => {
    const { result } = await renderHook(() => useCollectionBooks('junior-readers'), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockQuery.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('useBookCard', () => {
  it('reads one book by handle with the catalogue preset', async () => {
    mockQuery.mockResolvedValue({ product: EXAMPLES.orderableAtZeroStock() });

    const { result } = await renderHook(
      () => useBookCard('harry-potter-and-the-deathly-hallows-book-7'),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ orderable: true, price: '₹49' });
    const query = client.getQueryCache().find({
      queryKey: storefrontKeys.catalogue.bookCard('harry-potter-and-the-deathly-hallows-book-7'),
    });
    expect(query?.options).toMatchObject({ staleTime: freshness.catalogue.staleTime });
  });
});
