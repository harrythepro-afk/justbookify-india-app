import {
  CATALOGUE_PAGE_SIZE,
  fetchAllBooksPage,
  fetchBook,
  fetchBookCard,
  fetchCollectionBooksPage,
  fetchCollectionHandles,
  fetchSearchPage,
  resetCatalogueReportsForTests,
  SEARCH_BOOKS_QUERY,
} from '@/shopify/catalogue';

import { bookPageProduct, bookProduct, EXAMPLES, genre } from '../helpers/catalogue';

const mockQuery = jest.fn();
const mockReportUnexpected = jest.fn();

jest.mock('@/shopify/client', () => ({
  storefrontQuery: (...args: unknown[]) => mockQuery(...args),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: (code: string) => mockReportUnexpected(code),
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN' }),
}));

function collectionResponse(
  nodes: unknown[],
  pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
    hasNextPage: false,
    endCursor: null,
  },
) {
  return { collection: { title: 'Junior Readers', products: { pageInfo, nodes } } };
}

beforeEach(() => {
  mockQuery.mockReset();
  mockReportUnexpected.mockReset();
  resetCatalogueReportsForTests();
});

describe('fetchCollectionBooksPage', () => {
  it('asks for one page of 20 books by handle, with the cursor and the cancel signal', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));
    const signal = new AbortController().signal;

    await fetchCollectionBooksPage({ handle: 'junior-readers', after: 'cursor-1', signal });

    expect(CATALOGUE_PAGE_SIZE).toBe(20);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query CollectionBooks('), {
      variables: { handle: 'junior-readers', first: 20, after: 'cursor-1' },
      signal,
    });
  });

  it('maps the books and gives the next cursor while there is a next page', async () => {
    mockQuery.mockResolvedValue(
      collectionResponse([EXAMPLES.inStock(), EXAMPLES.rentedOut()], {
        hasNextPage: true,
        endCursor: 'cursor-2',
      }),
    );

    const page = await fetchCollectionBooksPage({ handle: 'junior-readers', after: null });

    expect(page).toMatchObject({ kind: 'found', title: 'Junior Readers', nextCursor: 'cursor-2' });
    expect(page.kind === 'found' && page.books.map((book) => book.handle)).toEqual([
      'the-diary-of-a-wimpy-kid-no-brainer',
      'the-gruffalo',
    ]);
  });

  it('gives no next cursor on the last page', async () => {
    mockQuery.mockResolvedValue(
      collectionResponse([], { hasNextPage: false, endCursor: 'cursor-3' }),
    );

    const page = await fetchCollectionBooksPage({ handle: 'junior-readers', after: 'cursor-2' });

    expect(page).toMatchObject({ kind: 'found', nextCursor: null });
  });

  it('gives a typed not-found result for a missing collection', async () => {
    mockQuery.mockResolvedValue({ collection: null });

    await expect(
      fetchCollectionBooksPage({ handle: 'no-such-collection', after: null }),
    ).resolves.toEqual({ kind: 'not-found' });
  });

  it('leaves out a book without a variant and reports it once per session, by code only', async () => {
    mockQuery.mockResolvedValue(
      collectionResponse([bookProduct({ noVariant: true }), EXAMPLES.inStock()]),
    );

    const first = await fetchCollectionBooksPage({ handle: 'junior-readers', after: null });
    await fetchCollectionBooksPage({ handle: 'junior-readers', after: null });

    expect(first.kind === 'found' && first.books).toHaveLength(1);
    expect(mockReportUnexpected).toHaveBeenCalledTimes(1);
    expect(mockReportUnexpected).toHaveBeenCalledWith('catalogue/book-without-variant');
  });

  it('fails the page when a price is in another currency', async () => {
    mockQuery.mockResolvedValue(collectionResponse([bookProduct({ currencyCode: 'BHD' })]));

    await expect(
      fetchCollectionBooksPage({ handle: 'junior-readers', after: null }),
    ).rejects.toMatchObject({ code: 'catalogue/currency-mismatch' });
  });
});

describe('fetchCollectionBooksPage with a sort and "Available now" (P6-04)', () => {
  it('sends the sort and the Availability filter when "Available now" is on', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'junior-readers',
      after: null,
      list: { available: true, sort: 'featured' },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      handle: 'junior-readers',
      first: 20,
      after: null,
      sortKey: 'COLLECTION_DEFAULT',
      reverse: false,
      filters: [{ available: true }],
    });
  });

  it('sends no filter when "Available now" is off, and a reversed sort', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'junior-readers',
      after: 'cursor-1',
      list: { available: false, sort: 'price-descending' },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      handle: 'junior-readers',
      first: 20,
      after: 'cursor-1',
      sortKey: 'PRICE',
      reverse: true,
      filters: null,
    });
  });
});

describe('fetchAllBooksPage (D-083)', () => {
  function productsResponse(
    nodes: unknown[],
    pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
      hasNextPage: false,
      endCursor: null,
    },
  ) {
    return { products: { pageInfo, nodes } };
  }

  it('reads one page of 20 from the root products query, available for sale, A-Z', async () => {
    mockQuery.mockResolvedValue(productsResponse([]));
    const signal = new AbortController().signal;

    await fetchAllBooksPage({
      after: null,
      list: { available: true, sort: 'title-ascending' },
      signal,
    });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query AllBooks('), {
      variables: {
        first: 20,
        after: null,
        sortKey: 'TITLE',
        reverse: false,
        query: 'available_for_sale:true',
      },
      signal,
    });
  });

  it('sends no search query when "Available now" is off', async () => {
    mockQuery.mockResolvedValue(productsResponse([]));

    await fetchAllBooksPage({
      after: 'cursor-1',
      list: { available: false, sort: 'created-descending' },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      first: 20,
      after: 'cursor-1',
      sortKey: 'CREATED_AT',
      reverse: true,
      query: null,
    });
  });

  it('maps the books, rented-out ones included, and gives the next cursor', async () => {
    mockQuery.mockResolvedValue(
      productsResponse([EXAMPLES.orderableAtZeroStock(), EXAMPLES.rentedOut()], {
        hasNextPage: true,
        endCursor: 'cursor-2',
      }),
    );

    const page = await fetchAllBooksPage({
      after: null,
      list: { available: false, sort: 'title-ascending' },
    });

    expect(page.nextCursor).toBe('cursor-2');
    expect(page.books.map((book) => [book.handle, book.availability])).toEqual([
      ['harry-potter-and-the-deathly-hallows-book-7', 'orderable-at-zero-stock'],
      ['the-gruffalo', 'rented-out'],
    ]);
  });

  it('gives no next cursor on the last page', async () => {
    mockQuery.mockResolvedValue(
      productsResponse([], { hasNextPage: false, endCursor: 'cursor-3' }),
    );

    const page = await fetchAllBooksPage({
      after: 'cursor-2',
      list: { available: true, sort: 'title-ascending' },
    });

    expect(page.nextCursor).toBeNull();
  });
});

describe('fetchSearchPage (P6-06, D-096)', () => {
  function searchResponse(
    nodes: unknown[],
    totalCount: number,
    pageInfo: { hasNextPage: boolean; endCursor: string | null } = {
      hasNextPage: false,
      endCursor: null,
    },
  ) {
    return { search: { totalCount, pageInfo, nodes } };
  }

  const product = (node: Record<string, unknown>) => ({ __typename: 'Product', ...node });

  it('reads one page of 20 books by relevance, rented-out books last, with the cancel signal', async () => {
    mockQuery.mockResolvedValue(searchResponse([], 0));
    const signal = new AbortController().signal;

    await fetchSearchPage({
      term: 'harry',
      after: null,
      search: { available: false, sort: 'relevance' },
      signal,
    });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query SearchBooks('), {
      variables: {
        query: 'harry',
        first: 20,
        after: null,
        sortKey: 'RELEVANCE',
        reverse: false,
        unavailableProducts: 'LAST',
      },
      signal,
    });
  });

  it('hides rented-out books with "Available now" on, and sends the price sort', async () => {
    mockQuery.mockResolvedValue(searchResponse([], 0));

    await fetchSearchPage({
      term: 'harry',
      after: 'cursor-1',
      search: { available: true, sort: 'price-descending' },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      query: 'harry',
      first: 20,
      after: 'cursor-1',
      sortKey: 'PRICE',
      reverse: true,
      unavailableProducts: 'HIDE',
    });
  });

  it('searches books only, matching the last word partly, as the website does', () => {
    expect(SEARCH_BOOKS_QUERY).toMatch(/types: \[PRODUCT\]/);
    expect(SEARCH_BOOKS_QUERY).toMatch(/prefix: LAST/);
    expect(SEARCH_BOOKS_QUERY).not.toMatch(/predictiveSearch|ARTICLE|PAGE/);
  });

  it('sends an untrusted term only as a variable, exactly as given', async () => {
    mockQuery.mockResolvedValue(searchResponse([], 0));
    const terms = ['"harry"', 'title:harry', '-harry', 'harry 😀', '") { id } #', 'a'.repeat(100)];

    for (const term of terms) {
      await fetchSearchPage({ term, after: null, search: { available: false, sort: 'relevance' } });
    }

    expect(mockQuery.mock.calls.map((call) => call[1].variables.query)).toEqual(terms);
    for (const call of mockQuery.mock.calls) expect(call[0]).toBe(SEARCH_BOOKS_QUERY);
  });

  it('maps the books with Shopify’s count and the next cursor, keeping only books', async () => {
    mockQuery.mockResolvedValue(
      searchResponse(
        [
          product(EXAMPLES.orderableAtZeroStock()),
          { __typename: 'Article' },
          { __typename: 'Page' },
          product(EXAMPLES.rentedOut()),
        ],
        27,
        { hasNextPage: true, endCursor: 'cursor-2' },
      ),
    );

    const page = await fetchSearchPage({
      term: 'harry',
      after: null,
      search: { available: false, sort: 'relevance' },
    });

    expect(page.totalCount).toBe(27);
    expect(page.nextCursor).toBe('cursor-2');
    expect(page.books.map((book) => [book.handle, book.availability])).toEqual([
      ['harry-potter-and-the-deathly-hallows-book-7', 'orderable-at-zero-stock'],
      ['the-gruffalo', 'rented-out'],
    ]);
  });

  it('gives no next cursor on the last page', async () => {
    mockQuery.mockResolvedValue(searchResponse([], 0, { hasNextPage: false, endCursor: 'c' }));

    const page = await fetchSearchPage({
      term: 'zzqxv',
      after: null,
      search: { available: true, sort: 'relevance' },
    });

    expect(page).toEqual({ books: [], totalCount: 0, nextCursor: null });
  });

  it('leaves out a book without a variant and reports it by code only', async () => {
    mockQuery.mockResolvedValue(searchResponse([product(bookProduct({ noVariant: true }))], 1));

    const page = await fetchSearchPage({
      term: 'harry',
      after: null,
      search: { available: false, sort: 'relevance' },
    });

    expect(page.books).toEqual([]);
    expect(mockReportUnexpected).toHaveBeenCalledWith('catalogue/book-without-variant');
  });

  it('passes a failure on to the cache', async () => {
    mockQuery.mockRejectedValue(new Error('down'));

    await expect(
      fetchSearchPage({
        term: 'harry',
        after: null,
        search: { available: false, sort: 'relevance' },
      }),
    ).rejects.toThrow('down');
  });
});

describe('fetchBookCard', () => {
  it('reads one book by handle with the cancel signal', async () => {
    mockQuery.mockResolvedValue({ product: EXAMPLES.rentedOut() });
    const signal = new AbortController().signal;

    const book = await fetchBookCard({ handle: 'the-gruffalo', signal });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query BookCardByHandle('), {
      variables: { handle: 'the-gruffalo' },
      signal,
    });
    expect(book).toMatchObject({ handle: 'the-gruffalo', orderable: false });
  });

  it('gives null for a book that is not published to the channel', async () => {
    mockQuery.mockResolvedValue({ product: null });

    await expect(fetchBookCard({ handle: 'the-giraffe-and-the-pelly-and-me' })).resolves.toBeNull();
  });
});

describe('fetchBook (P6-05)', () => {
  it('reads one book page by handle with the cancel signal', async () => {
    mockQuery.mockResolvedValue({
      product: bookPageProduct({
        handle: 'the-gruffalo',
        availableForSale: false,
        genres: [genre('Picture Book')],
      }),
    });
    const signal = new AbortController().signal;

    const page = await fetchBook({ handle: 'the-gruffalo', signal });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query BookPage('), {
      variables: { handle: 'the-gruffalo' },
      signal,
    });
    expect(page).toMatchObject({
      handle: 'the-gruffalo',
      orderable: false,
      genres: ['Picture Book'],
    });
  });

  it('gives null for a book that is not published to the channel', async () => {
    mockQuery.mockResolvedValue({ product: null });

    await expect(fetchBook({ handle: 'no-such-book-p6-05' })).resolves.toBeNull();
    expect(mockReportUnexpected).not.toHaveBeenCalled();
  });

  it('gives null for a book without a variant, reported once per session by code only', async () => {
    mockQuery.mockResolvedValue({ product: bookPageProduct({ noVariant: true }) });

    await expect(fetchBook({ handle: 'broken' })).resolves.toBeNull();
    await expect(fetchBook({ handle: 'broken' })).resolves.toBeNull();
    expect(mockReportUnexpected.mock.calls).toEqual([['catalogue/book-without-variant']]);
  });
});

describe('fetchCollectionHandles (D-076)', () => {
  function listing(handles: string[], hasNextPage = false, endCursor: string | null = null) {
    return {
      collections: {
        pageInfo: { hasNextPage, endCursor },
        nodes: handles.map((handle) => ({ handle })),
      },
    };
  }

  it('reads every handle in one request of 250, with the cancel signal', async () => {
    mockQuery.mockResolvedValueOnce(
      listing(['early-readers', 'harry-potter-series', 'tintin-series']),
    );
    const signal = new AbortController().signal;

    const handles = await fetchCollectionHandles({ signal });

    expect([...handles]).toEqual(['early-readers', 'harry-potter-series', 'tintin-series']);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0]?.[1]).toEqual({
      variables: { first: 250, after: null },
      signal,
    });
  });

  it('follows pageInfo when a store has more than one page', async () => {
    mockQuery
      .mockResolvedValueOnce(listing(['a', 'b'], true, 'cursor-1'))
      .mockResolvedValueOnce(listing(['c']));

    const handles = await fetchCollectionHandles({});

    expect([...handles]).toEqual(['a', 'b', 'c']);
    expect(
      mockQuery.mock.calls.map(
        (call) => (call[1] as { variables: { after: string | null } }).variables.after,
      ),
    ).toEqual([null, 'cursor-1']);
  });

  it('stops when Shopify says there is a next page but gives no cursor', async () => {
    mockQuery.mockResolvedValueOnce(listing(['a'], true, null));

    expect([...(await fetchCollectionHandles({}))]).toEqual(['a']);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('passes a failure on to the cache', async () => {
    mockQuery.mockRejectedValueOnce(new Error('boom'));

    await expect(fetchCollectionHandles({})).rejects.toThrow('boom');
  });
});
