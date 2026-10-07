import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshness } from '@/query/freshness';
import {
  useAllBooks,
  useBookCard,
  useCollectionBooks,
  useCollectionHandles,
} from '@/shopify/hooks/catalogue';
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

// The hooks refetch on screen focus (D-079); `__tests__/query/screenFocus.test.tsx` covers that.
jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

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

    // TanStack hands the new page to the hook on a later timer tick (its notify manager uses
    // setTimeout), so wait for it instead of reading the result at once.
    await waitFor(() =>
      expect(
        (result.current.data?.pages ?? []).map((p) => (p.kind === 'found' ? p.books.length : -1)),
      ).toEqual([20, 6]),
    );
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

describe('useCollectionBooks with a sort and "Available now" (P6-04)', () => {
  beforeEach(() => {
    mockQuery.mockImplementation(
      async (_query: string, options: { variables: { after: string | null } }) =>
        page(options.variables.after),
    );
  });

  it("keeps P6-03's key and variables without options (Home, the preview)", async () => {
    const { result } = await renderHook(() => useCollectionBooks('junior-readers'), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(storefrontKeys.catalogue.collectionBooks('junior-readers')).toEqual([
      'storefront',
      'catalogue',
      'collectionBooks',
      'junior-readers',
    ]);
    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      handle: 'junior-readers',
      first: 20,
      after: null,
    });
  });

  it('caches each combination of sort and "Available now" on its own', async () => {
    const on = { available: true, sort: 'featured' } as const;
    const off = { available: false, sort: 'featured' } as const;
    const { result, rerender } = await renderHook(
      ({ list }: { list: typeof on | typeof off }) => useCollectionBooks('junior-readers', list),
      { wrapper: withQueryClient(client), initialProps: { list: on } },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await rerender({ list: off });
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2));

    expect(mockQuery.mock.calls.map((call) => call[1].variables.filters)).toEqual([
      [{ available: true }],
      null,
    ]);
    for (const list of [on, off]) {
      const query = client
        .getQueryCache()
        .find({ queryKey: storefrontKeys.catalogue.collectionBooks('junior-readers', list) });
      expect(query?.queryKey[0]).toBe('storefront');
    }
  });
});

describe('useAllBooks (D-083)', () => {
  const ALL = Array.from({ length: 26 }, (_, index) => bookProduct({ handle: `book-${index}` }));

  beforeEach(() => {
    mockQuery.mockImplementation(
      async (_query: string, options: { variables: { after: string | null } }) => {
        const start = options.variables.after === null ? 0 : 20;
        return {
          products: {
            pageInfo: { hasNextPage: start + 20 < ALL.length, endCursor: `end-${start}` },
            nodes: ALL.slice(start, start + 20),
          },
        };
      },
    );
  });

  it('reads 20 books at a time, never the whole catalogue', async () => {
    const list = { available: true, sort: 'title-ascending' } as const;
    const { result } = await renderHook(() => useAllBooks(list), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(result.current.data?.pages[0]?.books).toHaveLength(20);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() =>
      expect((result.current.data?.pages ?? []).map((p) => p.books.length)).toEqual([20, 6]),
    );
    expect(mockQuery.mock.calls.map((call) => call[1].variables.after)).toEqual([null, 'end-0']);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('caches under the storefront key root with the catalogue preset, by options', async () => {
    const list = { available: false, sort: 'price-ascending' } as const;
    const { result } = await renderHook(() => useAllBooks(list), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client
      .getQueryCache()
      .find({ queryKey: storefrontKeys.catalogue.allBooks(list) });
    expect(query?.queryKey).toEqual(['storefront', 'catalogue', 'allBooks', list]);
    expect(query?.options).toMatchObject({
      staleTime: freshness.catalogue.staleTime,
      gcTime: freshness.catalogue.gcTime,
    });
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

describe('useCollectionHandles', () => {
  it('gives the set of handles, under the storefront key root with the catalogue preset', async () => {
    mockQuery.mockResolvedValue({
      collections: {
        pageInfo: { hasNextPage: false, endCursor: null },
        nodes: [{ handle: 'tintin-series' }, { handle: 'new-arrivals' }],
      },
    });

    const { result } = await renderHook(() => useCollectionHandles(), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.has('tintin-series')).toBe(true);
    expect(result.current.data?.has('dog-man-series')).toBe(false);
    const query = client
      .getQueryCache()
      .find({ queryKey: storefrontKeys.catalogue.collectionHandles() });
    expect(query?.queryKey[0]).toBe('storefront');
    expect(query?.options).toMatchObject({ staleTime: freshness.catalogue.staleTime });
  });
});
