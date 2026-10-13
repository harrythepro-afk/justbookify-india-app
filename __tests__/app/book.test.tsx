import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';

import BookScreen, { priceSummary, RENTED_OUT_SENTENCE } from '@/app/book/[handle]';
import { resetOpenGuardForTests } from '@/navigation/openGuard';
import { toBookPage, type BookPage } from '@/shopify/bookPage';
import type { CollectionGenres } from '@/shopify/catalogue';
import type { GenreEntry } from '@/shopify/genres';
import { StorefrontError } from '@/shopify/errors';
import { colors, fonts } from '@/theme/tokens';

import { bookPageProduct, genre } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { SAFE_AREA, withScreen } from '../helpers/screen';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockParams: { handle?: string | string[] } = { handle: 'the-gruffalo' };
let mockHeader: { title?: string; headerShown?: boolean } | undefined;
// A genre chip opens the collection screen through the router, via the guard (P6-10, D-113).
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { title?: string; headerShown?: boolean } }) => {
      mockHeader = options;
      return null;
    },
  },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: () => undefined,
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
  reportAnalyticsProblem: (problem: string) => mockReportAnalytics(problem),
}));

// "Try again" re-reads the network before it refetches (D-082).
const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

const mockFetchBook = jest.fn<Promise<BookPage | null>, [{ handle: string }]>();
type GenresOptions = { handle: string; available: boolean };
const mockFetchGenres = jest.fn<Promise<CollectionGenres>, [GenresOptions]>();
const mockFetchEntries = jest.fn<Promise<readonly GenreEntry[]>, []>();

// Usage events (P6-09): the real typed functions and guard run; only Firebase's send is recorded.
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
const mockReportAnalytics = jest.fn();
let mockConsent = true;
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockConsent }));

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchBook: (options: { handle: string }) => mockFetchBook(options),
  fetchCollectionGenres: (options: GenresOptions) => mockFetchGenres(options),
  fetchGenreEntries: () => mockFetchEntries(),
}));

// The Genre list for all books with "Available now" on, on the development store (P6-10): Fantasy
// and Manga have books; Picture book has none available, so the list leaves it out.
const gid = (id: number) => `gid://shopify/TaxonomyValue/${id}`;
const genreValue = (id: number, count: number) => ({
  count,
  input: JSON.stringify({
    taxonomyMetafield: { namespace: 'shopify', key: 'genre', value: gid(id) },
  }),
});
const FANTASY = 20853;
const MANGA = 15730;
const PICTURE_BOOK = 15727;
const ALL_BOOKS_GENRES: CollectionGenres = {
  kind: 'found',
  locale: 'en-IN',
  values: [genreValue(FANTASY, 9), genreValue(MANGA, 3), genreValue(PICTURE_BOOK, 0)],
};
const ENTRIES: readonly GenreEntry[] = [
  { label: 'Fantasy', taxonomyReference: gid(FANTASY) },
  { label: 'Manga', taxonomyReference: gid(MANGA) },
  { label: 'Picture book', taxonomyReference: gid(PICTURE_BOOK) },
];

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function page(overrides: Parameters<typeof bookPageProduct>[0] = {}): BookPage {
  const result = toBookPage(bookPageProduct(overrides), CONFIG);
  if (result === null) throw new Error('expected a page');
  return result;
}

// The live shape (architect, 8 October 2026): bold headings, bullet lines, both emoji.
const LIVE_SHAPE =
  '<p><strong>Perfect for readers, who:</strong><br>• Love monsters<br>• Like rhymes</p>' +
  "<p><strong>Why You'll Love It:</strong><br>✅ Read-aloud fun<br>❌ Not for older readers</p>";

/** The development store's named examples (`TESTING.md`, "Sample catalogue (P6-01)"). */
const BOOKS = {
  inStock: () =>
    page({
      handle: 'the-diary-of-a-wimpy-kid-no-brainer',
      title: 'Diary of a Wimpy Kid: No Brainer',
      vendor: 'Jeff Kinney',
      genres: [genre('Humor & Comedy'), genre('Realistic Fiction')],
    }),
  rentedOut: () =>
    page({
      handle: 'the-gruffalo',
      title: 'The Gruffalo',
      vendor: 'Julia Donaldson',
      availableForSale: false,
      descriptionHtml: LIVE_SHAPE,
      genres: [genre('Picture Book')],
    }),
  orderableAtZeroStock: () =>
    page({
      handle: 'harry-potter-and-the-deathly-hallows-book-7',
      title: 'Harry Potter and the Deathly Hallows',
      vendor: 'J.K. Rowling',
      currentlyNotInStock: true,
    }),
  noCover: () =>
    page({
      handle: 'peter-and-the-wolf-read-it-yourself',
      title: 'Peter and the Wolf',
      cover: false,
    }),
};

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });

let client: QueryClient;

async function renderBook(book: BookPage | null) {
  mockFetchBook.mockResolvedValue(book);
  await render(<BookScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

type Json = { children: (Json | string)[] | null } | string;

/** Every piece of text on the screen, in the order it is drawn. */
function textsInOrder(): string[] {
  const out: string[] = [];
  const walk = (node: Json | Json[] | null) => {
    if (node === null) return;
    if (Array.isArray(node)) node.forEach(walk);
    else if (typeof node === 'string') out.push(node);
    else (node.children ?? []).forEach(walk);
  };
  walk(screen.toJSON() as Json | Json[] | null);
  return out;
}

beforeEach(() => {
  mockSendEvent.mockClear();
  mockReportAnalytics.mockClear();
  mockConsent = true;
  client = createTestQueryClient();
  mockParams = { handle: 'the-gruffalo' };
  mockHeader = undefined;
  mockFetchBook.mockReset();
  mockFetchGenres.mockReset().mockResolvedValue(ALL_BOOKS_GENRES);
  mockFetchEntries.mockReset().mockResolvedValue(ENTRIES);
  mockPush.mockClear();
  resetOpenGuardForTests();
  mockRecheckNetwork.mockClear();
});

afterEach(async () => {
  await tearDownQueryClient(client);
  onlineManager.setOnline(true);
});

it('reads the book by its handle, with a header that has only the back arrow', async () => {
  await renderBook(BOOKS.rentedOut());

  expect(mockFetchBook.mock.calls[0]?.[0]).toMatchObject({ handle: 'the-gruffalo' });
  expect(mockHeader).toMatchObject({ headerShown: true, title: '' });
});

it("shows the page in the live page's order (answer 7)", async () => {
  await renderBook(BOOKS.rentedOut());

  const texts = textsInOrder();
  const order = [
    'Julia Donaldson',
    'The Gruffalo',
    RENTED_OUT_SENTENCE,
    '₹350',
    '₹49',
    'Rented Out',
    'Perfect for readers, who:',
    "Why You'll Love It:",
    'Genre',
    'Picture Book',
  ].map((text) => texts.indexOf(text));
  expect(order).not.toContain(-1);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  expect(screen.getByTestId('book-page-cover')).toBeOnTheScreen();
});

it('shows the author in small capitals, as stored, and the title as a header', async () => {
  await renderBook(BOOKS.rentedOut());

  const author = StyleSheet.flatten(screen.getByText('Julia Donaldson').props.style) as {
    textTransform?: string;
  };
  expect(author.textTransform).toBe('uppercase');
  expect(screen.getByRole('header', { name: 'The Gruffalo' })).toBeOnTheScreen();
});

describe('availability (answer 6, D-073)', () => {
  it('shows a rented-out book with the "Rented Out" badge and the sentence', async () => {
    await renderBook(BOOKS.rentedOut());

    expect(screen.getByText(RENTED_OUT_SENTENCE)).toBeOnTheScreen();
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    expect(screen.queryByText('Rent')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('₹49, retail price ₹350, Rented out')).toBeOnTheScreen();
  });

  it.each([
    ['in stock', BOOKS.inStock],
    ['orderable at zero stock', BOOKS.orderableAtZeroStock],
  ])('shows a book %s with the green "Rent" badge and never the sentence', async (_case, book) => {
    await renderBook(book());

    const badge = screen.getByText('Rent');
    expect(StyleSheet.flatten(badge.props.style)).toMatchObject({ color: colors.onRentBadge });
    expect(screen.queryByText('Rented Out')).not.toBeOnTheScreen();
    expect(screen.queryByText(RENTED_OUT_SENTENCE)).not.toBeOnTheScreen();
    expect(screen.queryByText(/not available|unavailable|out of stock/i)).not.toBeOnTheScreen();
    expect(screen.getByLabelText('₹49, retail price ₹350, Rent')).toBeOnTheScreen();
  });
});

it('shows no retail price when there is none above the price', async () => {
  await renderBook(page({ compareAtPrice: null }));

  expect(screen.queryByText('₹350')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('₹49, Rent')).toBeOnTheScreen();
});

it('shows the cream frame and the book icon for a book with no cover (answer 4)', async () => {
  await renderBook(BOOKS.noCover());

  expect(screen.getByTestId('book-page-cover-fallback')).toBeOnTheScreen();
  expect(screen.queryByTestId('book-page-cover')).not.toBeOnTheScreen();
  expect(screen.getByTestId('book-page-cover-fallback').props.accessibilityLabel).toBe(
    'Peter and the Wolf',
  );
});

it('shows the full description with its bold headings and line breaks (answer 2)', async () => {
  await renderBook(BOOKS.rentedOut());

  const heading = screen.getByText('Perfect for readers, who:');
  expect(StyleSheet.flatten(heading.props.style)).toMatchObject({ fontFamily: fonts.bodyBold });
  expect(screen.getByText(/• Love monsters/)).toBeOnTheScreen();
  expect(screen.getByText(/✅ Read-aloud fun/)).toBeOnTheScreen();
  expect(screen.getByText(/❌ Not for older readers/)).toBeOnTheScreen();
});

it('leaves out the description when there is none', async () => {
  await renderBook(page({ descriptionHtml: '' }));

  expect(screen.queryByTestId('book-description')).not.toBeOnTheScreen();
});

it('shows the genres as chips under "Genre"; one with no taxonomy value is plain text', async () => {
  await renderBook(BOOKS.inStock());

  expect(screen.getByText('Genre')).toBeOnTheScreen();
  expect(screen.getByText('Humor & Comedy')).toBeOnTheScreen();
  expect(screen.getByText('Realistic Fiction')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  expect(screen.queryByRole('link')).not.toBeOnTheScreen();
});

describe('genre chips (owner and architect, P6-10, D-113)', () => {
  const book = () =>
    page({
      genres: [genre('Fantasy', FANTASY), genre('Picture book', PICTURE_BOOK), genre('Mystery')],
    });

  /** Waits until the Genre list has landed and the chip it offers is a link. */
  async function renderWithList() {
    await renderBook(book());
    await screen.findByRole('link', { name: 'Show Fantasy books' });
  }

  it('reads the Genre list of all books with "Available now" on', async () => {
    await renderWithList();

    expect(mockFetchGenres).toHaveBeenCalledTimes(1);
    expect(mockFetchGenres.mock.calls[0]?.[0]).toMatchObject({
      handle: 'all-books',
      available: true,
    });
  });

  it('makes only a genre the list offers tappable, named "Show Fantasy books"', async () => {
    await renderWithList();

    expect(screen.getAllByRole('link')).toHaveLength(1);
    // Picture book has no available book, and Mystery has no taxonomy value: plain text.
    expect(screen.getByText('Picture book')).toBeOnTheScreen();
    expect(screen.getByText('Mystery')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Show Picture book books')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Show Mystery books')).not.toBeOnTheScreen();
  });

  it('opens the all-books collection screen with the code, pushed on top of the book', async () => {
    await renderWithList();

    await fireEvent.press(screen.getByRole('link', { name: 'Show Fantasy books' }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/collection/[handle]',
      params: { handle: 'all-books', genre: String(FANTASY) },
    });
    // The link carries the number only, never the name.
    expect(JSON.stringify(mockPush.mock.calls)).not.toMatch(/fantasy/i);
  });

  it('sends no event of its own: the collection screen sends filter_applied', async () => {
    await renderWithList();
    mockSendEvent.mockClear();

    await fireEvent.press(screen.getByRole('link', { name: 'Show Fantasy books' }));

    expect(mockSendEvent).not.toHaveBeenCalled();
  });

  it('opens once on a double tap (D-099)', async () => {
    await renderWithList();
    const chip = screen.getByRole('link', { name: 'Show Fantasy books' });

    await fireEvent.press(chip);
    await fireEvent.press(chip);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('looks the same as a plain chip, with a touch area of 44 points or more', async () => {
    await renderWithList();
    const link = screen.getByRole('link', { name: 'Show Fantasy books' });
    // The nearest view around the plain chip's text that has a border: the chip itself.
    type Host = { props: { style?: object }; parent: Host | null };
    let plain = (screen.getByText('Picture book') as unknown as Host).parent;
    while (
      plain !== null &&
      (StyleSheet.flatten(plain.props.style) as { borderWidth?: number } | undefined)
        ?.borderWidth === undefined
    ) {
      plain = plain.parent;
    }

    expect(plain).not.toBeNull();
    expect(StyleSheet.flatten(link.props.style)).toEqual(StyleSheet.flatten(plain?.props.style));
    const { top, bottom } = link.props.hitSlop as { top: number; bottom: number };
    // Padding 4 + 4, border 1 + 1 and a line of 14-point text (at least 19 points).
    expect(4 + 4 + 1 + 1 + 19 + top + bottom).toBeGreaterThanOrEqual(44);
  });

  it('keeps every chip plain while the list loads', async () => {
    mockFetchGenres.mockReturnValue(new Promise(() => undefined));
    await renderBook(book());

    expect(screen.getByText('Fantasy')).toBeOnTheScreen();
    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
  });

  it('keeps every chip plain when the list cannot be read', async () => {
    mockFetchGenres.mockRejectedValue(HTTP_ERROR);
    await renderBook(book());
    await waitFor(() => expect(mockFetchGenres).toHaveBeenCalled());
    await act(async () => undefined);

    expect(screen.getByText('Fantasy')).toBeOnTheScreen();
    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
  });

  it('keeps every chip plain when the store has no all-books collection', async () => {
    mockFetchGenres.mockResolvedValue({ kind: 'not-found' });
    await renderBook(book());
    await waitFor(() => expect(mockFetchGenres).toHaveBeenCalled());
    await act(async () => undefined);

    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
  });

  it('keeps a chip plain when the store has no name for its value', async () => {
    mockFetchEntries.mockResolvedValue([{ label: 'Manga', taxonomyReference: gid(MANGA) }]);
    await renderBook(book());
    await waitFor(() => expect(mockFetchEntries).toHaveBeenCalled());
    await act(async () => undefined);

    expect(screen.getByText('Fantasy')).toBeOnTheScreen();
    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
  });
});

it('leaves out "Genre" when the book has none', async () => {
  await renderBook(page({ genres: null }));

  expect(screen.queryByText('Genre')).not.toBeOnTheScreen();
});

it('shows no rating, cart, buy, notify or shipping text (answers 3, 7, 8; D-081)', async () => {
  await renderBook(BOOKS.inStock());

  const text = textsInOrder().join(' ');
  expect(text).not.toMatch(
    /rating|review|stars?\b|add to cart|buy it now|notify me|shipping|isbn|publisher|pages|binding|language/i,
  );
});

it('says "This book is not available." for a book that does not exist (answer 5)', async () => {
  mockParams = { handle: 'no-such-book-p6-05' };

  await renderBook(null);

  expect(screen.getByText('This book is not available.')).toBeOnTheScreen();
  expect(mockFetchBook.mock.calls[0]?.[0].handle).toBe('no-such-book-p6-05');
});

it('treats a missing or repeated handle parameter as a book that does not exist', async () => {
  mockParams = { handle: ['a', 'b'] };

  await renderBook(null);

  expect(mockFetchBook.mock.calls[0]?.[0].handle).toBe('');
  expect(screen.getByText('This book is not available.')).toBeOnTheScreen();
});

it('says it is offline, with "Try again", when nothing is saved', async () => {
  onlineManager.setOnline(false);
  mockFetchBook.mockResolvedValue(BOOKS.inStock());

  await render(<BookScreen />, { wrapper: withScreen(client) });

  expect(
    await screen.findByText("You're offline. Check your connection and try again."),
  ).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
  expect(mockFetchBook).not.toHaveBeenCalled();
});

it('shows a thin notice over the saved page when it goes offline', async () => {
  await renderBook(BOOKS.inStock());

  await act(async () => {
    onlineManager.setOnline(false);
  });

  expect(await screen.findByText("You're offline. Showing saved books.")).toBeOnTheScreen();
  expect(screen.getByText('Diary of a Wimpy Kid: No Brainer')).toBeOnTheScreen();
});

it('says something went wrong, and "Try again" re-reads the network and reloads', async () => {
  mockFetchBook.mockRejectedValueOnce(HTTP_ERROR).mockResolvedValue(BOOKS.inStock());

  await render(<BookScreen />, { wrapper: withScreen(client) });

  expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

  expect(await screen.findByText('Diary of a Wimpy Kid: No Brainer')).toBeOnTheScreen();
  expect(mockRecheckNetwork).toHaveBeenCalledTimes(1);
  expect(mockRecheckNetwork.mock.invocationCallOrder[0]).toBeLessThan(
    mockFetchBook.mock.invocationCallOrder[1] ?? 0,
  );
});

it("leaves room for Android's navigation bar below the page", async () => {
  await renderBook(BOOKS.inStock());

  const content = StyleSheet.flatten(
    screen.getByTestId('book-page').props.contentContainerStyle as object,
  ) as { paddingBottom?: number };
  expect(content.paddingBottom).toBeGreaterThanOrEqual(SAFE_AREA.insets.bottom);
});

describe('priceSummary', () => {
  it('names the rental price, the retail price and the badge', () => {
    expect(priceSummary({ price: '₹49', retailPrice: '₹350', orderable: true })).toBe(
      '₹49, retail price ₹350, Rent',
    );
    expect(priceSummary({ price: '₹49', retailPrice: null, orderable: false })).toBe(
      '₹49, Rented out',
    );
  });
});

describe('view_book (P6-09, D-107)', () => {
  const sent = () => mockSendEvent.mock.calls;
  const numberOf = (book: BookPage) => book.id.slice('gid://shopify/Product/'.length);

  it('is sent once, with the product’s number, when the page shows its book', async () => {
    const book = BOOKS.inStock();
    await renderBook(book);

    expect(sent()).toEqual([['view_book', { product_id: numberOf(book), available: 'yes' }]]);
  });

  it('says no for a rented-out book', async () => {
    const rentedOut = BOOKS.rentedOut();
    await renderBook(rentedOut);
    expect(sent()).toEqual([['view_book', { product_id: numberOf(rentedOut), available: 'no' }]]);
  });

  it('says yes for a book orderable at zero stock (R8)', async () => {
    const zeroStock = BOOKS.orderableAtZeroStock();
    await renderBook(zeroStock);
    expect(sent()).toEqual([['view_book', { product_id: numberOf(zeroStock), available: 'yes' }]]);
  });

  it('is not sent again when the page reads Shopify again', async () => {
    await renderBook(BOOKS.inStock());
    mockFetchBook.mockResolvedValue(BOOKS.rentedOut());

    await act(() => client.refetchQueries());
    await waitFor(() => expect(mockFetchBook).toHaveBeenCalledTimes(2));

    expect(sent()).toHaveLength(1);
  });

  it('is not sent for a book that does not exist', async () => {
    await renderBook(null);
    expect(sent()).toEqual([]);
  });

  it('is not sent without consent', async () => {
    mockConsent = false;
    await renderBook(BOOKS.inStock());
    expect(sent()).toEqual([]);
    expect(mockReportAnalytics).not.toHaveBeenCalled();
  });
});
