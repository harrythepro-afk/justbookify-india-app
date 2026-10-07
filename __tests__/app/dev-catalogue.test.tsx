import type { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import DevCatalogueScreen from '@/app/dev-catalogue';
import { DEV_CATALOGUE_EXAMPLES } from '@/config/devCatalogue';
import type { StoreConfigStatus } from '@/config/store';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { CollectionBooksPage } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct } from '../helpers/catalogue';
import {
  createTestQueryClient,
  tearDownQueryClient,
  withQueryClient,
} from '../helpers/queryClient';

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';
const mockFetchBookCard = jest.fn<Promise<BookCard | null>, [{ handle: string }]>();
const mockFetchPage = jest.fn<Promise<CollectionBooksPage>, [{ after: string | null }]>();

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return { Redirect: ({ href }: { href: string }) => <Text>Redirect to {href}</Text> };
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

async function renderScreen() {
  await render(<DevCatalogueScreen />, { wrapper: withQueryClient(client) });
  // Let the queries settle.
  await act(async () => {});
}

beforeEach(() => {
  client = createTestQueryClient();
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

  await render(<DevCatalogueScreen />, { wrapper: withQueryClient(client) });

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

  expect(mockFetchBookCard.mock.calls.map(([options]) => options.handle)).toEqual(
    DEV_CATALOGUE_EXAMPLES.map((example) => example.handle),
  );
  for (const example of DEV_CATALOGUE_EXAMPLES) {
    expect(screen.getByText(example.label)).toBeOnTheScreen();
  }
  expect(screen.getByText('The Gruffalo')).toBeOnTheScreen();
  expect(screen.getByText('Not found: jujutsu-kaisen-0')).toBeOnTheScreen();
});

it('shows which button was tapped', async () => {
  await renderScreen();

  await fireEvent.press(
    screen.getByRole('button', { name: 'Notify me when The Gruffalo is back' }),
  );
  expect(screen.getByText('Notify me tapped: The Gruffalo')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Add Junior 1 to cart' }));
  expect(screen.getByText('Add to Cart tapped: Junior 1')).toBeOnTheScreen();
});

it('pages through junior-readers: 20 books, then 26 after "Load more"', async () => {
  await renderScreen();

  expect(screen.getByText('Junior Readers')).toBeOnTheScreen();
  expect(screen.getByText('Showing 20 books')).toBeOnTheScreen();

  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));
  });

  expect(screen.getByText('Showing 26 books')).toBeOnTheScreen();
  expect(mockFetchPage.mock.calls.map(([options]) => options.after)).toEqual([null, 'end-0']);
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
});

it('shows our own wording when the collection cannot be read', async () => {
  mockFetchPage
    .mockReset()
    .mockRejectedValue(new StorefrontError('no-network', { operationName: 'CollectionBooks' }));

  await renderScreen();

  expect(
    screen.getByText('The Storefront API could not be reached. (CollectionBooks)'),
  ).toBeOnTheScreen();
});
