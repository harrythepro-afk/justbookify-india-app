import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FlatList, Keyboard, Modal, ScrollView, Switch, StyleSheet, TextInput } from 'react-native';

import SearchScreen from '@/app/search';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { SearchBooksPage, SearchOptions } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct } from '../helpers/catalogue';
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
}));

const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

type FetchOptions = { term: string; after: string | null; search: SearchOptions };

const mockFetchSearch = jest.fn<Promise<SearchBooksPage>, [FetchOptions]>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchSearchPage: (options: FetchOptions) => mockFetchSearch(options),
}));

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

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

beforeEach(() => {
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
  });

  it('shows the hint again when the term is shortened below the minimum', async () => {
    await renderScreen();
    await searchFor('harry');
    await type('ha');

    expect(screen.getByText(HINT)).toBeOnTheScreen();
    expect(screen.queryByTestId('search-books')).not.toBeOnTheScreen();
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
