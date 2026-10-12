import type { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';

import DevCatalogueScreen from '@/app/dev-catalogue';
import { DEV_CATALOGUE_EXAMPLES, DEV_MISSING_BOOK_HANDLE } from '@/config/devCatalogue';
import type { StoreConfigStatus } from '@/config/store';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { CollectionBooksPage } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';
import { fonts } from '@/theme/tokens';

import { bookProduct } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { SAFE_AREA, withScreen } from '../helpers/screen';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';
const mockFetchBookCard = jest.fn<Promise<BookCard | null>, [{ handle: string }]>();
// Cards and the missing-book link open the book page through the router (P6-05).
const mockPush = jest.fn();
const mockFetchPage = jest.fn<Promise<CollectionBooksPage>, [{ after: string | null }]>();

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text>Redirect to {href}</Text>,
    useFocusEffect: () => undefined,
    router: { push: (href: unknown) => mockPush(href) },
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfigStatus: () => mockStoreStatus,
}));

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchBookCard: (options: { handle: string }) => mockFetchBookCard(options),
  fetchCollectionBooksPage: (options: { after: string | null }) => mockFetchPage(options),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(handle: string, title: string, availableForSale = true): BookCard {
  const result = toBookCard(bookProduct({ handle, title, availableForSale }), CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

const JUNIOR = Array.from({ length: 26 }, (_, index) =>
  card(`junior-${index + 1}`, `Junior ${index + 1}`),
);

let client: QueryClient;

/**
 * Renders the screen and waits until neither a named example nor the collection is still
 * loading. TanStack hands results to the screen on a later timer tick (its notify manager uses
 * setTimeout), so one flush is not enough; each test then waits for the state it asserts.
 */
async function renderScreen() {
  await render(<DevCatalogueScreen />, { wrapper: withScreen(client) });
  await waitFor(() => {
    expect(screen.queryAllByText('Loading…')).toHaveLength(0);
    expect(screen.queryByText(/^Loading junior-readers/)).not.toBeOnTheScreen();
  });
}

beforeEach(() => {
  client = createTestQueryClient();
  mockPush.mockReset();
  mockAppEnv = 'development';
  mockStoreStatus = 'configured';
  mockFetchBookCard.mockReset().mockImplementation(async ({ handle }) => {
    if (handle === 'the-gruffalo') return card(handle, 'The Gruffalo', false);
    if (handle === 'jujutsu-kaisen-0') return null;
    return card(handle, `Title of ${handle}`);
  });
  mockFetchPage.mockReset().mockImplementation(async ({ after }) => {
    const start = after === null ? 0 : 20;
    return {
      kind: 'found',
      id: 'gid://shopify/Collection/1',
      title: 'Junior Readers',
      books: JUNIOR.slice(start, start + 20),
      nextCursor: after === null ? 'end-0' : null,
    };
  });
});

afterEach(async () => {
  await tearDownQueryClient(client);
});

it.each(['staging', 'production'])('redirects to the start screen on a %s build', async (env) => {
  mockAppEnv = env;

  await render(<DevCatalogueScreen />, { wrapper: withScreen(client) });

  expect(screen.getByText('Redirect to /')).toBeOnTheScreen();
  expect(mockFetchBookCard).not.toHaveBeenCalled();
  expect(mockFetchPage).not.toHaveBeenCalled();
});

it('reads nothing when the store is not configured', async () => {
  mockStoreStatus = 'not configured';

  await renderScreen();

  expect(screen.getByText('Store configuration: not configured')).toBeOnTheScreen();
  expect(mockFetchBookCard).not.toHaveBeenCalled();
});

it('shows a card for each named example, with its case', async () => {
  await renderScreen();

  expect(await screen.findByText('The Gruffalo')).toBeOnTheScreen();
  expect(await screen.findByText('Not found: jujutsu-kaisen-0')).toBeOnTheScreen();
  expect(mockFetchBookCard.mock.calls.map(([options]) => options.handle)).toEqual(
    DEV_CATALOGUE_EXAMPLES.map((example) => example.handle),
  );
  for (const example of DEV_CATALOGUE_EXAMPLES) {
    expect(screen.getByText(example.label)).toBeOnTheScreen();
  }
});

it('shows which button was tapped', async () => {
  await renderScreen();

  await fireEvent.press(
    await screen.findByRole('button', { name: 'Notify me when The Gruffalo is back' }),
  );
  expect(await screen.findByText('Notify me tapped: The Gruffalo')).toBeOnTheScreen();

  await fireEvent.press(await screen.findByRole('button', { name: 'Add Junior 1 to cart' }));
  expect(await screen.findByText('Add to Cart tapped: Junior 1')).toBeOnTheScreen();
});

it('pages through junior-readers: 20 books, then 26 after "Load more"', async () => {
  await renderScreen();

  expect(await screen.findByText('Junior Readers')).toBeOnTheScreen();
  expect(await screen.findByText('Showing 20 books')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

  expect(await screen.findByText('Showing 26 books')).toBeOnTheScreen();
  expect(mockFetchPage.mock.calls.map(([options]) => options.after)).toEqual([null, 'end-0']);
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
});

it('shows our own wording when the collection cannot be read', async () => {
  mockFetchPage
    .mockReset()
    .mockRejectedValue(new StorefrontError('no-network', { operationName: 'CollectionBooks' }));

  await renderScreen();

  expect(
    await screen.findByText('The Storefront API could not be reached. (CollectionBooks)'),
  ).toBeOnTheScreen();
});

it("leaves room for Android's navigation bar below the last row", async () => {
  await renderScreen();

  const content = StyleSheet.flatten(
    screen.getByTestId('dev-catalogue-scroll').props.contentContainerStyle,
  ) as { paddingBottom?: number };
  expect(content.paddingBottom).toBeGreaterThanOrEqual(SAFE_AREA.insets.bottom);
});

describe('the book page section (P6-05, D-094)', () => {
  it('opens a book that does not exist, so the not-found page can be checked', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('link', { name: 'Open a missing book' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/book/[handle]',
      params: { handle: DEV_MISSING_BOOK_HANDLE },
    });
  });

  it('shows the description sample through the book page parser, links as plain text', async () => {
    await renderScreen();

    const sample = screen.getByTestId('dev-description-sample');
    expect(sample).toBeOnTheScreen();
    expect(
      StyleSheet.flatten(screen.getByText('Perfect for readers, who:').props.style),
    ).toMatchObject({ fontFamily: fonts.bodyBold });
    expect(screen.getByText("Why You'll Love It:")).toBeOnTheScreen();
    expect(screen.getByText(/✅ Short chapters/)).toBeOnTheScreen();
    expect(screen.getByText(/❌ Not a book of facts/)).toBeOnTheScreen();
    expect(screen.getByText(/everyone & everything/)).toBeOnTheScreen();
    expect(screen.getByText('More in the Fox series.')).toBeOnTheScreen();
  });

  it("opens a named example's book page from its card", async () => {
    await renderScreen();

    await fireEvent.press(screen.getByTestId('book-card-open-the-gruffalo'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/book/[handle]',
      params: { handle: 'the-gruffalo' },
    });
  });
});
