import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList, Modal, ScrollView, Switch } from 'react-native';

import BrowseScreen from '@/app/(tabs)/browse';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { AllBooksPage, BookListOptions, CollectionBooksPage } from '@/shopify/catalogue';
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

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

// "Try again" re-reads the network before it refetches (D-082).
const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

type AllOptions = { after: string | null; list: BookListOptions };
type GroupOptions = { handle: string; after: string | null; list?: BookListOptions };

const mockFetchAll = jest.fn<Promise<AllBooksPage>, [AllOptions]>();
const mockFetchGroup = jest.fn<Promise<CollectionBooksPage>, [GroupOptions]>();
const mockFetchHandles = jest.fn<Promise<ReadonlySet<string>>, []>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchAllBooksPage: (options: AllOptions) => mockFetchAll(options),
  fetchCollectionBooksPage: (options: GroupOptions) => mockFetchGroup(options),
  fetchCollectionHandles: () => mockFetchHandles(),
}));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(product: ReturnType<typeof bookProduct>): BookCard {
  const result = toBookCard(product, CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

// The development store's collections: the 5 age groups and 5 of Home's 15 series (D-076).
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
]);

// 26 books, so 20 and then 6.
const ALL = Array.from({ length: 26 }, (_, index) =>
  card(bookProduct({ handle: `book-${index + 1}`, title: `Book ${index + 1}` })),
);

function allPage({ after }: AllOptions): AllBooksPage {
  const start = after === null ? 0 : 20;
  return { books: ALL.slice(start, start + 20), nextCursor: after === null ? 'end-0' : null };
}

function groupPage({ handle }: GroupOptions): CollectionBooksPage {
  return {
    kind: 'found',
    title: handle,
    books: [card(bookProduct({ handle: `${handle}-1`, title: `First of ${handle}` }))],
    nextCursor: null,
  };
}

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });
const AVAILABLE_EMPTY =
  'No books available right now. Switch off Available now to see rented-out books.';

let client: QueryClient;

async function renderScreen() {
  await render(<BrowseScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
  await screen.findByRole('button', { name: 'Age group' });
}

function listData(): readonly BookCard[] {
  return (screen.getByTestId('browse-books').props as { data: readonly BookCard[] }).data;
}

async function choose(button: RegExp | string, option: string) {
  await fireEvent.press(screen.getByRole('button', { name: button }));
  await fireEvent.press(screen.getByRole('button', { name: option }));
}

beforeEach(() => {
  client = createTestQueryClient();
  mockFetchAll.mockReset().mockImplementation(async (options) => allPage(options));
  mockFetchGroup.mockReset().mockImplementation(async (options) => groupPage(options));
  mockFetchHandles.mockReset().mockResolvedValue(DEV_STORE_HANDLES);
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
  it('opens on all books, "Available now" on, A-Z, 20 at a time', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Books for Rent' })).toBeOnTheScreen();
    expect(mockFetchAll.mock.calls[0]?.[0]).toMatchObject({
      after: null,
      list: { available: true, sort: 'title-ascending' },
    });
    expect(mockFetchGroup).not.toHaveBeenCalled();
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

  it('draws Age group and Series only, with no Genre button', async () => {
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Series' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Genre/ })).not.toBeOnTheScreen();
  });

  it('offers only the configured collections the store has (D-076)', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Series' }));

    for (const label of ['Wimpy Kid', 'Harry Potter', 'Tintin', 'Geronimo Stilton']) {
      expect(screen.getByRole('button', { name: label })).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Dog Man' })).not.toBeOnTheScreen();
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
      expect(mockFetchGroup.mock.calls.at(-1)?.[0]).toMatchObject({
        handle: 'junior-readers',
        after: null,
        list: { available: true, sort: 'featured' },
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
    expect(mockFetchGroup.mock.calls.at(-1)?.[0].handle).toBe('harry-potter-series');
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Series, Harry Potter' })).toBeOnTheScreen();
    expect(screen.queryByText('First of junior-readers')).not.toBeOnTheScreen();
  });

  it('"Clear" returns to all books', async () => {
    await renderScreen();
    await choose('Age group', '9-10 years');
    await screen.findByText('First of junior-readers');

    await fireEvent.press(screen.getByRole('button', { name: 'Clear, show all books' }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /Clear/ })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' })).toBeOnTheScreen();
  });

  it('keeps a sort the customer picked when the group changes', async () => {
    await renderScreen();
    await choose('Sort, Alphabetically, A-Z', 'Price, high to low');
    await waitFor(() =>
      expect(mockFetchAll.mock.calls.at(-1)?.[0].list).toEqual({
        available: true,
        sort: 'price-descending',
      }),
    );

    await choose('Age group', '9-10 years');

    await waitFor(() =>
      expect(mockFetchGroup.mock.calls.at(-1)?.[0].list).toEqual({
        available: true,
        sort: 'price-descending',
      }),
    );
    expect(screen.getByRole('button', { name: 'Sort, Price, high to low' })).toBeOnTheScreen();
  });

  it('turns a picked Featured into A-Z on return to all books', async () => {
    await renderScreen();
    await choose('Age group', '9-10 years');
    await screen.findByText('First of junior-readers');
    await choose('Sort, Featured', 'Featured');

    await fireEvent.press(screen.getByRole('button', { name: 'Clear, show all books' }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(mockFetchAll.mock.calls.at(-1)?.[0].list.sort).toBe('title-ascending');
    expect(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' })).toBeOnTheScreen();
  });

  it('shows rented-out books with their badge and no button when "Available now" is off', async () => {
    mockFetchAll.mockImplementation(async ({ list }) => ({
      books: list.available
        ? [card(EXAMPLES.orderableAtZeroStock())]
        : [card(EXAMPLES.orderableAtZeroStock()), card(EXAMPLES.rentedOut())],
      nextCursor: null,
    }));
    await renderScreen();
    // On means Shopify's availableForSale: a book orderable at zero stock is included.
    expect(screen.getByText('Harry Potter and the Deathly Hallows')).toBeOnTheScreen();
    expect(screen.queryByText('The Gruffalo')).not.toBeOnTheScreen();

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', false);

    expect(await screen.findByText('The Gruffalo')).toBeOnTheScreen();
    expect(mockFetchAll.mock.calls.at(-1)?.[0].list).toEqual({
      available: false,
      sort: 'title-ascending',
    });
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    // No cart or notify-me button until they are wired (D-081).
    expect(screen.queryByRole('button', { name: /cart|Notify/ })).not.toBeOnTheScreen();
  });

  it('says how to see rented-out books when nothing is available, and "No books here yet." when off', async () => {
    mockFetchAll.mockResolvedValue({ books: [], nextCursor: null });
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
    expect(mockFetchAll.mock.calls.map(([options]) => options.after)).toEqual([null, 'end-0']);
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
    expect(mockFetchAll).not.toHaveBeenCalled();
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
    mockFetchAll.mockRejectedValueOnce(HTTP_ERROR);

    await render(<BrowseScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Book 1')).toBeOnTheScreen();
    expect(mockRecheckNetwork).toHaveBeenCalledTimes(1);
    expect(mockRecheckNetwork.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchAll.mock.invocationCallOrder[1] ?? 0,
    );
  });

  it('says a group is not available when the store removed it after listing', async () => {
    mockFetchGroup.mockResolvedValue({ kind: 'not-found' });
    await renderScreen();

    await choose('Age group', '9-10 years');

    expect(await screen.findByText('This collection is not available.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Clear, show all books' })).toBeOnTheScreen();
  });
});
