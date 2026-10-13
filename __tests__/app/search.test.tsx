import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList, Keyboard, Modal, ScrollView, Switch, StyleSheet, TextInput } from 'react-native';

import SearchScreen from '@/app/search';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { SearchBooksPage, SearchOptions } from '@/shopify/catalogue';
import type { GenreEntry } from '@/shopify/genres';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct, collectionGid, collectionMap } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';

// Loaded with the file, not inside the first test's time limit (cold Jest cache, P6-03).
void ScrollView;
void FlatList;
void Modal;
void Switch;

let mockHeaderTitle: string | undefined;
let mockFocusEffect: (() => (() => void) | void) | undefined;
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Stack: {
    Screen: ({ options }: { options: { title?: string } }) => {
      mockHeaderTitle = options.title;
      return null;
    },
  },
  // The latest callback is kept, so a test can play the screen losing focus.
  useFocusEffect: (effect: () => (() => void) | void) => {
    mockFocusEffect = effect;
  },
  router: { push: (href: unknown) => mockPush(href) },
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
  reportAnalyticsProblem: (problem: string) => mockReportAnalytics(problem),
  reportFeatureFlagProblem: (problem: string) => mockReportRemoteConfig(problem),
  reportMalformedFeatureFlag: (name: string) => mockReportRemoteConfig(name),
  reportMalformedRemoteConfigList: (parameter: string, summary: string) =>
    mockReportRemoteConfig(parameter, summary),
}));
const mockReportRemoteConfig = jest.fn();

// A configured store, so a Price button would have its labels if search drew one (P6-08).
jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfig: () => ({ currencyCode: 'INR', language: 'EN', country: 'IN' }),
}));

const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

type FetchOptions = { term: string; after: string | null; search: SearchOptions };

const mockFetchSearch = jest.fn<Promise<SearchBooksPage>, [FetchOptions]>();
// What a term is matched against besides its results (D-109): the store's collections and genres.
const mockFetchHandles = jest.fn<Promise<ReadonlyMap<string, string>>, []>();
const mockFetchGenreEntries = jest.fn<Promise<readonly GenreEntry[]>, []>();

// Usage events (P6-09): the real typed functions and guard run; only Firebase's send is recorded.
const mockSendEvent = jest.fn((_name: string, _params: unknown) => Promise.resolve());
const mockReportAnalytics = jest.fn();
let mockConsent = true;
jest.mock('@/analytics/firebase', () => ({
  sendEvent: (name: string, params: unknown) => mockSendEvent(name, params),
  sendScreenView: () => Promise.resolve(),
}));
jest.mock('@/analytics/consent', () => ({ isAnalyticsConsentGranted: () => mockConsent }));

// This launch's wanted list (P6-11, D-115): the phone check's list, as Remote Config would hold it.
// Remote Config itself never loads in tests.
jest.mock('@/featureFlags/remoteConfig', () => ({
  activateLastFetched: () =>
    Promise.resolve({
      search_wanted_list: {
        value: JSON.stringify(['David Walliams', 'Rick Riordan', 'Tintin', 'Harry Potter']),
        source: 'remote',
      },
    }),
  fetchForNextLaunch: () => Promise.resolve(),
}));
// A development build, as the list's timing (D-046) reads the environment's fetch settings.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchSearchPage: (options: FetchOptions) => mockFetchSearch(options),
  fetchCollectionHandles: () => mockFetchHandles(),
  fetchGenreEntries: () => mockFetchGenreEntries(),
}));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };
const MANGA_GID = 'gid://shopify/TaxonomyValue/15730';

function card(handle: string): BookCard {
  const result = toBookCard(bookProduct({ handle, title: handle }), CONFIG);
  if (result === null) throw new Error('expected a card');
  return result;
}

/** `count` books named after the term, 20 per page. */
function results(term: string, count: number, after: string | null): SearchBooksPage {
  const start = after === null ? 0 : Number(after);
  const books = Array.from({ length: Math.min(20, Math.max(count - start, 0)) }, (_, index) =>
    card(`${term}-${start + index + 1}`),
  );
  return {
    books,
    totalCount: count,
    nextCursor: start + 20 < count ? String(start + 20) : null,
  };
}

const COUNTS: Record<string, number> = { harry: 7, har: 7, dahl: 3, ha: 1, the: 26 };

const HINT = "Type a book's title or the author's name.";
const OFF_NONE =
  'No results found for “zzqxv”. Check the spelling or use a different word or phrase.';
const ON_NONE =
  'No available books found for “zzqxv”. Switch off Available now to see rented-out books, or check the spelling.';

let client: QueryClient;

async function renderScreen() {
  await render(<SearchScreen />, { wrapper: withScreen(client) });
}

function field() {
  return screen.getByTestId('search-field');
}

async function type(text: string) {
  await fireEvent.changeText(field(), text);
}

/** Types a term and waits for its results, past the 300 ms pause. */
async function searchFor(text: string) {
  await type(text);
  await waitPastPause();
  await waitFor(() => expect(screen.getByTestId('search-books')).toBeOnTheScreen());
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

function listProps() {
  return screen.getByTestId('search-books').props as {
    data: readonly BookCard[];
    contentContainerStyle: unknown;
    keyboardShouldPersistTaps?: string;
    keyboardDismissMode?: string;
  };
}

function terms(): string[] {
  return mockFetchSearch.mock.calls.map(([options]) => options.term);
}

/** Pauses longer than the typing pause, so a search would have started by now. */
async function waitPastPause() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 450)));
}

/** Waits until no search is loading, so no update lands after the test. */
async function searchSettled() {
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

beforeEach(() => {
  mockSendEvent.mockClear();
  mockReportAnalytics.mockClear();
  mockConsent = true;
  mockFetchHandles
    .mockReset()
    .mockResolvedValue(collectionMap(['harry-potter-series', 'tintin-series', 'emerging-readers']));
  mockFetchGenreEntries
    .mockReset()
    .mockResolvedValue([{ label: 'Manga', taxonomyReference: MANGA_GID }]);
  client = createTestQueryClient();
  mockHeaderTitle = undefined;
  mockFocusEffect = undefined;
  mockPush.mockReset();
  mockRecheckNetwork.mockClear();
  mockFetchSearch
    .mockReset()
    .mockImplementation(async ({ term, after }) => results(term, COUNTS[term] ?? 0, after));
});

afterEach(async () => {
  await tearDownQueryClient(client);
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

describe('before a search', () => {
  it('opens with the header, a focused field and the hint, and reads nothing', async () => {
    await renderScreen();

    expect(mockHeaderTitle).toBe('Search');
    expect(field().props.placeholder).toBe('Search books');
    expect(field().props.autoFocus).toBe(true);
    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(screen.queryByRole('switch', { name: 'Available now' })).not.toBeOnTheScreen();
    expect(mockFetchSearch).not.toHaveBeenCalled();
  });

  it('sets up the field for an untrusted search term', async () => {
    await renderScreen();

    expect(field().props).toMatchObject({
      maxLength: 100,
      autoCorrect: false,
      autoCapitalize: 'none',
      returnKeyType: 'search',
    });
  });

  it('keeps the hint while fewer than 3 letters or digits are typed', async () => {
    await renderScreen();
    await type('ha');
    await waitPastPause();

    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(mockFetchSearch).not.toHaveBeenCalled();
  });

  it('never searches for symbols alone, typed or with the search key (owner, answer 2)', async () => {
    await renderScreen();
    for (const text of ['***', '&&&&', '%-%', '😀😀😀']) {
      await type(text);
      await fireEvent(field(), 'submitEditing');
    }
    await waitPastPause();

    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(mockFetchSearch).not.toHaveBeenCalled();
  });
});

describe('the clear button (P6-06 review)', () => {
  // React Native's test setup gives TextInput a shared mocked focus().
  const focus = (TextInput.prototype as unknown as { focus: jest.Mock }).focus;

  it('shows only while the field has text, named "Clear search", at least 44 points', async () => {
    await renderScreen();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeOnTheScreen();

    await type('h');
    const clear = screen.getByRole('button', { name: 'Clear search' });
    const style = StyleSheet.flatten(clear.props.style as object) as {
      minWidth?: number;
      minHeight?: number;
    };
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);

    await type('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeOnTheScreen();
    // Lets the typing pause end inside act.
    await waitPastPause();
  });

  it('empties the field, brings back the hint and keeps the keyboard open', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    await renderScreen();
    await searchFor('harry');
    expect(screen.getByText('7 results')).toBeOnTheScreen();
    focus.mockClear();

    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));

    expect(field().props.value).toBe('');
    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(screen.queryByTestId('search-books')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeOnTheScreen();
    expect(focus).toHaveBeenCalledTimes(1);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('stops a search that was waiting for the pause, then searches the next term', async () => {
    await renderScreen();
    await type('harry');
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    await waitPastPause();
    expect(mockFetchSearch).not.toHaveBeenCalled();
    expect(screen.getByText(HINT)).toBeOnTheScreen();

    await searchFor('dahl');
    expect(await screen.findByText('3 results')).toBeOnTheScreen();
    expect(terms()).toEqual(['dahl']);
  });
});

describe('when it searches', () => {
  it('searches from 3 letters after a 300 ms pause, not before', async () => {
    await renderScreen();
    await type('har');

    expect(mockFetchSearch).not.toHaveBeenCalled();

    await waitPastPause();
    await waitFor(() => expect(terms()).toEqual(['har']));
    await searchSettled();
  });

  it('sends one request for the last term when typing quickly', async () => {
    await renderScreen();
    for (const text of ['har', 'harr', 'harry']) await type(text);
    await waitPastPause();

    expect(terms()).toEqual(['harry']);
    expect(await screen.findByText('7 results')).toBeOnTheScreen();
    expect(terms()).toEqual(['harry']);
  });

  it('searches at once with the search key, from 2 letters (owner, answer 3)', async () => {
    await renderScreen();
    await type('ha');
    await fireEvent(field(), 'submitEditing');

    // Well inside the typing pause: the search key does not wait.
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(terms()).toEqual(['ha']);
    await waitPastPause();
    expect(terms()).toEqual(['ha']);
    expect(await screen.findByText('1 result')).toBeOnTheScreen();
  });

  it('sends the term trimmed and single-spaced', async () => {
    await renderScreen();
    await type('   roald    dahl  ');
    await waitPastPause();

    await waitFor(() => expect(terms()).toEqual(['roald dahl']));
    await searchSettled();
  });

  it('shows the hint again when the term is shortened below the minimum', async () => {
    await renderScreen();
    await searchFor('harry');
    await type('ha');

    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(screen.queryByTestId('search-books')).not.toBeOnTheScreen();
    // The typing pause ends inside act, and the hint stays.
    await waitPastPause();
    expect(screen.getByText(HINT)).toBeOnTheScreen();
  });
});

describe('results', () => {
  it('shows the count line and the books in two columns, opening a book on a tap', async () => {
    await renderScreen();
    await searchFor('harry');

    expect(screen.getByText('7 results')).toBeOnTheScreen();
    expect(listProps().data.map((book) => book.handle)).toEqual(
      Array.from({ length: 7 }, (_, index) => `harry-${index + 1}`),
    );

    await fireEvent.press(screen.getByRole('link', { name: /harry-2/ }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/book/[handle]',
      params: { handle: 'harry-2' },
    });
  });

  it('reads "1 result" and "1,000+ results" as the website does', async () => {
    mockFetchSearch.mockImplementation(async ({ term }) =>
      term === 'many' ? { ...results('many', 20, null), totalCount: 1000 } : results(term, 1, null),
    );
    await renderScreen();
    await searchFor('one');
    expect(screen.getByText('1 result')).toBeOnTheScreen();

    await searchFor('many');
    expect(await screen.findByText('1,000+ results')).toBeOnTheScreen();
  });

  it('shows 20 books, then 26 after "Load more", and then no button', async () => {
    await renderScreen();
    await searchFor('the');

    expect(listProps().data).toHaveLength(20);
    await fireEvent.press(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(listProps().data).toHaveLength(26));
    expect(mockFetchSearch.mock.calls.map(([options]) => options.after)).toEqual([null, '20']);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();
  });

  it('says the website’s line, with the cleaned term, when nothing is found', async () => {
    await renderScreen();
    await searchFor('  zzqxv  ');

    expect(await screen.findByText(OFF_NONE)).toBeOnTheScreen();
    expect(screen.queryByTestId('search-count')).not.toBeOnTheScreen();
  });

  it('says the owner’s line when nothing available is found (answer 4)', async () => {
    await renderScreen();
    await searchFor('zzqxv');
    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', true);

    expect(await screen.findByText(ON_NONE)).toBeOnTheScreen();
    expect(screen.queryByText(OFF_NONE)).not.toBeOnTheScreen();
  });

  it('keeps the earlier results on screen while a new term loads, with no count line', async () => {
    await renderScreen();
    await searchFor('harry');
    let release: () => void = () => undefined;
    mockFetchSearch.mockImplementationOnce(
      ({ term, after }) =>
        new Promise((resolve) => {
          release = () => resolve(results(term, COUNTS[term] ?? 0, after));
        }),
    );

    await type('dahl');
    await waitPastPause();
    await waitFor(() => expect(terms()).toEqual(['harry', 'dahl']));

    expect(listProps().data[0]?.handle).toBe('harry-1');
    expect(screen.queryByTestId('search-count')).not.toBeOnTheScreen();
    expect(screen.queryByText('7 results')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeOnTheScreen();

    await act(async () => release());

    expect(await screen.findByText('3 results')).toBeOnTheScreen();
    expect(listProps().data.map((book) => book.handle)).toEqual(['dahl-1', 'dahl-2', 'dahl-3']);
  });

  it('never shows the no-results line for a term that is still loading', async () => {
    await renderScreen();
    await searchFor('zzqxv');
    expect(screen.getByText(OFF_NONE)).toBeOnTheScreen();
    let release: () => void = () => undefined;
    mockFetchSearch.mockImplementationOnce(
      ({ term, after }) =>
        new Promise((resolve) => {
          release = () => resolve(results(term, COUNTS[term] ?? 0, after));
        }),
    );

    await type('harry');
    await waitPastPause();
    await waitFor(() => expect(terms()).toEqual(['zzqxv', 'harry']));

    expect(screen.queryByText(OFF_NONE)).not.toBeOnTheScreen();
    expect(screen.queryByText(/No results found/)).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();

    await act(async () => release());
    expect(await screen.findByText('7 results')).toBeOnTheScreen();
  });

  it('lets a card open on the first tap with the keyboard up, and hides it on scroll', async () => {
    await renderScreen();
    await searchFor('harry');

    expect(listProps().keyboardShouldPersistTaps).toBe('handled');
    expect(listProps().keyboardDismissMode).toBe('on-drag');
  });

  it('closes the keyboard when the screen loses focus', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    await renderScreen();
    const cleanup = mockFocusEffect?.();

    expect(dismiss).not.toHaveBeenCalled();
    if (typeof cleanup === 'function') cleanup();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('leaves room for Android’s navigation bar (D-080)', async () => {
    await renderScreen();
    await searchFor('harry');

    const style = StyleSheet.flatten(listProps().contentContainerStyle as object) as {
      paddingBottom?: number;
    };
    expect(style.paddingBottom).toBe(34 + 24);
  });
});

describe('"Available now" and the sort', () => {
  it('offers no Genre and no Price filter (P6-07 answer 4, P6-08 answer 4)', async () => {
    await renderScreen();
    await searchFor('harry');

    expect(screen.queryByTestId('genre')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('price')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Price/ })).not.toBeOnTheScreen();
    expect(screen.queryByTestId('filter-row')).not.toBeOnTheScreen();
    expect(Object.keys(mockFetchSearch.mock.calls[0]?.[0].search ?? {}).sort()).toEqual([
      'available',
      'sort',
    ]);
  });

  it('starts with "Available now" off and Relevance, as on the website', async () => {
    await renderScreen();
    await searchFor('harry');

    expect(screen.getByRole('switch', { name: 'Available now' }).props.value).toBe(false);
    expect(screen.getByRole('button', { name: 'Sort, Relevance' })).toBeOnTheScreen();
    expect(mockFetchSearch.mock.calls[0]?.[0].search).toEqual({
      available: false,
      sort: 'relevance',
    });
  });

  it('reads again with "Available now" on', async () => {
    await renderScreen();
    await searchFor('harry');

    await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', true);

    await waitFor(() =>
      expect(mockFetchSearch.mock.calls.at(-1)?.[0].search).toEqual({
        available: true,
        sort: 'relevance',
      }),
    );
    // The new list is on screen, not the earlier one kept while it loaded.
    expect(await screen.findByText('7 results')).toBeOnTheScreen();
  });

  it('offers Relevance and the two price sorts only, and reads with the one picked', async () => {
    await renderScreen();
    await searchFor('harry');
    await fireEvent.press(screen.getByRole('button', { name: 'Sort, Relevance' }));

    for (const name of ['Relevance', 'Price, low to high', 'Price, high to low']) {
      expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Featured' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Best selling' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Price, high to low' }));

    await waitFor(() =>
      expect(mockFetchSearch.mock.calls.at(-1)?.[0].search).toEqual({
        available: false,
        sort: 'price-descending',
      }),
    );
    expect(screen.getByRole('button', { name: 'Sort, Price, high to low' })).toBeOnTheScreen();
    expect(await screen.findByText('7 results')).toBeOnTheScreen();
  });
});

describe('offline and errors (D-078, D-082)', () => {
  it('says it is offline, with "Try again", when nothing is saved', async () => {
    onlineManager.setOnline(false);
    await renderScreen();
    await type('harry');
    await waitPastPause();

    expect(
      await screen.findByText("You're offline. Check your connection and try again."),
    ).toBeOnTheScreen();
  });

  it('shows the error and "Try again", which re-reads the network first', async () => {
    mockFetchSearch.mockRejectedValueOnce(
      new StorefrontError('http-error', { operationName: 'SearchBooks', status: 500 }),
    );
    await renderScreen();
    await type('harry');
    await waitPastPause();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('7 results')).toBeOnTheScreen();
    expect(mockRecheckNetwork).toHaveBeenCalled();
  });

  it('shows the error, not the earlier results, when a new term fails', async () => {
    await renderScreen();
    await searchFor('harry');
    mockFetchSearch.mockRejectedValueOnce(
      new StorefrontError('graphql-error', { operationName: 'SearchBooks' }),
    );

    await type('dahl');
    await waitPastPause();

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    expect(screen.queryByText('harry-1')).not.toBeOnTheScreen();
  });
});

describe('privacy (D-097)', () => {
  it('never logs the term and never puts it in a route', async () => {
    const consoleCalls = (['log', 'info', 'warn', 'error', 'debug'] as const).map((name) =>
      jest.spyOn(console, name).mockImplementation(() => undefined),
    );
    await renderScreen();
    await searchFor('harry');
    await fireEvent.press(screen.getByRole('link', { name: /harry-1/ }));

    for (const spy of consoleCalls) expect(JSON.stringify(spy.mock.calls)).not.toContain('harry');
    // The only route opened is the book page, by its handle; the term is no parameter.
    expect(mockPush.mock.calls).toEqual([
      [{ pathname: '/book/[handle]', params: { handle: 'harry-1' } }],
    ]);
  });
});

describe('the search usage event (P6-09, D-108, D-109)', () => {
  const sent = () => mockSendEvent.mock.calls;
  const idOf = (handle: string) => collectionGid(handle).slice('gid://shopify/Collection/'.length);

  // These tests wait out the real 2 seconds, sometimes twice, so each has more than Jest's 5.
  const LONG = 15_000;

  /** Longer than the 2 seconds a term's results stay on screen before its event. */
  async function waitPastTwoSeconds() {
    await act(() => new Promise((resolve) => setTimeout(resolve, 2100)));
  }

  function dahlBooks(): SearchBooksPage {
    const books = ['the-bfg', 'matilda', 'danny'].map((handle) => {
      const result = toBookCard(
        bookProduct({ handle, title: handle, vendor: 'Roald Dahl' }),
        CONFIG,
      );
      if (result === null) throw new Error('expected a card');
      return result;
    });
    return { books, totalCount: 3, nextCursor: null };
  }

  it(
    'is sent 2 seconds after a typed term’s results show: its length, the count, a series',
    async () => {
      await renderScreen();
      await searchFor('harry');
      expect(sent()).toEqual([]);

      await waitPastTwoSeconds();

      expect(sent()).toEqual([
        [
          'search',
          {
            term_length: 5,
            result_count: 7,
            match_type: 'series',
            match_id: idOf('harry-potter-series'),
          },
        ],
      ]);
    },
    LONG,
  );

  it(
    'is sent at once after the search key, here for the author, by the store’s name',
    async () => {
      mockFetchSearch.mockImplementation(async ({ term, after }) =>
        term === 'dahl' ? dahlBooks() : results(term, 0, after),
      );
      await renderScreen();
      await type('dahl');
      await fireEvent(field(), 'submitEditing');

      await waitFor(() =>
        expect(sent()).toEqual([
          [
            'search',
            { term_length: 4, result_count: 3, match_type: 'author', match_id: 'roald_dahl' },
          ],
        ]),
      );
      await waitPastTwoSeconds();
      expect(sent()).toHaveLength(1);
    },
    LONG,
  );

  it(
    'says other, with no match_id, for a term that matches nothing and finds nothing',
    async () => {
      await renderScreen();
      await searchFor('zzqxv');
      await waitPastTwoSeconds();

      expect(sent()).toEqual([
        ['search', { term_length: 5, result_count: 0, match_type: 'other' }],
      ]);
    },
    LONG,
  );

  it(
    'matches a series the store has even when the search finds nothing',
    async () => {
      await renderScreen();
      await searchFor('tintin');
      await waitPastTwoSeconds();

      expect(sent()).toEqual([
        [
          'search',
          {
            term_length: 6,
            result_count: 0,
            match_type: 'series',
            match_id: idOf('tintin-series'),
          },
        ],
      ]);
    },
    LONG,
  );

  it(
    'is sent at once when a book is opened before the 2 seconds (owner, plan review)',
    async () => {
      await renderScreen();
      await searchFor('harry');

      await fireEvent.press(screen.getByRole('link', { name: /harry-2/ }));

      expect(sent()).toHaveLength(1);
      expect(sent()[0]?.[0]).toBe('search');
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/book/[handle]',
        params: { handle: 'harry-2' },
      });
      await waitPastTwoSeconds();
      expect(sent()).toHaveLength(1);
    },
    LONG,
  );

  it(
    'is not sent again for "Available now", the sort or the same term later',
    async () => {
      await renderScreen();
      await searchFor('harry');
      await waitPastTwoSeconds();

      await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', true);
      await searchSettled();
      await searchFor('Harry');
      await waitPastTwoSeconds();

      expect(sent()).toHaveLength(1);
    },
    LONG,
  );

  it(
    'is not sent for a term cleared before the 2 seconds',
    async () => {
      await renderScreen();
      await searchFor('harry');

      await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
      await waitPastTwoSeconds();

      expect(sent()).toEqual([]);
    },
    LONG,
  );

  it(
    'never carries a typed word that is not the store’s own code',
    async () => {
      await renderScreen();
      await searchFor('priya sharma');
      await waitPastTwoSeconds();

      expect(sent()).toEqual([
        ['search', { term_length: 11, result_count: 0, match_type: 'other' }],
      ]);
      expect(JSON.stringify(sent())).not.toMatch(/priya|sharma/i);
      expect(mockReportAnalytics).not.toHaveBeenCalled();
    },
    LONG,
  );

  it(
    'is not sent without consent',
    async () => {
      mockConsent = false;
      await renderScreen();
      await searchFor('harry');
      await waitPastTwoSeconds();

      expect(sent()).toEqual([]);
    },
    LONG,
  );
});

describe('the wanted list in the search event (P6-11, D-117)', () => {
  const sent = () => mockSendEvent.mock.calls;
  const LONG = 15_000;

  async function waitPastTwoSeconds() {
    await act(() => new Promise((resolve) => setTimeout(resolve, 2100)));
  }

  it(
    'sends wanted with the listed name’s code for a search that finds nothing',
    async () => {
      await renderScreen();
      await searchFor('walliams');
      await waitPastTwoSeconds();

      expect(sent()).toEqual([
        [
          'search',
          { term_length: 8, result_count: 0, match_type: 'wanted', match_id: 'david_walliams' },
        ],
      ]);
      expect(mockReportAnalytics).not.toHaveBeenCalled();
      // The list parsed with nothing dropped: no Remote Config report (D-116).
      expect(mockReportRemoteConfig).not.toHaveBeenCalled();
    },
    LONG,
  );

  it(
    'sends other when "Available now" was switched on before the term (the phone check’s steps)',
    async () => {
      await renderScreen();
      // Each term with the search key, as in the phone check, so zzqxv's event is sent at once.
      await type('zzqxv');
      await fireEvent(field(), 'submitEditing');
      await waitFor(() => expect(sent()).toHaveLength(1));
      await fireEvent(screen.getByRole('switch', { name: 'Available now' }), 'valueChange', true);
      await searchSettled();
      await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
      await type('walliams');
      await fireEvent(field(), 'submitEditing');
      await waitFor(() => expect(sent()).toHaveLength(2));
      await searchSettled();

      expect(mockFetchSearch.mock.calls.at(-1)?.[0]).toMatchObject({
        term: 'walliams',
        search: { available: true },
      });
      expect(sent()).toEqual([
        ['search', { term_length: 5, result_count: 0, match_type: 'other' }],
        ['search', { term_length: 8, result_count: 0, match_type: 'other' }],
      ]);
    },
    LONG,
  );
});
