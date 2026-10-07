import {
  CATALOGUE_PAGE_SIZE,
  fetchBookCard,
  fetchCollectionBooksPage,
  resetCatalogueReportsForTests,
} from '@/shopify/catalogue';

import { bookProduct, EXAMPLES } from '../helpers/catalogue';

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
