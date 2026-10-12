import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { freshness } from '@/query/freshness';
import { useSearchBooks, useSearchMatchLists, type SearchOptions } from '@/shopify/hooks/search';
import { storefrontKeys } from '@/shopify/queryKeys';

import { bookProduct } from '../../helpers/catalogue';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../../helpers/queryClient';

const mockQuery = jest.fn();

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (...args: unknown[]) => mockQuery(...args),
}));

// The hook refetches on screen focus (D-079); `__tests__/query/screenFocus.test.tsx` covers that.
jest.mock('expo-router', () => ({ useFocusEffect: () => undefined }));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN' }),
}));

const RELEVANCE: SearchOptions = { available: false, sort: 'relevance' };

/** A search answer for `term`: `count` books named after it, 20 per page. */
function answer(term: string, count: number, after: string | null) {
  const start = after === null ? 0 : Number(after);
  const nodes = Array.from({ length: Math.min(20, count - start) }, (_, index) => ({
    __typename: 'Product',
    ...bookProduct({ handle: `${term}-${start + index + 1}` }),
  }));
  const hasNextPage = start + 20 < count;
  return {
    search: {
      totalCount: count,
      pageInfo: { hasNextPage, endCursor: hasNextPage ? String(start + 20) : null },
      nodes,
    },
  };
}

/** A request that answers only when `release` is called, and fails when its signal aborts. */
function heldRequest() {
  let release: () => void = () => undefined;
  let signal: AbortSignal | undefined;
  const promise = (term: string, init: { signal?: AbortSignal }) =>
    new Promise((resolve, reject) => {
      signal = init.signal;
      release = () => resolve(answer(term, 3, null));
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    });
  return {
    promise,
    release: () => release(),
    signal: () => signal,
  };
}

let client: QueryClient;

beforeEach(() => {
  client = createTestQueryClient();
  mockQuery.mockReset();
  mockQuery.mockImplementation(
    (_query: string, init: { variables: { query: string; after: string | null } }) =>
      Promise.resolve(answer(init.variables.query, 26, init.variables.after)),
  );
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

async function render(term: string | null, search: SearchOptions = RELEVANCE) {
  return await renderHook(
    (props: { term: string | null; search: SearchOptions }) =>
      useSearchBooks(props.term, props.search),
    { initialProps: { term, search }, wrapper: withQueryClient(client) },
  );
}

it('reads nothing while there is no term to search', async () => {
  const { result } = await render(null);
  await act(async () => undefined);

  expect(mockQuery).not.toHaveBeenCalled();
  expect(result.current.data).toBeUndefined();
  expect(result.current.isFetching).toBe(false);
});

it('reads 20 books with Shopify’s count, then the rest, never everything at once', async () => {
  const { result } = await render('harry');

  await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
  expect(result.current.data?.pages[0]?.totalCount).toBe(26);
  expect(result.current.data?.pages[0]?.books).toHaveLength(20);
  expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
    query: 'harry',
    first: 20,
    after: null,
    sortKey: 'RELEVANCE',
    reverse: false,
    unavailableProducts: 'LAST',
  });

  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() =>
    expect(result.current.data?.pages.map((page) => page.books.length)).toEqual([20, 6]),
  );
  expect(result.current.hasNextPage).toBe(false);
});

it('caches each term, sort and "Available now" on its own, in memory under storefront', async () => {
  const on: SearchOptions = { available: true, sort: 'price-ascending' };
  const { result, rerender } = await render('harry');
  await waitFor(() => expect(result.current.data).toBeDefined());
  await rerender({ term: 'harry', search: on });
  await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));

  const cached = client
    .getQueryCache()
    .findAll({ queryKey: ['storefront', 'catalogue', 'search'] });
  expect(cached.map((query) => query.queryKey)).toEqual([
    storefrontKeys.catalogue.search('harry', RELEVANCE),
    storefrontKeys.catalogue.search('harry', on),
  ]);
  expect(cached[1]?.options).toMatchObject(freshness.catalogue);
  expect(mockQuery.mock.calls[1]?.[1].variables).toMatchObject({
    sortKey: 'PRICE',
    reverse: false,
    unavailableProducts: 'HIDE',
  });
});

it('cancels the earlier request when the term changes', async () => {
  const held = heldRequest();
  mockQuery.mockImplementationOnce((_query: string, init: { signal?: AbortSignal }) =>
    held.promise('harr', init),
  );
  const { result, rerender } = await render('harr');
  await waitFor(() => expect(held.signal()).toBeDefined());
  expect(held.signal()?.aborted).toBe(false);

  await rerender({ term: 'harry', search: RELEVANCE });

  await waitFor(() => expect(held.signal()?.aborted).toBe(true));
  await waitFor(() => expect(result.current.data?.pages[0]?.books[0]?.handle).toBe('harry-1'));
});

it('keeps the previous results on screen while a new term loads (owner, change a)', async () => {
  const { result, rerender } = await render('harry');
  await waitFor(() => expect(result.current.data?.pages[0]?.books[0]?.handle).toBe('harry-1'));

  const held = heldRequest();
  mockQuery.mockImplementationOnce((_query: string, init: { signal?: AbortSignal }) =>
    held.promise('dahl', init),
  );
  await rerender({ term: 'dahl', search: RELEVANCE });

  await waitFor(() => expect(result.current.isPlaceholderData).toBe(true));
  expect(result.current.data?.pages[0]?.books[0]?.handle).toBe('harry-1');

  await act(async () => held.release());
  await waitFor(() => expect(result.current.isPlaceholderData).toBe(false));
  expect(result.current.data?.pages[0]?.books[0]?.handle).toBe('dahl-1');
  expect(result.current.data?.pages[0]?.totalCount).toBe(3);
});

describe('useSearchMatchLists (P6-09, D-109)', () => {
  const HARRY = 'gid://shopify/Collection/411000000001';
  const SIX_TO_EIGHT = 'gid://shopify/Collection/411000000006';

  /** Answers the collection listing and the genre entries; anything else fails. */
  function answerCatalogue(options: { handles?: 'fail'; entries?: 'fail' | 'hold' } = {}) {
    mockQuery.mockImplementation((operation: string) => {
      if (operation.includes('query CollectionHandles(')) {
        if (options.handles === 'fail') return Promise.reject(new Error('boom'));
        return Promise.resolve({
          collections: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              { id: HARRY, handle: 'harry-potter-series' },
              { id: SIX_TO_EIGHT, handle: 'emerging-readers' },
              { id: 'gid://shopify/Collection/9', handle: 'not-configured' },
            ],
          },
        });
      }
      if (operation.includes('query GenreEntries(')) {
        if (options.entries === 'fail') return Promise.reject(new Error('boom'));
        if (options.entries === 'hold') return new Promise(() => undefined);
        return Promise.resolve({
          metaobjects: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                label: { value: ' Manga ' },
                taxonomyReference: { value: 'gid://shopify/TaxonomyValue/15730' },
              },
              {
                label: { value: '' },
                taxonomyReference: { value: 'gid://shopify/TaxonomyValue/1' },
              },
              { label: { value: 'No value' }, taxonomyReference: null },
            ],
          },
        });
      }
      return Promise.reject(new Error(`unexpected ${operation.slice(0, 30)}`));
    });
  }

  it('gives the configured series and age groups the store has, by their shown names, and the store genres', async () => {
    answerCatalogue();
    const { result } = await renderHook(() => useSearchMatchLists(), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current).toEqual({
      series: [{ name: 'Harry Potter', collectionGid: HARRY }],
      ageGroups: [{ name: '6-8 years', collectionGid: SIX_TO_EIGHT }],
      genres: [{ name: 'Manga', taxonomyValueGid: 'gid://shopify/TaxonomyValue/15730' }],
      commonWords: expect.arrayContaining(['the', 'and', 'of']),
    });
  });

  it('is null until both reads are in', async () => {
    answerCatalogue({ entries: 'hold' });
    const { result } = await renderHook(() => useSearchMatchLists(), {
      wrapper: withQueryClient(client),
    });

    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(result.current).toBeNull();
  });

  it('leaves a failed read’s lists empty, so only that kind of match is missed', async () => {
    answerCatalogue({ handles: 'fail' });
    const { result } = await renderHook(() => useSearchMatchLists(), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.series).toEqual([]);
    expect(result.current?.ageGroups).toEqual([]);
    expect(result.current?.genres).toHaveLength(1);
  });
});
