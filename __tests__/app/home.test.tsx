import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { ScrollView, StyleSheet } from 'react-native';

import type { AnalyticsConsentState } from '@/analytics/consent';
import type { AnalyticsToken } from '@/analytics/ids';
import HomeScreen from '@/app/(tabs)/index';
import { HOME_CONTENT } from '@/config';
import type {
  CustomerSessionState,
  DevelopmentSessionInfo,
  RefreshOutcome,
} from '@/customerAccount/session';
import type { FeatureFlagState } from '@/featureFlags/session';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { CollectionBooksPage } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct, collectionGid, collectionMap } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';
import { loadCartId } from '@/shopify/cartId';

// The card's cart button loads the analytics events (P8-01); nothing is sent here.
jest.mock('@/analytics/firebase', () => ({}));

// The cart (P8-01): cards and the book page draw "Add to Cart"; no cart is stored on this phone.
jest.mock('@/shopify/cartStorage', () => ({
  readStoredCartId: () => Promise.resolve(null),
  writeStoredCartId: () => Promise.resolve(),
  deleteStoredCartId: () => Promise.resolve(),
}));
// The stored cart is read before any screen draws, so no test sees it arrive after its end.
beforeAll(() => loadCartId());

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockAppEnv = 'development';
let mockCrashReportingOn = true;
const mockSendTestError = jest.fn();
const mockTriggerTestNativeCrash = jest.fn();

jest.mock('@/crashReporting/sentry', () => ({
  isCrashReportingOn: () => mockCrashReportingOn,
  sendTestError: () => mockSendTestError(),
  triggerTestNativeCrash: () => mockTriggerTestNativeCrash(),
  reportStorefrontProblem: jest.fn(),
  reportUnexpectedDataError: jest.fn(),
}));

let mockFlagState: FeatureFlagState = { status: 'not ready' };
let mockConsent: AnalyticsConsentState = { consent: 'loading', busy: false, saveFailed: false };

// Home's development tools show the login state (P7-01); the session itself is tested on its own.
let mockCustomerSession: CustomerSessionState = {
  status: 'signedOut',
  notice: 'none',
  loggingIn: false,
};
let mockDevelopmentInfo: DevelopmentSessionInfo | undefined;
const mockRefreshSession = jest.fn<Promise<RefreshOutcome>, []>();
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockCustomerSession,
  getDevelopmentSessionInfo: () => mockDevelopmentInfo,
  refreshSession: () => mockRefreshSession(),
}));

const mockResetConsent = jest.fn();
jest.mock('@/analytics/consent', () => ({
  useAnalyticsConsent: () => mockConsent,
  resetAnalyticsConsent: () => mockResetConsent(),
}));

jest.mock('@/featureFlags/session', () => ({
  useFeatureFlags: () => mockFlagState,
}));

// A link's target is put in its accessibility hint, so tests can read where it leads.
type MockHref = string | { pathname: string; params: { handle: string } };
// A book card opens its page through the router (P6-05).
const mockPush = jest.fn();
jest.mock('expo-router', () => {
  const { cloneElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual('react-native');
  const target = (href: MockHref) =>
    typeof href === 'string' ? href : href.pathname.replace('[handle]', href.params.handle);
  return {
    Link: ({
      href,
      asChild,
      children,
    }: {
      href: MockHref;
      asChild?: boolean;
      children: React.ReactElement | string;
    }) =>
      asChild === true && typeof children !== 'string' ? (
        cloneElement(children as React.ReactElement<{ accessibilityHint?: string }>, {
          accessibilityHint: target(href),
        })
      ) : (
        <Text accessibilityHint={target(href)}>{children}</Text>
      ),
    useFocusEffect: () => undefined,
    router: { push: (href: MockHref) => mockPush(href) },
  };
});

// The getter reads mockAppEnv when the screen renders, after the import hoisting has settled.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

// "Try again" re-reads the network before it refetches (D-082).
const mockRecheckNetwork = jest.fn(() => Promise.resolve());
jest.mock('@/query/online', () => ({
  ...jest.requireActual('@/query/online'),
  recheckNetwork: () => mockRecheckNetwork(),
}));

const mockFetchHandles = jest.fn<Promise<ReadonlyMap<string, string>>, []>();
const mockFetchPage = jest.fn<Promise<CollectionBooksPage>, [{ handle: string }]>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchCollectionHandles: () => mockFetchHandles(),
  fetchCollectionBooksPage: (options: { handle: string }) => mockFetchPage(options),
}));

// The development store's 23 collections (`TESTING.md`, "Sample catalogue (P6-01)"): 5 of the 15
// series, all 5 age groups and new-arrivals.
const DEV_STORE_HANDLES = collectionMap([
  'frontpage',
  'early-readers',
  'emerging-readers',
  'junior-readers',
  'pre-teen-readers',
  'teenage-readers',
  'harry-potter-series',
  'wimpy-kid-series',
  'geronimo-stilton',
  'my-hero-academia',
  'secret-seven-series',
  'read-it-yourself',
  'manga-collections',
  'cat-kid-comic-club',
  'roald-dahl',
  'ruskin-bond',
  'enid-blyton',
  'jeff-kinney',
  'sudha-murthy',
  'j-k-rowling',
  'julia-donaldson',
  'new-arrivals',
  'tintin-series',
]);

const CONFIG = { currencyCode: 'INR', language: 'EN', country: 'IN' };

function card(index: number, availableForSale = true): BookCard {
  const result = toBookCard(
    bookProduct({ handle: `new-${index}`, title: `New book ${index}`, availableForSale }),
    CONFIG,
  );
  if (result === null) throw new Error('expected a card');
  return result;
}

function arrivals(count: number): CollectionBooksPage {
  return {
    kind: 'found',
    id: collectionGid('new-arrivals'),
    title: 'New Arrivals',
    books: Array.from({ length: count }, (_, index) => card(index + 1, index !== 1)),
    nextCursor: null,
  };
}

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });
const NO_NETWORK = new StorefrontError('no-network', { operationName: 'X' });

let client: QueryClient;

/** Renders Home and waits until nothing on it is still loading. */
/** The accessible names of every button on screen. */
function buttonNames(): (string | undefined)[] {
  return screen
    .queryAllByRole('button')
    .map((button) => button.props.accessibilityLabel as string | undefined);
}

/** The buttons besides the new arrivals' "Add to Cart" (P8-01), which the D-081 test checks. */
function otherButtonNames(): (string | undefined)[] {
  return buttonNames().filter((name) => name === undefined || !/^Add .* to cart$/.test(name));
}

async function renderHome() {
  await render(<HomeScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

/** Where Home's collection links lead. Book cards, which open book pages, are left out. */
function linkTargets(): string[] {
  return screen
    .getAllByRole('link')
    .filter((link) => !String(link.props.testID ?? '').startsWith('book-card-open-'))
    .map((link) => (link.props as { accessibilityHint?: string }).accessibilityHint ?? '');
}

beforeEach(() => {
  client = createTestQueryClient();
  mockPush.mockReset();
  mockAppEnv = 'development';
  mockCrashReportingOn = true;
  mockFlagState = { status: 'not ready' };
  mockConsent = { consent: 'loading', busy: false, saveFailed: false };
  mockCustomerSession = { status: 'signedOut', notice: 'none', loggingIn: false };
  mockDevelopmentInfo = undefined;
  jest.clearAllMocks();
  mockFetchHandles.mockReset().mockResolvedValue(DEV_STORE_HANDLES);
  mockFetchPage.mockReset().mockResolvedValue(arrivals(5));
});

afterEach(async () => {
  await tearDownQueryClient(client);
  onlineManager.setOnline(true);
});

describe('HomeScreen (P6-03)', () => {
  it('shows the store name and the banner', async () => {
    await renderHome();

    expect(screen.getByRole('header', { name: 'JustBookify' })).toBeOnTheScreen();
    expect(
      screen.getByRole('header', { name: "Children's books rental in Bengaluru" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText('Now delivering across South India. No subscription. No deposit.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Books for Rent' }).props.accessibilityHint).toBe(
      '/browse',
    );
  });

  it('has one search button in the header, and no other search text (P6-06)', async () => {
    await renderHome();

    expect(screen.getAllByRole('button', { name: /search/i })).toHaveLength(1);
    expect(screen.queryByText(/search/i)).not.toBeOnTheScreen();
  });

  it('shows only the series, authors and age groups the store has, in order', async () => {
    await renderHome();

    expect(linkTargets()).toEqual([
      '/browse',
      '/collection/wimpy-kid-series',
      '/collection/harry-potter-series',
      '/collection/tintin-series',
      '/collection/geronimo-stilton',
      '/collection/read-it-yourself',
      '/browse',
      // "Popular authors" (P6-10, D-114): the 7 of 12 the development store has.
      '/collection/julia-donaldson',
      '/collection/enid-blyton',
      '/collection/sudha-murthy',
      '/collection/roald-dahl',
      '/collection/ruskin-bond',
      '/collection/jeff-kinney',
      '/collection/j-k-rowling',
      '/collection/early-readers',
      '/collection/emerging-readers',
      '/collection/junior-readers',
      '/collection/pre-teen-readers',
      '/collection/teenage-readers',
      '/collection/new-arrivals',
    ]);
    expect(screen.getByRole('link', { name: 'Tintin' })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'All series' })).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: '9-10 years' })).toBeOnTheScreen();
    expect(screen.queryByText('Dog Man')).not.toBeOnTheScreen();
    expect(screen.queryByText('Ella Diaries')).not.toBeOnTheScreen();
    expect(mockFetchHandles).toHaveBeenCalledTimes(1);
  });

  describe('"Popular authors" (P6-10, D-114)', () => {
    /** The text of each heading on Home, in order. */
    function headings(): string[] {
      return screen
        .getAllByRole('header')
        .map((node) => String((node.props as { children?: unknown }).children));
    }

    it('comes after "Popular series" and before "Browse by age"', async () => {
      await renderHome();

      const order = headings();
      expect(order.indexOf('Popular authors')).toBe(order.indexOf('Popular series') + 1);
      expect(order.indexOf('Browse by age')).toBe(order.indexOf('Popular authors') + 1);
    });

    it("shows the authors the store has, in the website's order and with its names", async () => {
      await renderHome();

      const row = within(screen.getByTestId('popular-authors'));
      expect(row.getAllByRole('link')).toHaveLength(7);
      expect(
        row.getAllByRole('link').map((link) => within(link).getByText(/./).props.children),
      ).toEqual([
        'Julia Donaldson',
        'Enid Blyton',
        'Sudha Murty',
        'Roald Dahl',
        'Ruskin Bond',
        'Jeff Kinney',
        'J. K. Rowling',
      ]);
      // Not on the development store: no tile that leads nowhere (D-076).
      for (const missing of ['R. L. Stine', 'David Walliams', 'Rick Riordan', 'R. K. Narayan']) {
        expect(screen.queryByText(missing)).not.toBeOnTheScreen();
      }
      expect(screen.queryByText('Mary Pope Osborne')).not.toBeOnTheScreen();
      expect(row.queryByText('All authors')).not.toBeOnTheScreen();
    });

    it('opens an author on its collection screen', async () => {
      await renderHome();

      expect(
        (screen.getByRole('link', { name: 'Roald Dahl' }).props as { accessibilityHint?: string })
          .accessibilityHint,
      ).toBe('/collection/roald-dahl');
    });

    it('shows every author the store has, including the store spellings of two handles', async () => {
      mockFetchHandles.mockResolvedValue(
        collectionMap(HOME_CONTENT.popularAuthors.map((link) => link.handle)),
      );
      await renderHome();

      expect(within(screen.getByTestId('popular-authors')).getAllByRole('link')).toHaveLength(12);
      expect(
        (
          screen.getByRole('link', { name: 'David Walliams' }).props as {
            accessibilityHint?: string;
          }
        ).accessibilityHint,
      ).toBe('/collection/david-williams-collection');
      expect(
        (screen.getByRole('link', { name: 'Sudha Murty' }).props as { accessibilityHint?: string })
          .accessibilityHint,
      ).toBe('/collection/sudha-murthy');
    });

    it('leaves the row out when the store has none of the authors', async () => {
      mockFetchHandles.mockResolvedValue(collectionMap(['harry-potter-series', 'early-readers']));
      await renderHome();

      expect(screen.queryByText('Popular authors')).not.toBeOnTheScreen();
      expect(screen.queryByTestId('popular-authors')).not.toBeOnTheScreen();
      expect(screen.getByText('Popular series')).toBeOnTheScreen();
    });
  });

  it('reads the new arrivals by handle and shows the first 6 books with "See all"', async () => {
    mockFetchPage.mockResolvedValue(arrivals(8));

    await renderHome();

    expect(mockFetchPage.mock.calls.map(([options]) => options.handle)).toEqual(['new-arrivals']);
    expect(screen.getByRole('header', { name: 'New arrivals' })).toBeOnTheScreen();
    expect(screen.getByText('New book 6')).toBeOnTheScreen();
    expect(screen.queryByText('New book 7')).not.toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'See all new arrivals' }).props.accessibilityHint).toBe(
      '/collection/new-arrivals',
    );
  });

  it('opens the book page of a new arrival when its card is tapped (P6-05)', async () => {
    await renderHome();

    fireEvent.press(screen.getByTestId('book-card-open-new-3'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/book/[handle]',
      params: { handle: 'new-3' },
    });
  });

  // P8-01 ends D-081 for the cart: each orderable new arrival has "Add to Cart". The rented-out
  // one has no button, because notify-me is not wired yet (D-081).
  it('shows "Add to Cart" on orderable books and no notify-me button (P8-01, D-081)', async () => {
    mockAppEnv = 'production';

    await renderHome();

    expect(screen.getByText('New book 2')).toBeOnTheScreen();
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    // The header's search button (P6-06), then one cart button per orderable book.
    expect(buttonNames()).toEqual([
      'Search',
      'Add New book 1 to cart',
      'Add New book 3 to cart',
      'Add New book 4 to cart',
      'Add New book 5 to cart',
    ]);
  });

  it.each([
    ['missing', { kind: 'not-found' } as const],
    ['empty', arrivals(0)],
  ])('hides "New arrivals" when the collection is %s', async (_case, page) => {
    mockFetchPage.mockResolvedValue(page);

    await renderHome();

    expect(screen.getByRole('link', { name: 'Tintin' })).toBeOnTheScreen();
    expect(screen.queryByText('New arrivals')).not.toBeOnTheScreen();
    expect(screen.queryByText('See all')).not.toBeOnTheScreen();
  });

  it('shows no tile before the handles are known', async () => {
    mockFetchHandles.mockReturnValue(new Promise(() => undefined));

    await render(<HomeScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('New book 1')).toBeOnTheScreen();
    expect(screen.queryByText('Popular series')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });
});

describe('HomeScreen states (D-078)', () => {
  it('says it is offline, with "Try again", when nothing is saved', async () => {
    onlineManager.setOnline(false);

    await render(<HomeScreen />, { wrapper: withScreen(client) });

    expect(
      await screen.findByText("You're offline. Check your connection and try again."),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
    // The header and banner are local and still show.
    expect(screen.getByRole('link', { name: 'Books for Rent' })).toBeOnTheScreen();
    expect(mockFetchHandles).not.toHaveBeenCalled();
  });

  it('shows a thin notice over saved books when it goes offline', async () => {
    await renderHome();

    await act(async () => {
      onlineManager.setOnline(false);
    });

    expect(await screen.findByText("You're offline. Showing saved books.")).toBeOnTheScreen();
    expect(screen.getByText('New book 1')).toBeOnTheScreen();
    expect(screen.getByRole('link', { name: 'Tintin' })).toBeOnTheScreen();
  });

  it('shows no notice while online', async () => {
    await renderHome();

    expect(screen.queryByTestId('offline-notice')).not.toBeOnTheScreen();
  });

  it('says it is offline when Shopify cannot be reached, even if the phone says online', async () => {
    mockFetchHandles.mockRejectedValue(NO_NETWORK);
    mockFetchPage.mockRejectedValue(NO_NETWORK);

    await render(<HomeScreen />, { wrapper: withScreen(client) });

    expect(
      await screen.findByText("You're offline. Check your connection and try again."),
    ).toBeOnTheScreen();
  });

  it('says something went wrong, in our words, and "Try again" reloads', async () => {
    mockFetchHandles.mockRejectedValueOnce(HTTP_ERROR);
    mockFetchPage.mockRejectedValueOnce(HTTP_ERROR);

    await render(<HomeScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    expect(screen.queryByText(/HTTP|500|Storefront/)).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Tintin' })).toBeOnTheScreen();
    expect(await screen.findByText('New book 1')).toBeOnTheScreen();
    expect(mockRecheckNetwork).toHaveBeenCalledTimes(1);
    expect(mockRecheckNetwork.mock.invocationCallOrder[0]).toBeLessThan(
      mockFetchHandles.mock.invocationCallOrder[1] ?? 0,
    );
    expect(screen.queryByText('Something went wrong. Please try again.')).not.toBeOnTheScreen();
  });

  it('shows what loaded when one part fails, and the failed part says so', async () => {
    mockFetchHandles.mockRejectedValueOnce(HTTP_ERROR);

    await render(<HomeScreen />, { wrapper: withScreen(client) });

    expect(await screen.findByText('New book 1')).toBeOnTheScreen();
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('link', { name: 'Tintin' })).toBeOnTheScreen();
    expect(mockFetchPage).toHaveBeenCalledTimes(1);
  });
});

describe('HomeScreen development tools', () => {
  it('links to the test checkout screen on a development build', async () => {
    await renderHome();

    const link = screen.getByText('Open the test checkout screen');
    expect(link).toBeOnTheScreen();
    expect(link.props.accessibilityHint).toBe('/dev-checkout');
  });

  it.each(['staging', 'production'])(
    'does not link to the test checkout screen on a %s build',
    async (env) => {
      mockAppEnv = env;

      await renderHome();

      expect(screen.queryByText('Open the test checkout screen')).not.toBeOnTheScreen();
      expect(screen.queryByText('Development tools')).not.toBeOnTheScreen();
    },
  );

  // The development preview was removed in P8-01, once customer screens drew the card's cart
  // button (owner, P8-01; D-074, D-088).
  it.each(['development', 'staging', 'production'])(
    'does not link to the book card preview on a %s build',
    async (env) => {
      mockAppEnv = env;

      await renderHome();

      expect(screen.queryByText('Open the book card preview')).not.toBeOnTheScreen();
    },
  );

  it('sends a test error to Sentry on a development build', async () => {
    await renderHome();

    await fireEvent.press(screen.getByRole('button', { name: 'Send a test error to Sentry' }));

    expect(mockSendTestError).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Test error sent. Check Sentry.')).toBeOnTheScreen();
  });

  it("triggers Sentry's native test crash on a development build", async () => {
    await renderHome();

    expect(screen.getByText('The app will close; reopen it to send the report.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Trigger a native crash (test)' }));

    expect(mockTriggerTestNativeCrash).toHaveBeenCalledTimes(1);
  });

  it('says crash reporting is off, with no test controls, when no DSN is set', async () => {
    mockCrashReportingOn = false;

    await renderHome();

    expect(screen.getByText('Crash reporting is off (no DSN).')).toBeOnTheScreen();
    // Besides the cards' "Add to Cart" (P8-01), the header's search button (P6-06) is the only
    // button.
    expect(otherButtonNames()).toEqual(['Search']);
  });

  it('says the feature flags are not ready before local activation', async () => {
    await renderHome();

    expect(screen.getByText('Feature flags: not ready')).toBeOnTheScreen();
  });

  it.each([
    ['sheet', 'default', 'in-app default', 'failure'],
    ['browser', 'remote', 'Remote Config', 'success'],
  ] as const)(
    'shows the checkout flag as %s from the %s source, and the fetch status',
    async (value, source, label, fetch) => {
      mockFlagState = {
        status: 'ready',
        snapshot: {
          values: { checkout_presentation: value },
          sources: { checkout_presentation: source },
          malformed: [],
        },
        wantedList: { list: [], source: 'default' },
        fetch,
      };

      await renderHome();

      expect(screen.getByText(`checkout_presentation: ${value} (${label})`)).toBeOnTheScreen();
      expect(
        screen.getByText(`Remote Config fetch for the next launch: ${fetch}`),
      ).toBeOnTheScreen();
    },
  );

  it('says no fetch was started when activation failed', async () => {
    mockFlagState = {
      status: 'ready',
      snapshot: {
        values: { checkout_presentation: 'sheet' },
        sources: { checkout_presentation: 'default' },
        malformed: [],
      },
      wantedList: { list: [], source: 'default' },
      fetch: undefined,
    };

    await renderHome();

    expect(
      screen.getByText('Remote Config fetch for the next launch: not started'),
    ).toBeOnTheScreen();
    expect(screen.getByText('search_wanted_list: 0 names (in-app default)')).toBeOnTheScreen();
  });

  it.each([
    [1, 'search_wanted_list: 1 name (Remote Config)'],
    [4, 'search_wanted_list: 4 names (Remote Config)'],
  ])('shows the wanted list by its count only (%i)', async (count, line) => {
    const names = ['Zelda Quorn', 'Mira Vexley', 'Opal Thistlewood', 'Juno Brack'];
    mockFlagState = {
      status: 'ready',
      snapshot: {
        values: { checkout_presentation: 'sheet' },
        sources: { checkout_presentation: 'default' },
        malformed: [],
      },
      wantedList: {
        list: names.slice(0, count).map((name) => ({
          code: name.toLowerCase().replace(' ', '_') as AnalyticsToken,
          words: name.toLowerCase().split(' '),
        })),
        source: 'remote',
      },
      fetch: 'success',
    };

    await renderHome();

    expect(screen.getByText(line)).toBeOnTheScreen();
    // A listed name or its code is never shown (D-115).
    expect(screen.queryByText(/zelda|vexley|thistlewood|brack/i)).not.toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no feature flag line on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    expect(
      screen.queryByText(/Feature flags|checkout_presentation|search_wanted_list/),
    ).not.toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no crash test controls on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    // Besides the cards' "Add to Cart" (P8-01), the header's search button (P6-06) is the only
    // button.
    expect(otherButtonNames()).toEqual(['Search']);
    expect(screen.queryByText('Crash reporting is off (no DSN).')).not.toBeOnTheScreen();
  });

  it.each([
    ['loading', 'Analytics: consent loading'],
    ['not asked', 'Analytics: off (consent: not asked)'],
    ['denied', 'Analytics: off (consent: denied)'],
    ['granted', 'Analytics: on (consent: granted)'],
  ] as const)('shows the analytics state when consent is %s', async (consent, line) => {
    mockConsent = { consent, busy: false, saveFailed: false };

    await renderHome();

    expect(screen.getByText(line)).toBeOnTheScreen();
  });

  it('offers a button that resets the analytics choice to not asked (P7-03, D-131)', async () => {
    mockConsent = { consent: 'denied', busy: false, saveFailed: false };

    await renderHome();
    await fireEvent.press(screen.getByRole('button', { name: 'Reset analytics choice' }));

    expect(mockResetConsent).toHaveBeenCalledTimes(1);
  });

  it('disables the reset button while a change is applied, and says when it was not saved', async () => {
    mockConsent = { consent: 'not asked', busy: true, saveFailed: true };

    await renderHome();

    expect(screen.getByRole('button', { name: 'Reset analytics choice' })).toBeDisabled();
    expect(
      screen.getByText('Analytics: off (consent: not asked), last change not saved'),
    ).toBeOnTheScreen();
  });

  it('shows whether the query cache counts the phone as online, and the network log', async () => {
    await renderHome();

    expect(screen.getByText('Query cache: online')).toBeOnTheScreen();
    expect(screen.getByText('To background: none')).toBeOnTheScreen();
    expect(screen.getByText('Back to the foreground: none')).toBeOnTheScreen();
    expect(screen.getByText('Network events, newest first: none')).toBeOnTheScreen();
    expect(screen.getByText('Read on return: none')).toBeOnTheScreen();
    expect(screen.getByText('Read 3 s later: none')).toBeOnTheScreen();
  });

  it('says the query cache counts the phone as offline', async () => {
    await renderHome();

    await act(async () => {
      onlineManager.setOnline(false);
    });

    expect(await screen.findByText('Query cache: offline')).toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no connection lines on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    expect(
      screen.queryByText(/^Query cache:|^Network events|^Read on return:/),
    ).not.toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no analytics line on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    expect(screen.queryByText(/^Analytics:/)).not.toBeOnTheScreen();
  });
});

it('has a search button named "Search", at least 44 points square, that opens search (P6-06)', async () => {
  await renderHome();
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

describe('HomeScreen development tools: login (P7-01)', () => {
  const SIGNED_IN_INFO: DevelopmentSessionInfo = {
    expiresInMinutes: 59,
    lengths: { accessToken: 120, refreshToken: 140, idToken: 900, total: 1210, chunks: 1 },
  };

  it('shows the login state, and no refresh button, when signed out', async () => {
    await renderHome();

    expect(screen.getByText('Login: signedOut')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Test token refresh' })).not.toBeOnTheScreen();
  });

  it("shows the token's expiry and lengths when signed in, never the email", async () => {
    mockCustomerSession = { status: 'signedIn', email: 'reader@example.com' };
    mockDevelopmentInfo = SIGNED_IN_INFO;

    await renderHome();

    expect(screen.getByText('Login: signedIn')).toBeOnTheScreen();
    expect(screen.getByText('Access token expires in 59 min')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'Token lengths (characters): access 120, refresh 140, ID 900; stored 1210 in 1 chunk',
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/reader@example\.com/)).not.toBeOnTheScreen();
  });

  it.each([
    ['refreshed', /^Token refresh test: refreshed at \d\d:\d\d:\d\d$/],
    ['unavailable', /^Token refresh test: unavailable \(still logged in\) at /],
    ['refused', /^Token refresh test: refused by Shopify \(logged out\) at /],
  ] as const)('runs a refresh on "Test token refresh" and says %s', async (outcome, line) => {
    mockCustomerSession = { status: 'signedIn', email: 'reader@example.com' };
    mockDevelopmentInfo = SIGNED_IN_INFO;
    mockRefreshSession.mockResolvedValue(outcome);

    await renderHome();
    await fireEvent.press(screen.getByRole('button', { name: 'Test token refresh' }));

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(line)).toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no login line on a %s build', async (env) => {
    mockAppEnv = env;
    mockCustomerSession = { status: 'signedIn', email: 'reader@example.com' };
    mockDevelopmentInfo = SIGNED_IN_INFO;

    await renderHome();

    expect(screen.queryByText(/^Login:|^Token lengths|^Access token/)).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Test token refresh' })).not.toBeOnTheScreen();
  });
});
