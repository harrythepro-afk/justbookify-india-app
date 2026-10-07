import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';

import CollectionScreen from '@/app/collection/[handle]';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { CollectionBooksPage } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { SAFE_AREA, withScreen } from '../helpers/screen';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockParams: { handle?: string | string[] } = { handle: 'junior-readers' };
let mockHeaderTitle: string | undefined;

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { title?: string } }) => {
      mockHeaderTitle = options.title;
      return null;
    },
  },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

const mockFetchPage = jest.fn<
  Promise<CollectionBooksPage>,
  [{ handle: string; after: string | null }]
>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchCollectionBooksPage: (options: { handle: string; after: string | null }) =>
    mockFetchPage(options),
}));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(index: number): BookCard {
  const result = toBookCard(
    bookProduct({ handle: `junior-${index}`, title: `Junior ${index}` }),
    CONFIG,
  );
  if (result === null) throw new Error('expected a card');
  return result;
}

// junior-readers on the development store: 26 books, so 20 and then 6.
const JUNIOR = Array.from({ length: 26 }, (_, index) => card(index + 1));

function juniorPage({ after }: { after: string | null }): CollectionBooksPage {
  const start = after === null ? 0 : 20;
  return {
    kind: 'found',
    title: 'Junior Readers',
    books: JUNIOR.slice(start, start + 20),
    nextCursor: after === null ? 'end-0' : null,
  };
}

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });

let client: QueryClient;

async function renderScreen() {
  await render(<CollectionScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

function listProps() {
  return screen.getByTestId('collection-books').props as {
    data: readonly BookCard[];
    contentContainerStyle: unknown;
  };
}

type Host = { props: { style?: unknown }; parent: Host | null };

/** The nearest row (a `flexDirection: 'row'` view) around a book's title. */
function rowOf(title: string): Host | null {
  let node = (screen.getByText(title) as unknown as Host).parent;
  while (node !== null) {
    const style = StyleSheet.flatten(node.props.style as object) as { flexDirection?: string };
    if (style?.flexDirection === 'row') return node;
    node = node.parent;
  }
  return null;
}

beforeEach(() => {
  client = createTestQueryClient();
  mockParams = { handle: 'junior-readers' };
  mockHeaderTitle = undefined;
  mockFetchPage.mockReset().mockImplementation(async (options) => juniorPage(options));
});

afterEach(async () => {
  await tearDownQueryClient(client);
  onlineManager.setOnline(true);
});

it("reads the collection by its handle and shows Shopify's title in the header", async () => {
  await renderScreen();

  expect(mockFetchPage.mock.calls[0]?.[0]).toMatchObject({ handle: 'junior-readers', after: null });
  await waitFor(() => expect(mockHeaderTitle).toBe('Junior Readers'));
});

it("shows the books in two columns, in the collection's own order", async () => {
  await renderScreen();

  expect(rowOf('Junior 1')).not.toBeNull();
  expect(rowOf('Junior 1')).toBe(rowOf('Junior 2'));
  expect(rowOf('Junior 3')).not.toBe(rowOf('Junior 1'));
  expect(rowOf('Junior 3')).toBe(rowOf('Junior 4'));
  expect(listProps().data.map((book) => book.title)).toEqual(
    JUNIOR.slice(0, 20).map((book) => book.title),
  );
  expect(screen.getByText('Junior 1')).toBeOnTheScreen();
});

it('shows no cart or notify-me button until they are wired (D-081)', async () => {
  await renderScreen();

  expect(screen.queryByRole('button', { name: /cart|Notify/ })).not.toBeOnTheScreen();
});

it('shows 20 books, then 26 after "Load more", and then no button', async () => {
  await renderScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

  await waitFor(() => expect(listProps().data).toHaveLength(26));
  expect(mockFetchPage.mock.calls.map(([options]) => options.after)).toEqual([null, 'end-0']);
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
});

it('keeps "Load more" as the retry after a page fails, and says so', async () => {
  await renderScreen();
  mockFetchPage.mockRejectedValueOnce(HTTP_ERROR);

  await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

  expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
  expect(listProps().data).toHaveLength(20);

  await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

  await waitFor(() => expect(listProps().data).toHaveLength(26));
  expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeOnTheScreen();
});

it('shows the empty state for a collection with no books (tintin-series)', async () => {
  mockParams = { handle: 'tintin-series' };
  mockFetchPage.mockResolvedValue({ kind: 'found', title: 'Tintin', books: [], nextCursor: null });

  await renderScreen();

  expect(screen.getByText('No books here yet.')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
  await waitFor(() => expect(mockHeaderTitle).toBe('Tintin'));
});

it('says the collection is not available when the store has no such handle', async () => {
  mockParams = { handle: 'dog-man-series' };
  mockFetchPage.mockResolvedValue({ kind: 'not-found' });

  await renderScreen();

  expect(screen.getByText('This collection is not available.')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
});

it('treats a malformed handle as not found', async () => {
  mockParams = { handle: ['a', 'b'] };
  mockFetchPage.mockResolvedValue({ kind: 'not-found' });

  await renderScreen();

  expect(mockFetchPage.mock.calls[0]?.[0].handle).toBe('');
  expect(screen.getByText('This collection is not available.')).toBeOnTheScreen();
});

it('says it is offline, with "Try again", when nothing is saved', async () => {
  onlineManager.setOnline(false);

  await render(<CollectionScreen />, { wrapper: withScreen(client) });

  expect(
    await screen.findByText("You're offline. Check your connection and try again."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  expect(mockFetchPage).not.toHaveBeenCalled();
});

it('shows a thin notice over saved books when it goes offline', async () => {
  await renderScreen();

  await act(async () => {
    onlineManager.setOnline(false);
  });

  expect(await screen.findByText("You're offline. Showing saved books.")).toBeOnTheScreen();
  expect(listProps().data).toHaveLength(20);
});

it('says something went wrong, and "Try again" reloads', async () => {
  mockFetchPage.mockRejectedValueOnce(HTTP_ERROR);

  await render(<CollectionScreen />, { wrapper: withScreen(client) });

  expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

  expect(await screen.findByText('Junior 1')).toBeOnTheScreen();
});

it("leaves room for Android's navigation bar below the last row", async () => {
  await renderScreen();

  const content = StyleSheet.flatten(listProps().contentContainerStyle as object) as {
    paddingBottom?: number;
  };
  expect(content.paddingBottom).toBeGreaterThanOrEqual(SAFE_AREA.insets.bottom);
});
