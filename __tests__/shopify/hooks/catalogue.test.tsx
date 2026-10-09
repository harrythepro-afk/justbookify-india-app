import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshness } from '@/query/freshness';
import {
  useBook,
  useBookCard,
  useCollectionBooks,
  useCollectionHandles,
  useGenreOptions,
  usePriceOptions,
} from '@/shopify/hooks/catalogue';
import { resetCatalogueReportsForTests } from '@/shopify/catalogue';
import { storefrontKeys } from '@/shopify/queryKeys';

import { bookPageProduct, bookProduct, EXAMPLES } from '../../helpers/catalogue';
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

const mockReportUnexpected = jest.fn();

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: (code: string) => mockReportUnexpected(code),
}));

const STORE_CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };
let mockStoreConfig: () => typeof STORE_CONFIG = () => STORE_CONFIG;

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => mockStoreConfig(),
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
  resetCatalogueReportsForTests();
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
    const on = { available: true, sort: 'featured', genre: null, maxPrice: null } as const;
    const off = { available: false, sort: 'featured', genre: null, maxPrice: null } as const;
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

describe("Browse's all books through useCollectionBooks (D-100, replaces D-083)", () => {
  const ALL = Array.from({ length: 26 }, (_, index) => bookProduct({ handle: `book-${index}` }));

  beforeEach(() => {
    mockQuery.mockImplementation(
      async (_query: string, options: { variables: { after: string | null } }) => {
        const start = options.variables.after === null ? 0 : 20;
        return {
          collection: {
            title: 'All books',
            products: {
              pageInfo: { hasNextPage: start + 20 < ALL.length, endCursor: `end-${start}` },
              nodes: ALL.slice(start, start + 20),
            },
          },
        };
      },
    );
  });

  it('reads 20 books at a time from the all-books collection, never the whole catalogue', async () => {
    const list = { available: true, sort: 'title-ascending', genre: null, maxPrice: null } as const;
    const { result } = await renderHook(() => useCollectionBooks('all-books', list), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0]?.[1].variables.handle).toBe('all-books');
    const books = (pages: typeof result.current.data) =>
      (pages?.pages ?? []).map((p) => (p.kind === 'found' ? p.books.length : -1));
    expect(books(result.current.data)).toEqual([20]);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(books(result.current.data)).toEqual([20, 6]));
    expect(mockQuery.mock.calls.map((call) => call[1].variables.after)).toEqual([null, 'end-0']);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('caches each genre on its own, under the storefront key root with the catalogue preset', async () => {
    const manga = {
      namespace: 'shopify',
      key: 'genre',
      value: 'gid://shopify/TaxonomyValue/15730',
    };
    const list = {
      available: false,
      sort: 'price-ascending',
      genre: manga,
      maxPrice: null,
    } as const;
    const { result } = await renderHook(() => useCollectionBooks('all-books', list), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const query = client
      .getQueryCache()
      .find({ queryKey: storefrontKeys.catalogue.collectionBooks('all-books', list) });
    expect(query?.queryKey).toEqual([
      'storefront',
      'catalogue',
      'collectionBooks',
      'all-books',
      list,
    ]);
    expect(query?.options).toMatchObject({
      staleTime: freshness.catalogue.staleTime,
      gcTime: freshness.catalogue.gcTime,
    });
    expect(mockQuery.mock.calls[0]?.[1].variables.filters).toEqual([{ taxonomyMetafield: manga }]);
    expect(mockQuery.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('useGenreOptions (P6-07, D-101, D-102)', () => {
  const value = (id: number, count: number) => ({
    count,
    input: JSON.stringify({
      taxonomyMetafield: {
        namespace: 'shopify',
        key: 'genre',
        value: `gid://shopify/TaxonomyValue/${id}`,
      },
    }),
  });
  const entry = (label: string | null, id: number) => ({
    label: label === null ? null : { value: label },
    taxonomyReference: { value: `gid://shopify/TaxonomyValue/${id}` },
  });
  // Shopify labels these values Design, Fantasy and Drama; the store calls them Manga, Fantasy and
  // Realistic fiction. The labels below are never read: the operation selects none.
  const VALUES = [value(15730, 4), value(20853, 13), value(15732, 14)];
  const ENTRIES = [
    entry('Realistic fiction', 15732),
    entry('Manga', 15730),
    entry('Fantasy', 20853),
  ];

  function respond(overrides: { values?: unknown; entries?: unknown; failEntries?: boolean } = {}) {
    mockQuery.mockImplementation(async (query: string) => {
      if (query.includes('query CollectionGenres(')) {
        return (
          overrides.values ?? {
            collection: {
              products: { filters: [{ id: 'filter.v.t.shopify.genre', values: VALUES }] },
            },
          }
        );
      }
      if (query.includes('query GenreEntries(')) {
        if (overrides.failEntries === true) throw new Error('cannot list');
        return (
          overrides.entries ?? {
            metaobjects: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: ENTRIES },
          }
        );
      }
      throw new Error(`unexpected ${query.slice(0, 40)}`);
    });
  }

  beforeEach(() => {
    mockReportUnexpected.mockReset();
  });

  it('is loading until both reads are in, then gives the store names A-Z', async () => {
    respond();
    // The entries are held back, so the loading state does not depend on the machine's speed.
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const answer = mockQuery.getMockImplementation();
    mockQuery.mockImplementation(async (query: string, ...rest: unknown[]) => {
      if (query.includes('query GenreEntries(')) await held;
      return answer?.(query, ...rest);
    });
    const { result } = await renderHook(() => useGenreOptions('all-books', true), {
      wrapper: withQueryClient(client),
    });

    // The values are in; the entries are not, so still loading.
    await waitFor(() =>
      expect(
        client
          .getQueryCache()
          .find({ queryKey: storefrontKeys.catalogue.collectionGenres('all-books', true) })?.state
          .status,
      ).toBe('success'),
    );
    expect(result.current).toEqual({ kind: 'loading' });

    await act(async () => {
      release();
    });
    await waitFor(() => expect(result.current.kind).toBe('ready'));
    if (result.current.kind !== 'ready') throw new Error('expected ready');
    expect(result.current.options.map((option) => option.name)).toEqual([
      'Fantasy',
      'Manga',
      'Realistic fiction',
    ]);
    expect(result.current.options[1]?.filter).toEqual({
      namespace: 'shopify',
      key: 'genre',
      value: 'gid://shopify/TaxonomyValue/15730',
    });
    expect(mockReportUnexpected).not.toHaveBeenCalled();
  });

  it('sends "Available now" with the values read, and caches the entries once for every list', async () => {
    respond();
    const { result, rerender } = await renderHook(
      ({ available }: { available: boolean }) => useGenreOptions('all-books', available),
      { wrapper: withQueryClient(client), initialProps: { available: true } },
    );
    await waitFor(() => expect(result.current.kind).toBe('ready'));

    await rerender({ available: false });
    await waitFor(() =>
      expect(
        mockQuery.mock.calls.filter((call) => String(call[0]).includes('CollectionGenres(')),
      ).toHaveLength(2),
    );
    await waitFor(() => expect(result.current.kind).toBe('ready'));

    const valueCalls = mockQuery.mock.calls.filter((call) =>
      String(call[0]).includes('CollectionGenres('),
    );
    expect(valueCalls.map((call) => call[1].variables)).toEqual([
      { handle: 'all-books', filters: [{ available: true }] },
      { handle: 'all-books', filters: null },
    ]);
    expect(
      mockQuery.mock.calls.filter((call) => String(call[0]).includes('GenreEntries(')),
    ).toHaveLength(1);
    for (const queryKey of [
      storefrontKeys.catalogue.collectionGenres('all-books', true),
      storefrontKeys.catalogue.collectionGenres('all-books', false),
      storefrontKeys.catalogue.genreEntries(),
    ]) {
      const query = client.getQueryCache().find({ queryKey });
      expect(query?.queryKey[0]).toBe('storefront');
      expect(query?.options).toMatchObject({ staleTime: freshness.catalogue.staleTime });
    }
  });

  it('is unavailable when the genre entries cannot be listed: no Shopify name is used', async () => {
    respond({ failEntries: true });
    const { result } = await renderHook(() => useGenreOptions('all-books', true), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
  });

  it('is unavailable, not a crash, when the store configuration cannot be read', async () => {
    respond();
    mockStoreConfig = () => {
      throw new Error('Missing or invalid store configuration');
    };
    try {
      const { result } = await renderHook(() => useGenreOptions('all-books', true), {
        wrapper: withQueryClient(client),
      });

      await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
    } finally {
      mockStoreConfig = () => STORE_CONFIG;
    }
  });

  it('is unavailable when the collection is missing', async () => {
    respond({ values: { collection: null } });
    const { result } = await renderHook(() => useGenreOptions('gone', true), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current).toEqual({ kind: 'unavailable' }));
  });

  it('is ready with no options when the collection has no Genre filter', async () => {
    respond({ values: { collection: { products: { filters: [] } } } });
    const { result } = await renderHook(() => useGenreOptions('all-books', true), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current).toEqual({ kind: 'ready', options: [] }));
  });

  it('reports a value with no store name once, by code only, and leaves it out', async () => {
    respond({
      entries: {
        metaobjects: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [entry('Fantasy', 20853), entry('   ', 15732)],
        },
      },
    });
    const { result } = await renderHook(() => useGenreOptions('all-books', true), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.kind).toBe('ready'));
    if (result.current.kind !== 'ready') throw new Error('expected ready');
    expect(result.current.options.map((option) => option.name)).toEqual(['Fantasy']);
    expect(mockReportUnexpected.mock.calls).toEqual([['catalogue/genre-without-name']]);
  });
});

describe('usePriceOptions (P6-08, D-104)', () => {
  beforeEach(() => {
    mockReportUnexpected.mockClear();
  });

  it("gives the configured maxima in the store's currency format, with no read", async () => {
    const { result } = await renderHook(() => usePriceOptions(), {
      wrapper: withQueryClient(client),
    });

    expect(result.current?.map((option) => option.label)).toEqual([
      'Up to ₹34',
      'Up to ₹49',
      'Up to ₹74',
    ]);
    expect(result.current?.map((option) => option.max)).toEqual([34, 49, 74]);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(mockReportUnexpected).not.toHaveBeenCalled();
  });

  it('is null, not a crash, when the store configuration cannot be read; reported once by code', async () => {
    mockStoreConfig = () => {
      throw new Error('Missing or invalid store configuration');
    };
    try {
      const first = await renderHook(() => usePriceOptions(), {
        wrapper: withQueryClient(client),
      });
      const second = await renderHook(() => usePriceOptions(), {
        wrapper: withQueryClient(client),
      });

      expect(first.result.current).toBeNull();
      expect(second.result.current).toBeNull();
      expect(mockReportUnexpected.mock.calls).toEqual([['catalogue/price-options-unavailable']]);
    } finally {
      mockStoreConfig = () => STORE_CONFIG;
    }
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

describe('useBook (P6-05)', () => {
  it('reads one book page by handle with the liveStock preset (D-062, D-093)', async () => {
    mockQuery.mockResolvedValue({
      product: bookPageProduct({
        handle: 'harry-potter-and-the-deathly-hallows-book-7',
        currentlyNotInStock: true,
      }),
    });

    const { result } = await renderHook(
      () => useBook('harry-potter-and-the-deathly-hallows-book-7'),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      availability: 'orderable-at-zero-stock',
      orderable: true,
      genres: ['Fantasy'],
    });
    const query = client.getQueryCache().find({
      queryKey: storefrontKeys.catalogue.book('harry-potter-and-the-deathly-hallows-book-7'),
    });
    expect(query?.queryKey[0]).toBe('storefront');
    expect(query?.options).toMatchObject({
      staleTime: freshness.liveStock.staleTime,
      gcTime: freshness.liveStock.gcTime,
      refetchOnMount: 'always',
    });
  });

  it('gives null for a missing book', async () => {
    mockQuery.mockResolvedValue({ product: null });

    const { result } = await renderHook(() => useBook('no-such-book-p6-05'), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('reads Shopify again each time a page for the book opens', async () => {
    mockQuery.mockResolvedValue({ product: bookPageProduct({ handle: 'the-gruffalo' }) });

    const first = await renderHook(() => useBook('the-gruffalo'), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    await first.unmount();

    const second = await renderHook(() => useBook('the-gruffalo'), {
      wrapper: withQueryClient(client),
    });
    await waitFor(() => expect(mockQuery).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(second.result.current.isFetching).toBe(false));
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
