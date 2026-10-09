import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { FlatList, Modal, ScrollView, StyleSheet, Switch } from 'react-native';

import BrowseScreen from '@/app/(tabs)/browse';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { BookListOptions, CollectionBooksPage, CollectionGenres } from '@/shopify/catalogue';
import type { GenreEntry } from '@/shopify/genres';
import { resetCatalogueReportsForTests } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct, EXAMPLES } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';

// Loads React Native's ScrollView and FlatList with the file, before any test's time limit (a
// cold Jest cache takes several seconds; see collection.test.tsx).
void ScrollView;
void FlatList;
// The controls' list and switch (P6-04), the same way.
void Modal;
void Switch;

// A book card opens its page through the router (P6-05).
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: () => undefined,
  router: { push: (href: unknown) => mockPush(href) },
}));

const mockReportUnexpected = jest.fn();
jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: (code: string) => mockReportUnexpected(code),
}));

// The Price list's labels are built from the store configuration (P6-08, D-104).
const STORE_CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };
let mockStoreConfig: () => typeof STORE_CONFIG = () => STORE_CONFIG;
jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => mockStoreConfig(),
}));

// "Try again" re-reads the network before it refetches (D-082).
const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

type BooksOptions = { handle: string; after: string | null; list: BookListOptions };
type GenresOptions = { handle: string; available: boolean };

// Every list is a collection (D-100): all books are the all-books collection.
const mockFetchBooks = jest.fn<Promise<CollectionBooksPage>, [BooksOptions]>();
const mockFetchHandles = jest.fn<Promise<ReadonlySet<string>>, []>();
const mockFetchGenres = jest.fn<Promise<CollectionGenres>, [GenresOptions]>();
const mockFetchEntries = jest.fn<Promise<readonly GenreEntry[]>, []>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchCollectionBooksPage: (options: BooksOptions) => mockFetchBooks(options),
  fetchCollectionHandles: () => mockFetchHandles(),
  fetchCollectionGenres: (options: GenresOptions) => mockFetchGenres(options),
  fetchGenreEntries: () => mockFetchEntries(),
}));

const ALL_BOOKS = 'all-books';
/** The book reads for all books, and for groups. */
const allCalls = () =>
  mockFetchBooks.mock.calls.map(([options]) => options).filter((o) => o.handle === ALL_BOOKS);
const groupCalls = () =>
  mockFetchBooks.mock.calls.map(([options]) => options).filter((o) => o.handle !== ALL_BOOKS);

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(product: ReturnType<typeof bookProduct>): BookCard {
  const result = toBookCard(product, CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

// The development store's collections (D-076): the 5 age groups, 5 of Home's 15 series, 3 of the
// longer list's series, a series in neither list, and all-books.
const DEV_STORE_HANDLES = new Set([
  'early-readers',
  'emerging-readers',
  'junior-readers',
  'pre-teen-readers',
  'teenage-readers',
  'wimpy-kid-series',
  'harry-potter-series',
  'tintin-series',
  'geronimo-stilton',
  'read-it-yourself',
  'my-hero-academia',
  'secret-seven-series',
  'cat-kid-comic-club',
  'manga-collections',
  ALL_BOOKS,
]);

// Genres as the development store gives them (gate, 8 October 2026). Shopify labels 15730
// "Design" and 15732 "Drama"; the store calls them Manga and Realistic fiction (D-102).
const gid = (id: number) => `gid://shopify/TaxonomyValue/${id}`;
const genreFilter = (id: number) => ({ namespace: 'shopify', key: 'genre', value: gid(id) });
const genreValue = (id: number, count: number) => ({
  count,
  input: JSON.stringify({ taxonomyMetafield: genreFilter(id) }),
});
const MANGA = 15730;
const FANTASY = 20853;
const REALISTIC = 15732;
const ENTRIES: readonly GenreEntry[] = [
  { label: 'Realistic fiction', taxonomyReference: gid(REALISTIC) },
  { label: 'Manga', taxonomyReference: gid(MANGA) },
  { label: 'Fantasy', taxonomyReference: gid(FANTASY) },
];

function genresOf({ handle }: GenresOptions): CollectionGenres {
  // junior-readers has no manga (as on the development store).
  return handle === 'junior-readers'
    ? {
        kind: 'found',
        locale: 'en-IN',
        values: [genreValue(FANTASY, 7), genreValue(REALISTIC, 12)],
      }
    : {
        kind: 'found',
        locale: 'en-IN',
        values: [genreValue(MANGA, 4), genreValue(FANTASY, 13), genreValue(REALISTIC, 14)],
      };
}

// 26 books, so 20 and then 6.
const ALL = Array.from({ length: 26 }, (_, index) =>
  card(bookProduct({ handle: `book-${index + 1}`, title: `Book ${index + 1}` })),
);

function booksPage({ handle, after }: BooksOptions): CollectionBooksPage {
  if (handle === ALL_BOOKS) {
    const start = after === null ? 0 : 20;
    return {
      kind: 'found',
      title: 'All books',
      books: ALL.slice(start, start + 20),
      nextCursor: after === null ? 'end-0' : null,
    };
  }
  return {
    kind: 'found',
    title: handle,
    books: [card(bookProduct({ handle: `${handle}-1`, title: `First of ${handle}` }))],
    nextCursor: null,
  };
}

/** Pages for all books from a function of the list, for the availability tests. */
function allBooksWith(books: (list: BookListOptions) => readonly BookCard[]) {
  mockFetchBooks.mockImplementation(async (options) =>
    options.handle === ALL_BOOKS
      ? { kind: 'found', title: 'All books', books: books(options.list), nextCursor: null }
      : booksPage(options),
  );
}

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });
const AVAILABLE_EMPTY =
  'No books available right now. Switch off Available now to see rented-out books.';

let client: QueryClient;

async function renderScreen({ settle = true }: { settle?: boolean } = {}) {
  await render(<BrowseScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
  await screen.findByRole('button', { name: 'Age group' });
  if (settle) await genreSettled();
}

/** Waits until the books for the current list are in, so no update lands after a test. */
async function booksSettled() {
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

/**
 * Waits until the Genre button has settled: enabled, or not drawn. Every screen reads its genre
 * list as well as its books; without this, a test can end while that read is still landing.
 */
async function genreSettled() {
  await waitFor(() =>
    expect(screen.queryByTestId('genre')?.props.accessibilityState?.disabled ?? false).toBe(false),
  );
}

function listData(): readonly BookCard[] {
  return (screen.getByTestId('browse-books').props as { data: readonly BookCard[] }).data;
}

async function choose(button: RegExp | string, option: string) {
  await fireEvent.press(screen.getByRole('button', { name: button }));
  await fireEvent.press(screen.getByRole('button', { name: option }));
}

const CLEAR = 'Clear filters, show all books';

/** The Genre button, enabled or not. */
function genreButton() {
  return screen.getByTestId('genre');
}

/** The filter buttons in the row, in the order they are drawn, by their own name. */
function filterButtonNames(): string[] {
  return screen
    .queryAllByTestId(/^(age-group|genre|price|series)$/)
    .map((button) => (button.props.accessibilityLabel as string).split(',')[0] ?? '');
}

/** The genre reads, without the cancel signal. */
function genreReads(): { handle: string; available: boolean }[] {
  return mockFetchGenres.mock.calls.map(([{ handle, available }]) => ({ handle, available }));
}

/** Waits until the Genre list has loaded for the current list. */
async function genreReady() {
  await waitFor(() =>
    expect(screen.getByTestId('genre').props.accessibilityState.disabled).toBe(false),
  );
}

beforeEach(() => {
  client = createTestQueryClient();
  mockFetchBooks.mockReset().mockImplementation(async (options) => booksPage(options));
  mockFetchHandles.mockReset().mockResolvedValue(DEV_STORE_HANDLES);
  mockFetchGenres.mockReset().mockImplementation(async (options) => genresOf(options));
  mockFetchEntries.mockReset().mockResolvedValue(ENTRIES);
  mockReportUnexpected.mockReset();
  resetCatalogueReportsForTests();
  mockRecheckNetwork.mockClear();
  mockPush.mockReset();
});

afterEach(async () => {
  await tearDownQueryClient(client);
  onlineManager.setOnline(true);
});

it('opens the book page when a card is tapped (P6-05)', async () => {
  await renderScreen();

  await fireEvent.press(screen.getByTestId('book-card-open-book-2'));

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/book/[handle]',
    params: { handle: 'book-2' },
  });
});

describe('Browse, "Books for Rent" (P6-04)', () => {
  it('opens on all books (the all-books collection, D-100), "Available now" on, A-Z, 20 at a time', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Books for Rent' })).toBeOnTheScreen();
    expect(allCalls()[0]).toMatchObject({
      after: null,
      list: { available: true, sort: 'title-ascending', genre: null, maxPrice: null },
    });
    expect(groupCalls()).toEqual([]);
    expect(screen.getByRole('switch', { name: 'Available now' }).props.value).toBe(true);
    expect(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' })).toBeOnTheScreen();
    expect(listData()).toHaveLength(20);
  });

  it('offers no Featured sort for all books', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' }));

    expect(screen.queryByRole('button', { name: 'Featured' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Best selling' })).toBeOnTheScreen();
  });

  it('draws Age group, Genre, Price and Series, in that order (D-104)', async () => {
    await renderScreen();
    await waitFor(() => expect(genreButton().props.accessibilityState.disabled).toBe(false));

    expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Price', 'Series']);
  });

  it('offers only the configured collections the store has (D-076)', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Series' }));

    for (const label of ['Wimpy Kid', 'Harry Potter', 'Tintin', 'Geronimo Stilton']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Dog Man' })).not.toBeOnTheScreen();
  });

  it("lists Home's series first, then the longer list's, only those that exist (D-103)", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Series' }));

    const list = screen.getByTestId('series-list');
    const names = within(list)
      .getAllByRole('button')
      .map((button) => button.props.accessibilityLabel as string)
      .filter((name) => name !== 'Close');
    expect(names).toEqual([
      'Wimpy Kid',
      'Harry Potter',
      'Tintin',
      'Geronimo Stilton',
      'Read It Yourself',
      'Cat Kid Comic Club',
      'My Hero Academia',
      'Secret Seven',
    ]);
    // A collection the store has but neither list names is not offered.
    expect(screen.queryByRole('button', { name: /Manga Collections/ })).not.toBeOnTheScreen();
  });

  it('reads a series from the longer list by its handle', async () => {
    await renderScreen();

    await choose('Series', 'My Hero Academia');

    expect(await screen.findByText('First of my-hero-academia')).toBeOnTheScreen();
    expect(groupCalls().at(-1)?.handle).toBe('my-hero-academia');
  });

  it('draws no group button until the store has said which collections exist', async () => {
    mockFetchHandles.mockImplementation(() => new Promise(() => undefined));

    await render(<BrowseScreen />, { wrapper: withScreen(client) });
    await waitFor(() => expect(listData()).toHaveLength(20));

    expect(screen.queryByRole('button', { name: 'Age group' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Series' })).not.toBeOnTheScreen();
  });

  it('reads the chosen age group with Featured, and shows it on its button', async () => {
    await renderScreen();

    await choose('Age group', '9-10 years');

    await waitFor(() =>
      expect(groupCalls().at(-1)).toMatchObject({
        handle: 'junior-readers',
        after: null,
        list: { available: true, sort: 'featured', genre: null, maxPrice: null },
      }),
    );
    expect(await screen.findByText('First of junior-readers')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Age group, 9-10 years' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sort, Featured' })).toBeOnTheScreen();
  });

  it('lets a series replace an age group: one group at a time', async () => {
    await renderScreen();
    await choose('Age group', '9-10 years');
    await screen.findByText('First of junior-readers');

    await choose('Series', 'Harry Potter');

    expect(await screen.findByText('First of harry-potter-series')).toBeOnTheScreen();
    expect(groupCalls().at(-1)?.handle).toBe('harry-potter-series');
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Series, Harry Potter' })).toBeOnTheScreen();
    expect(screen.queryByText('First of junior-readers')).not.toBeOnTheScreen();
  });

  it('"Clear" returns to all books', async () => {
    await renderScreen();
    await choose('Age group', '9-10 years');
    await screen.findByText('First of junior-readers');

    await fireEvent.press(screen.getByRole('button', { name: CLEAR }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Clear/ })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' })).toBeOnTheScreen();
  });

  it('keeps a sort the customer picked when the group changes', async () => {
    await renderScreen();
    await choose('Sort, Alphabetically, A-Z', 'Price, high to low');
    await waitFor(() =>
      expect(allCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'price-descending',
        genre: null,
        maxPrice: null,
      }),
    );

    await choose('Age group', '9-10 years');

    await waitFor(() =>
      expect(groupCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'price-descending',
        genre: null,
        maxPrice: null,
      }),
    );
    expect(screen.getByRole('button', { name: 'Sort, Price, high to low' })).toBeOnTheScreen();
  });

  it('turns a picked Featured into A-Z on return to all books', async () => {
    await renderScreen();
    await choose('Age group', '9-10 years');
    await screen.findByText('First of junior-readers');
    await choose('Sort, Featured', 'Featured');

    await fireEvent.press(screen.getByRole('button', { name: CLEAR }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(allCalls().at(-1)?.list.sort).toBe('title-ascending');
    expect(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' })).toBeOnTheScreen();
  });

  it('shows rented-out books with their badge and no button when "Available now" is off', async () => {
    allBooksWith((list) =>
      list.available
        ? [card(EXAMPLES.orderableAtZeroStock())]
        : [card(EXAMPLES.orderableAtZeroStock()), card(EXAMPLES.rentedOut())],
    );
    await renderScreen();
    // On means Shopify's availableForSale: a book orderable at zero stock is included.
    expect(screen.getByText('Harry Potter and the Deathly Hallows')).toBeOnTheScreen();
    expect(screen.queryByText('The Gruffalo')).not.toBeOnTheScreen();

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

    expect(await screen.findByText('The Gruffalo')).toBeOnTheScreen();
    expect(allCalls().at(-1)?.list).toEqual({
      available: false,
      sort: 'title-ascending',
      genre: null,
      maxPrice: null,
    });
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    // No cart or notify-me button until they are wired (D-081).
    expect(screen.queryByRole('button', { name: /cart|Notify/ })).not.toBeOnTheScreen();
  });

  it('says how to see rented-out books when nothing is available, and "No books here yet." when off', async () => {
    allBooksWith(() => []);
    await renderScreen();

    expect(screen.getByText(AVAILABLE_EMPTY)).toBeOnTheScreen();

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

    expect(await screen.findByText('No books here yet.')).toBeOnTheScreen();
    expect(screen.queryByText(AVAILABLE_EMPTY)).not.toBeOnTheScreen();
  });

  it('shows 20 books, then 26 after "Load more", and then no button', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(listData()).toHaveLength(26));
    expect(allCalls().map((options) => options.after)).toEqual([null, 'end-0']);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
  });

  it('says it is offline, with "Try again", and keeps its controls', async () => {
    onlineManager.setOnline(false);

    await render(<BrowseScreen />, { wrapper: withScreen(client) });

    expect(
      await screen.findByText("You're offline. Check your connection and try again."),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Available now' })).toBeOnTheScreen();
    expect(mockFetchBooks).not.toHaveBeenCalled();
  });

  it('shows a thin notice over saved books when it goes offline', async () => {
    await renderScreen();

    await act(async () => {
      onlineManager.setOnline(false);
    });

    expect(await screen.findByText("You're offline. Showing saved books.")).toBeOnTheScreen();
    expect(listData()).toHaveLength(20);
  });

  it('says something went wrong, and "Try again" re-reads the network, then reloads', async () => {
    mockFetchBooks.mockRejectedValueOnce(HTTP_ERROR);

    await render(<BrowseScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(mockRecheckNetwork).toHaveBeenCalledTimes(1);
    expect(mockRecheckNetwork.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchBooks.mock.invocationCallOrder[1] ?? 0,
    );
  });

  it('says a group is not available when the store removed it after listing', async () => {
    mockFetchBooks.mockImplementation(async (options) =>
      options.handle === 'junior-readers' ? { kind: 'not-found' } : booksPage(options),
    );
    await renderScreen();

    await choose('Age group', '9-10 years');

    expect(await screen.findByText('This collection is not available.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: CLEAR })).toBeOnTheScreen();
  });

  it('says all books are not available when the store has no all-books collection', async () => {
    mockFetchBooks.mockImplementation(async (options) =>
      options.handle === ALL_BOOKS ? { kind: 'not-found' } : booksPage(options),
    );
    await render(<BrowseScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('This collection is not available.')).toBeOnTheScreen();
  });
});

describe('Genre (P6-07, D-101, D-102)', () => {
  const genreList = () => screen.getByTestId('genre-list');
  const genreNames = () =>
    within(genreList())
      .getAllByRole('button')
      .map((button) => button.props.accessibilityLabel as string)
      .filter((name) => name !== 'Close');

  async function readyScreen() {
    await renderScreen();
    await waitFor(() => expect(genreButton().props.accessibilityState.disabled).toBe(false));
  }

  it('lists "All genres", then the store\'s names A-Z, with no counts and no Shopify names', async () => {
    await readyScreen();

    await fireEvent.press(genreButton());

    expect(genreNames()).toEqual(['All genres', 'Fantasy', 'Manga', 'Realistic fiction']);
    expect(within(genreList()).queryByText(/Design|Drama|\d/)).not.toBeOnTheScreen();
    expect(
      within(genreList()).getByRole('button', { name: 'All genres' }).props.accessibilityState,
    ).toEqual({ selected: true });
  });

  it('reads the genre list of the current list: all books, with "Available now"', async () => {
    await readyScreen();

    expect(genreReads()).toEqual([{ handle: ALL_BOOKS, available: true }]);
  });

  it('lists only the books of the chosen genre, and shows it on the button', async () => {
    await readyScreen();

    await choose('Genre', 'Manga');

    await waitFor(() =>
      expect(allCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'title-ascending',
        genre: genreFilter(MANGA),
        maxPrice: null,
      }),
    );
    expect(screen.getByRole('button', { name: 'Genre, Manga' })).toBeOnTheScreen();
    expect(screen.getByText('Genre: Manga')).toBeOnTheScreen();
  });

  it('combines with an age group, "Available now" and the sort, and stays when they change', async () => {
    await readyScreen();
    await choose('Genre', 'Fantasy');

    await choose('Age group', '9-10 years');
    await waitFor(() =>
      expect(groupCalls().at(-1)).toMatchObject({
        handle: 'junior-readers',
        list: { available: true, sort: 'featured', genre: genreFilter(FANTASY), maxPrice: null },
      }),
    );
    // The genre list follows the group.
    await waitFor(() =>
      expect(genreReads().at(-1)).toEqual({
        handle: 'junior-readers',
        available: true,
      }),
    );

    await genreReady();
    await choose('Sort, Featured', 'Price, low to high');
    await waitFor(() =>
      expect(groupCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'price-ascending',
        genre: genreFilter(FANTASY),
        maxPrice: null,
      }),
    );

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);
    await waitFor(() =>
      expect(groupCalls().at(-1)?.list).toEqual({
        available: false,
        sort: 'price-ascending',
        genre: genreFilter(FANTASY),
        maxPrice: null,
      }),
    );
    await waitFor(() =>
      expect(genreReads().at(-1)).toEqual({
        handle: 'junior-readers',
        available: false,
      }),
    );
    expect(screen.getByRole('button', { name: 'Genre, Fantasy' })).toBeOnTheScreen();
  });

  it('combines with a series', async () => {
    await readyScreen();
    await choose('Series', 'Harry Potter');
    await screen.findByText('First of harry-potter-series');
    await genreReady();

    await choose('Genre', 'Fantasy');

    await waitFor(() =>
      expect(groupCalls().at(-1)).toMatchObject({
        handle: 'harry-potter-series',
        list: { genre: genreFilter(FANTASY), maxPrice: null },
      }),
    );
  });

  it('keeps a chosen genre in the list, marked, when the new list has none of its books', async () => {
    await readyScreen();
    await choose('Genre', 'Manga');

    // junior-readers has no manga.
    await choose('Age group', '9-10 years');
    await waitFor(() => expect(genreReads().at(-1)?.handle).toBe('junior-readers'));
    await waitFor(() => expect(genreButton().props.accessibilityState.disabled).toBe(false));

    await fireEvent.press(genreButton());

    expect(genreNames()).toEqual(['All genres', 'Fantasy', 'Manga', 'Realistic fiction']);
    expect(
      within(genreList()).getByRole('button', { name: 'Manga' }).props.accessibilityState,
    ).toEqual({ selected: true });
  });

  it('"All genres" returns to every genre', async () => {
    await readyScreen();
    await choose('Genre', 'Manga');
    await waitFor(() => expect(allCalls().at(-1)?.list.genre).toEqual(genreFilter(MANGA)));

    await choose('Genre, Manga', 'All genres');

    // The list of every genre is the one read first, still in the cache.
    expect(await screen.findByRole('button', { name: 'Genre' })).toBeOnTheScreen();
    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(listData()).toHaveLength(20);
    expect(allCalls().filter((options) => options.list.genre === null)).toHaveLength(1);
  });

  it("names the genre in the empty message (owner's wording)", async () => {
    allBooksWith((list) => (list.genre === null ? ALL.slice(0, 20) : []));
    await readyScreen();

    await choose('Genre', 'Manga');

    expect(
      await screen.findByText(
        'No Manga books available right now. Switch off Available now to see rented-out books, or choose another genre.',
      ),
    ).toBeOnTheScreen();

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

    expect(await screen.findByText('No Manga books here. Choose another genre.')).toBeOnTheScreen();
  });

  it("closes the list on Android's back button and on a tap outside, without changing the genre", async () => {
    await readyScreen();
    await choose('Genre', 'Manga');
    await waitFor(() => expect(allCalls().at(-1)?.list.genre).toEqual(genreFilter(MANGA)));
    const reads = mockFetchBooks.mock.calls.length;

    await fireEvent.press(genreButton());
    expect(screen.getByRole('button', { name: 'All genres' })).toBeOnTheScreen();
    // Android's back button reaches an open Modal as onRequestClose.
    await fireEvent(genreList(), 'requestClose');
    expect(screen.queryByRole('button', { name: 'All genres' })).not.toBeOnTheScreen();

    await fireEvent.press(genreButton());
    await fireEvent.press(screen.getByTestId('genre-outside'));
    expect(screen.queryByRole('button', { name: 'All genres' })).not.toBeOnTheScreen();

    expect(screen.getByRole('button', { name: 'Genre, Manga' })).toBeOnTheScreen();
    expect(mockFetchBooks.mock.calls.length).toBe(reads);
  });

  describe('"Clear" (owner, P6-07 plan review)', () => {
    it('shows when only a genre is chosen', async () => {
      await readyScreen();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeOnTheScreen();

      await choose('Genre', 'Manga');

      expect(screen.getByRole('button', { name: CLEAR })).toBeOnTheScreen();
      // Ends once the Manga list is in, so no update lands after the test.
      await waitFor(() => expect(allCalls().at(-1)?.list.genre).toEqual(genreFilter(MANGA)));
      await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
      expect(listData()).toHaveLength(20);
    });

    it('resets the group and the genre, and keeps "Available now" and the sort', async () => {
      await readyScreen();
      await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);
      await choose('Sort, Alphabetically, A-Z', 'Price, high to low');
      await choose('Age group', '9-10 years');
      await genreReady();
      await choose('Genre', 'Fantasy');
      await waitFor(() => expect(groupCalls().at(-1)?.list.genre).toEqual(genreFilter(FANTASY)));

      await fireEvent.press(screen.getByRole('button', { name: CLEAR }));

      await waitFor(() =>
        expect(allCalls().at(-1)?.list).toEqual({
          available: false,
          sort: 'price-descending',
          genre: null,
          maxPrice: null,
        }),
      );
      expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Genre' })).toBeOnTheScreen();
      expect(screen.getByRole('switch', { name: 'Available now' }).props.value).toBe(false);
      expect(screen.getByRole('button', { name: 'Sort, Price, high to low' })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeOnTheScreen();
    });
  });

  describe('the Genre button keeps its place (owner, P6-07 plan review)', () => {
    it('is drawn but disabled while its list loads; the buttons do not move when it is ready', async () => {
      let entriesReady: (entries: readonly GenreEntry[]) => void = () => undefined;
      mockFetchEntries.mockImplementation(
        () =>
          new Promise((resolve) => {
            entriesReady = resolve;
          }),
      );
      await renderScreen({ settle: false });

      expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Price', 'Series']);
      expect(genreButton().props.accessibilityState).toEqual({ disabled: true });
      await fireEvent.press(genreButton());
      expect(screen.queryByRole('button', { name: 'All genres' })).not.toBeOnTheScreen();

      await act(async () => {
        entriesReady(ENTRIES);
      });

      await waitFor(() =>
        expect(genreButton().props.accessibilityState).toEqual({ disabled: false }),
      );
      expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Price', 'Series']);
    });

    it('is removed when the list is known to be empty', async () => {
      mockFetchGenres.mockResolvedValue({ kind: 'found', locale: 'en-IN', values: [] });
      await renderScreen();

      await waitFor(() => expect(filterButtonNames()).toEqual(['Age group', 'Price', 'Series']));
    });

    it('is removed when the genre entries cannot be listed: no Shopify name is ever shown', async () => {
      mockFetchEntries.mockRejectedValue(HTTP_ERROR);
      await renderScreen();

      await waitFor(() => expect(filterButtonNames()).toEqual(['Age group', 'Price', 'Series']));
      expect(screen.queryByText(/Design|Drama/)).not.toBeOnTheScreen();
    });

    it('is removed when the genre values cannot be read', async () => {
      mockFetchGenres.mockRejectedValue(HTTP_ERROR);
      await renderScreen();

      await waitFor(() => expect(filterButtonNames()).toEqual(['Age group', 'Price', 'Series']));
      // The books still show.
      expect(listData()).toHaveLength(20);
    });

    it("stays, with its genre, when a chosen genre's new list cannot be read", async () => {
      await readyScreen();
      await choose('Genre', 'Manga');
      mockFetchGenres.mockRejectedValue(HTTP_ERROR);

      await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

      await waitFor(() =>
        expect(genreReads().at(-1)).toEqual({
          handle: ALL_BOOKS,
          available: false,
        }),
      );
      await waitFor(() =>
        expect(genreButton().props.accessibilityState).toEqual({ disabled: false }),
      );
      expect(screen.getByRole('button', { name: 'Genre, Manga' })).toBeOnTheScreen();
      await fireEvent.press(genreButton());
      expect(genreNames()).toEqual(['All genres', 'Manga']);
    });
  });
});

describe('Price (P6-08, D-104)', () => {
  const priceList = () => screen.getByTestId('price-list');
  const priceButton = () => screen.getByTestId('price');
  const priceOptions = () =>
    within(priceList())
      .getAllByRole('button')
      .filter((button) => button.props.accessibilityLabel !== 'Close');

  it('lists "All prices", then up to ₹34, ₹49 and ₹74, with "All prices" marked', async () => {
    await renderScreen();

    await fireEvent.press(priceButton());

    expect(priceOptions().map((option) => option.props.accessibilityLabel)).toEqual([
      'All prices',
      'Up to ₹34',
      'Up to ₹49',
      'Up to ₹74',
    ]);
    expect(priceOptions().map((option) => option.props.accessibilityState.selected)).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(priceButton().props.accessibilityState.disabled).toBe(false);
  });

  it('reads the chosen maximum, and shows it on the button and to the screen reader', async () => {
    allBooksWith((list) => (list.maxPrice === null ? ALL.slice(0, 20) : ALL.slice(0, 3)));
    await renderScreen();

    await choose('Price', 'Up to ₹49');

    await waitFor(() =>
      expect(allCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'title-ascending',
        genre: null,
        maxPrice: 49,
      }),
    );
    expect(screen.getByRole('button', { name: 'Price, up to ₹49' })).toBeOnTheScreen();
    expect(within(priceButton()).getByText('Price: Up to ₹49')).toBeOnTheScreen();
    await waitFor(() => expect(listData()).toHaveLength(3));
    await fireEvent.press(priceButton());
    expect(screen.getByRole('button', { name: 'Up to ₹49' }).props.accessibilityState).toEqual({
      selected: true,
    });

    // "All prices": every book again (the first list, already in the cache).
    await fireEvent.press(screen.getByRole('button', { name: 'All prices' }));
    await waitFor(() => expect(listData()).toHaveLength(20));
    expect(screen.getByRole('button', { name: 'Price' })).toBeOnTheScreen();
    await booksSettled();
  });

  it('combines with an age group, a genre, "Available now" and the sort, and stays when they change', async () => {
    await renderScreen();
    await choose('Price', 'Up to ₹74');
    await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(74));

    await choose('Age group', '9-10 years');
    await waitFor(() =>
      expect(groupCalls().at(-1)).toMatchObject({
        handle: 'junior-readers',
        list: { available: true, sort: 'featured', genre: null, maxPrice: 74 },
      }),
    );
    await genreReady();
    await choose('Genre', 'Fantasy');
    await waitFor(() =>
      expect(groupCalls().at(-1)?.list).toEqual({
        available: true,
        sort: 'featured',
        genre: genreFilter(FANTASY),
        maxPrice: 74,
      }),
    );
    await choose('Sort, Featured', 'Price, high to low');
    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

    await waitFor(() =>
      expect(groupCalls().at(-1)?.list).toEqual({
        available: false,
        sort: 'price-descending',
        genre: genreFilter(FANTASY),
        maxPrice: 74,
      }),
    );
    expect(screen.getByRole('button', { name: 'Price, up to ₹74' })).toBeOnTheScreen();
    await genreSettled();
    await booksSettled();
  });

  it('combines with a series', async () => {
    await renderScreen();
    await choose('Series', 'Harry Potter');
    await choose('Price', 'Up to ₹34');

    await waitFor(() =>
      expect(groupCalls().at(-1)).toMatchObject({
        handle: 'harry-potter-series',
        list: { maxPrice: 34 },
      }),
    );
    await genreSettled();
    await booksSettled();
  });

  it('does not change the Genre list: no genre read for a price (owner, P6-08 answer 2)', async () => {
    await renderScreen();
    const reads = genreReads();

    await choose('Price', 'Up to ₹34');
    await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(34));
    await booksSettled();

    expect(genreReads()).toEqual(reads);
    await fireEvent.press(genreButton());
    expect(
      within(screen.getByTestId('genre-list'))
        .getAllByRole('button')
        .map((button) => button.props.accessibilityLabel as string),
    ).toEqual(['Close', 'All genres', 'Fantasy', 'Manga', 'Realistic fiction']);
  });

  it("names the price in the empty message, alone and after a genre (owner's wording)", async () => {
    allBooksWith((list) => (list.maxPrice === null ? ALL.slice(0, 20) : []));
    await renderScreen();

    await choose('Price', 'Up to ₹34');
    expect(
      await screen.findByText(
        'No books up to ₹34 available right now. Switch off Available now to see rented-out books, or choose another price.',
      ),
    ).toBeOnTheScreen();

    await choose('Genre', 'Manga');
    expect(
      await screen.findByText(
        'No Manga books up to ₹34 available right now. Switch off Available now to see rented-out books, or choose another genre or price.',
      ),
    ).toBeOnTheScreen();

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);
    expect(
      await screen.findByText('No Manga books up to ₹34 here. Choose another genre or price.'),
    ).toBeOnTheScreen();

    await choose('Genre, Manga', 'All genres');
    expect(
      await screen.findByText('No books up to ₹34 here. Choose another price.'),
    ).toBeOnTheScreen();
    await genreSettled();
  });

  it("closes the list on Android's back button and on a tap outside, without changing the price", async () => {
    await renderScreen();
    await choose('Price', 'Up to ₹49');
    await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(49));
    await booksSettled();
    const reads = mockFetchBooks.mock.calls.length;

    await fireEvent.press(priceButton());
    expect(screen.getByRole('button', { name: 'All prices' })).toBeOnTheScreen();
    // Android's back button reaches an open Modal as onRequestClose.
    await fireEvent(priceList(), 'requestClose');
    expect(screen.queryByRole('button', { name: 'All prices' })).not.toBeOnTheScreen();

    await fireEvent.press(priceButton());
    await fireEvent.press(screen.getByTestId('price-outside'));
    expect(screen.queryByRole('button', { name: 'All prices' })).not.toBeOnTheScreen();

    expect(screen.getByRole('button', { name: 'Price, up to ₹49' })).toBeOnTheScreen();
    expect(mockFetchBooks.mock.calls.length).toBe(reads);
  });

  it('is not drawn when the store configuration cannot be read; the books still show', async () => {
    mockStoreConfig = () => {
      throw new Error('Missing or invalid store configuration');
    };
    try {
      await renderScreen();

      expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Series']);
      expect(listData()).toHaveLength(20);
      expect(mockReportUnexpected).toHaveBeenCalledWith('catalogue/price-options-unavailable');
    } finally {
      mockStoreConfig = () => STORE_CONFIG;
    }
  });

  describe('"Clear" (owner, P6-08 answer 6)', () => {
    it('shows when only a price is chosen', async () => {
      await renderScreen();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeOnTheScreen();

      await choose('Price', 'Up to ₹34');

      expect(screen.getByRole('button', { name: CLEAR })).toBeOnTheScreen();
      await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(34));
      await booksSettled();
    });

    it('resets the group, the genre and the price, and keeps "Available now" and the sort', async () => {
      await renderScreen();
      await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);
      await choose('Sort, Alphabetically, A-Z', 'Price, low to high');
      await choose('Age group', '9-10 years');
      await genreReady();
      await choose('Genre', 'Fantasy');
      await choose('Price', 'Up to ₹49');
      await waitFor(() =>
        expect(groupCalls().at(-1)?.list).toEqual({
          available: false,
          sort: 'price-ascending',
          genre: genreFilter(FANTASY),
          maxPrice: 49,
        }),
      );

      await fireEvent.press(screen.getByRole('button', { name: CLEAR }));

      await waitFor(() =>
        expect(allCalls().at(-1)?.list).toEqual({
          available: false,
          sort: 'price-ascending',
          genre: null,
          maxPrice: null,
        }),
      );
      expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Price', 'Series']);
      expect(screen.getByRole('button', { name: 'Price' })).toBeOnTheScreen();
      expect(screen.getByRole('switch', { name: 'Available now' }).props.value).toBe(false);
      expect(screen.getByRole('button', { name: 'Sort, Price, low to high' })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: CLEAR })).not.toBeOnTheScreen();
      await genreSettled();
      await booksSettled();
    });
  });
});

describe('one filter row (P6-08, D-105; architect, review of PR #20)', () => {
  const scroll = () => screen.getByTestId('filter-scroll');
  const row = () => screen.getByTestId('filter-row');

  it('puts every filter button in one row that scrolls sideways and never wraps', async () => {
    await renderScreen();

    expect(scroll().props.horizontal).toBe(true);
    for (const id of ['age-group', 'genre', 'price', 'series']) {
      expect(within(scroll()).getByTestId(id)).toBeOnTheScreen();
    }
    const content = StyleSheet.flatten(scroll().props.contentContainerStyle);
    expect(content.flexDirection).toBe('row');
    expect(content.flexWrap).toBeUndefined();
    expect(StyleSheet.flatten(row().props.style).flexWrap).toBeUndefined();
  });

  it('pins "Clear" at the right edge, outside the scrolling part, after it', async () => {
    await renderScreen();
    await choose('Price', 'Up to ₹74');

    const clear = screen.getByTestId('clear-filters');
    expect(within(scroll()).queryByTestId('clear-filters')).not.toBeOnTheScreen();
    expect(within(row()).getByTestId('clear-filters')).toBe(clear);
    const children = screen.queryAllByTestId(/^(filter-scroll|clear-filters)$/);
    expect(children.map((child) => child.props.testID)).toEqual(['filter-scroll', 'clear-filters']);
    // The scrolling part takes the width "Clear" leaves.
    expect(StyleSheet.flatten(scroll().props.style)).toMatchObject({ flexGrow: 1, flexShrink: 1 });
    await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(74));
    await booksSettled();
  });

  it('keeps the buttons left-aligned and in place when "Clear" appears and disappears', async () => {
    await renderScreen();
    const contentBefore = StyleSheet.flatten(scroll().props.contentContainerStyle);
    expect(contentBefore.justifyContent ?? 'flex-start').toBe('flex-start');

    await choose('Price', 'Up to ₹34');
    expect(screen.getByTestId('clear-filters')).toBeOnTheScreen();
    expect(StyleSheet.flatten(scroll().props.contentContainerStyle)).toEqual(contentBefore);
    expect(filterButtonNames()).toEqual(['Age group', 'Genre', 'Price', 'Series']);
    await waitFor(() => expect(allCalls().at(-1)?.list.maxPrice).toBe(34));
    await booksSettled();

    await fireEvent.press(screen.getByRole('button', { name: CLEAR }));
    expect(screen.queryByTestId('clear-filters')).not.toBeOnTheScreen();
    expect(StyleSheet.flatten(scroll().props.contentContainerStyle)).toEqual(contentBefore);
    expect(screen.getByRole('button', { name: 'Price' })).toBeOnTheScreen();
  });

  it('keeps "Available now" and the sort outside the row, below it', async () => {
    await renderScreen();

    expect(within(row()).queryByTestId('available-now')).not.toBeOnTheScreen();
    expect(within(row()).queryByTestId('sort')).not.toBeOnTheScreen();
    const order = screen
      .queryAllByTestId(/^(filter-row|available-now|sort)$/)
      .map((element) => element.props.testID);
    expect(order).toEqual(['filter-row', 'available-now', 'sort']);
  });
});

it('has a search button named "Search", at least 44 points square, that opens search (P6-06)', async () => {
  await renderScreen();
  const button = screen.getByRole('button', { name: 'Search' });
  const style = StyleSheet.flatten(button.props.style as object) as {
    minWidth?: number;
    minHeight?: number;
  };

  expect(style.minWidth).toBeGreaterThanOrEqual(44);
  expect(style.minHeight).toBeGreaterThanOrEqual(44);
  await fireEvent.press(button);
  expect(mockPush).toHaveBeenCalledWith('/search');
});
