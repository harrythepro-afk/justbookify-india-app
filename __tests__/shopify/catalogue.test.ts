import {
  CATALOGUE_PAGE_SIZE,
  fetchBook,
  fetchBookCard,
  fetchCollectionBooksPage,
  fetchCollectionGenres,
  fetchCollectionHandles,
  fetchGenreEntries,
  fetchSearchPage,
  reportCatalogueFaultOnce,
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
  return {
    collection: {
      id: 'gid://shopify/Collection/4242',
      title: 'Junior Readers',
      products: { pageInfo, nodes },
    },
  };
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

    expect(page).toMatchObject({
      kind: 'found',
      id: 'gid://shopify/Collection/4242',
      title: 'Junior Readers',
      nextCursor: 'cursor-2',
    });
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
      list: { available: true, sort: 'featured', genre: null, maxPrice: null },
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
      list: { available: false, sort: 'price-descending', genre: null, maxPrice: null },
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

const MANGA = {
  namespace: 'shopify',
  key: 'genre',
  value: 'gid://shopify/TaxonomyValue/15730',
};

describe('fetchCollectionBooksPage with a genre (P6-07, D-101)', () => {
  it('sends the genre first, then "Available now"', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'junior-readers',
      after: null,
      list: { available: true, sort: 'title-ascending', genre: MANGA, maxPrice: null },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables.filters).toEqual([
      { taxonomyMetafield: MANGA },
      { available: true },
    ]);
  });

  it('sends the genre alone when "Available now" is off', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'all-books',
      after: null,
      list: { available: false, sort: 'title-ascending', genre: MANGA, maxPrice: null },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables.filters).toEqual([{ taxonomyMetafield: MANGA }]);
  });
});

describe('fetchCollectionBooksPage with a price (P6-08, D-104)', () => {
  it('sends the genre, then the price as a maximum only, then "Available now"', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'junior-readers',
      after: null,
      list: { available: true, sort: 'featured', genre: MANGA, maxPrice: 49 },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables.filters).toEqual([
      { taxonomyMetafield: MANGA },
      { price: { max: 49 } },
      { available: true },
    ]);
  });

  it('sends the price alone when nothing else is chosen, with no minimum', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'all-books',
      after: null,
      list: { available: false, sort: 'price-descending', genre: null, maxPrice: 34 },
    });

    const filters = mockQuery.mock.calls[0]?.[1].variables.filters;
    expect(filters).toEqual([{ price: { max: 34 } }]);
    expect(filters[0].price).not.toHaveProperty('min');
  });

  it('sends the price with "Available now" and the sort', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'all-books',
      after: null,
      list: { available: true, sort: 'price-ascending', genre: null, maxPrice: 74 },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toMatchObject({
      sortKey: 'PRICE',
      reverse: false,
      filters: [{ price: { max: 74 } }, { available: true }],
    });
  });
});

describe("Browse's all books: the all-books collection (D-100, replaces D-083)", () => {
  it('reads one page of 20 from the all-books collection, available for sale, A-Z', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));
    const signal = new AbortController().signal;

    await fetchCollectionBooksPage({
      handle: 'all-books',
      after: null,
      list: { available: true, sort: 'title-ascending', genre: null, maxPrice: null },
      signal,
    });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query CollectionBooks('), {
      variables: {
        handle: 'all-books',
        first: 20,
        after: null,
        sortKey: 'TITLE',
        reverse: false,
        filters: [{ available: true }],
      },
      signal,
    });
  });

  it('sends no filter when "Available now" is off, with the collection date sort', async () => {
    mockQuery.mockResolvedValue(collectionResponse([]));

    await fetchCollectionBooksPage({
      handle: 'all-books',
      after: 'cursor-1',
      list: { available: false, sort: 'created-descending', genre: null, maxPrice: null },
    });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      handle: 'all-books',
      first: 20,
      after: 'cursor-1',
      sortKey: 'CREATED',
      reverse: true,
      filters: null,
    });
  });

  it('maps the books, rented-out ones included, and gives the next cursor', async () => {
    mockQuery.mockResolvedValue(
      collectionResponse([EXAMPLES.orderableAtZeroStock(), EXAMPLES.rentedOut()], {
        hasNextPage: true,
        endCursor: 'cursor-2',
      }),
    );

    const page = await fetchCollectionBooksPage({
      handle: 'all-books',
      after: null,
      list: { available: false, sort: 'title-ascending', genre: null, maxPrice: null },
    });

    if (page.kind !== 'found') throw new Error('expected a page');
    expect(page.nextCursor).toBe('cursor-2');
    expect(page.books.map((book) => [book.handle, book.availability])).toEqual([
      ['harry-potter-and-the-deathly-hallows-book-7', 'orderable-at-zero-stock'],
      ['the-gruffalo', 'rented-out'],
    ]);
  });

  it('gives no next cursor on the last page', async () => {
    mockQuery.mockResolvedValue(collectionResponse([], { hasNextPage: false, endCursor: 'c-3' }));

    const page = await fetchCollectionBooksPage({
      handle: 'all-books',
      after: 'cursor-2',
      list: { available: true, sort: 'title-ascending', genre: null, maxPrice: null },
    });

    expect(page).toMatchObject({ kind: 'found', nextCursor: null });
  });

  it('reports a missing all-books collection once, by code; another missing one is not reported', async () => {
    mockQuery.mockResolvedValue({ collection: null });

    const list = { available: true, sort: 'title-ascending', genre: null, maxPrice: null } as const;
    await expect(
      fetchCollectionBooksPage({ handle: 'all-books', after: null, list }),
    ).resolves.toEqual({ kind: 'not-found' });
    await fetchCollectionBooksPage({ handle: 'all-books', after: null, list });
    await fetchCollectionBooksPage({ handle: 'no-such-series', after: null, list });

    expect(mockReportUnexpected.mock.calls).toEqual([['catalogue/all-books-missing']]);
  });
});

describe('reportCatalogueFaultOnce', () => {
  it('reports each code once per session, by code only', () => {
    reportCatalogueFaultOnce('catalogue/genre-without-name');
    reportCatalogueFaultOnce('catalogue/genre-without-name');
    reportCatalogueFaultOnce('catalogue/genre-shared-value');

    expect(mockReportUnexpected.mock.calls).toEqual([
      ['catalogue/genre-without-name'],
      ['catalogue/genre-shared-value'],
    ]);
  });
});

describe('fetchCollectionGenres (P6-07, D-101)', () => {
  const genreFilter = {
    id: 'filter.v.t.shopify.genre',
    values: [
      {
        count: 4,
        input:
          '{"taxonomyMetafield":{"namespace":"shopify","key":"genre","value":"gid://shopify/TaxonomyValue/15730"}}',
      },
    ],
  };
  const availability = {
    id: 'filter.v.availability',
    values: [{ count: 29, input: '{"available":true}' }],
  };

  it('reads the collection\'s filters with "Available now" and keeps the Genre filter\'s values', async () => {
    mockQuery.mockResolvedValue({
      collection: { products: { filters: [availability, genreFilter] } },
    });
    const signal = new AbortController().signal;

    const genres = await fetchCollectionGenres({ handle: 'all-books', available: true, signal });

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('query CollectionGenres('), {
      variables: { handle: 'all-books', filters: [{ available: true }] },
      signal,
    });
    // The store's locale (EN, IN) comes with the values, for sorting the names (D-101).
    expect(genres).toEqual({ kind: 'found', values: genreFilter.values, locale: 'en-IN' });
  });

  it('sends no filter with "Available now" off', async () => {
    mockQuery.mockResolvedValue({ collection: { products: { filters: [genreFilter] } } });

    await fetchCollectionGenres({ handle: 'junior-readers', available: false });

    expect(mockQuery.mock.calls[0]?.[1].variables).toEqual({
      handle: 'junior-readers',
      filters: null,
    });
  });

  it("never reads Shopify's own value labels", async () => {
    mockQuery.mockResolvedValue({ collection: { products: { filters: [] } } });

    await fetchCollectionGenres({ handle: 'all-books', available: false });

    const query: string = mockQuery.mock.calls[0]?.[0];
    const values = query.slice(query.indexOf('values {'));
    expect(values).not.toMatch(/\blabel\b/);
  });

  it('gives no values when the collection has no Genre filter', async () => {
    mockQuery.mockResolvedValue({ collection: { products: { filters: [availability] } } });

    await expect(fetchCollectionGenres({ handle: 'all-books', available: true })).resolves.toEqual({
      kind: 'found',
      values: [],
      locale: 'en-IN',
    });
  });

  it('is not-found when the collection is missing', async () => {
    mockQuery.mockResolvedValue({ collection: null });

    await expect(fetchCollectionGenres({ handle: 'gone', available: true })).resolves.toEqual({
      kind: 'not-found',
    });
  });
});

describe('fetchGenreEntries (P6-07, D-102)', () => {
  const node = (label: string | null, reference: string | null) => ({
    label: label === null ? null : { value: label },
    taxonomyReference: reference === null ? null : { value: reference },
  });

  it('lists the shopify--genre entries, 250 a page, following pageInfo', async () => {
    mockQuery
      .mockResolvedValueOnce({
        metaobjects: {
          pageInfo: { hasNextPage: true, endCursor: 'c-1' },
          nodes: [node('Manga', 'gid://shopify/TaxonomyValue/15730')],
        },
      })
      .mockResolvedValueOnce({
        metaobjects: {
          pageInfo: { hasNextPage: false, endCursor: 'c-2' },
          nodes: [node(null, null)],
        },
      });
    const signal = new AbortController().signal;

    const entries = await fetchGenreEntries({ signal });

    expect(mockQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('query GenreEntries('), {
      variables: { type: 'shopify--genre', first: 250, after: null },
      signal,
    });
    expect(mockQuery.mock.calls[1]?.[1].variables.after).toBe('c-1');
    expect(entries).toEqual([
      { label: 'Manga', taxonomyReference: 'gid://shopify/TaxonomyValue/15730' },
      { label: null, taxonomyReference: null },
    ]);
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
        nodes: handles.map((handle, index) => ({
          id: `gid://shopify/Collection/${index + 1}`,
          handle,
        })),
      },
    };
  }

  it('reads every handle in one request of 250, with the cancel signal', async () => {
    mockQuery.mockResolvedValueOnce(
      listing(['early-readers', 'harry-potter-series', 'tintin-series']),
    );
    const signal = new AbortController().signal;

    const handles = await fetchCollectionHandles({ signal });

    expect([...handles]).toEqual([
      ['early-readers', 'gid://shopify/Collection/1'],
      ['harry-potter-series', 'gid://shopify/Collection/2'],
      ['tintin-series', 'gid://shopify/Collection/3'],
    ]);
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

    expect([...handles.keys()]).toEqual(['a', 'b', 'c']);
    expect(
      mockQuery.mock.calls.map(
        (call) => (call[1] as { variables: { after: string | null } }).variables.after,
      ),
    ).toEqual([null, 'cursor-1']);
  });

  it('stops when Shopify says there is a next page but gives no cursor', async () => {
    mockQuery.mockResolvedValueOnce(listing(['a'], true, null));

    expect([...(await fetchCollectionHandles({})).keys()]).toEqual(['a']);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('passes a failure on to the cache', async () => {
    mockQuery.mockRejectedValueOnce(new Error('boom'));

    await expect(fetchCollectionHandles({})).rejects.toThrow('boom');
  });
});
