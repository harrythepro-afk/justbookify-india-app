import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ScrollView } from 'react-native';

import type { AnalyticsConsentState } from '@/analytics/consent';
import HomeScreen from '@/app/(tabs)/index';
import type { FeatureFlagState } from '@/featureFlags/session';
import { toBookCard, type BookCard } from '@/shopify/bookCard';
import type { CollectionBooksPage } from '@/shopify/catalogue';
import { StorefrontError } from '@/shopify/errors';

import { bookProduct } from '../helpers/catalogue';
import { createTestQueryClient, tearDownQueryClient } from '../helpers/queryClient';
import { withScreen } from '../helpers/screen';

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

jest.mock('@/analytics/consent', () => ({
  useAnalyticsConsent: () => mockConsent,
}));

jest.mock('@/featureFlags/session', () => ({
  useFeatureFlags: () => mockFlagState,
}));

// A link's target is put in its accessibility hint, so tests can read where it leads.
type MockHref = string | { pathname: string; params: { handle: string } };
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

const mockFetchHandles = jest.fn<Promise<ReadonlySet<string>>, []>();
const mockFetchPage = jest.fn<Promise<CollectionBooksPage>, [{ handle: string }]>();

jest.mock('@/shopify/catalogue', () => ({
  ...jest.requireActual('@/shopify/catalogue'),
  fetchCollectionHandles: () => mockFetchHandles(),
  fetchCollectionBooksPage: (options: { handle: string }) => mockFetchPage(options),
}));

// The development store's 23 collections (`TESTING.md`, "Sample catalogue (P6-01)"): 5 of the 15
// series, all 5 age groups and new-arrivals.
const DEV_STORE_HANDLES = new Set([
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
    title: 'New Arrivals',
    books: Array.from({ length: count }, (_, index) => card(index + 1, index !== 1)),
    nextCursor: null,
  };
}

const HTTP_ERROR = new StorefrontError('http-error', { operationName: 'X', status: 500 });
const NO_NETWORK = new StorefrontError('no-network', { operationName: 'X' });

let client: QueryClient;

/** Renders Home and waits until nothing on it is still loading. */
async function renderHome() {
  await render(<HomeScreen />, { wrapper: withScreen(client) });
  await waitFor(() => expect(screen.queryAllByLabelText('Loading')).toHaveLength(0));
}

function linkTargets(): string[] {
  return screen
    .getAllByRole('link')
    .map((link) => (link.props as { accessibilityHint?: string }).accessibilityHint ?? '');
}

beforeEach(() => {
  client = createTestQueryClient();
  mockAppEnv = 'development';
  mockCrashReportingOn = true;
  mockFlagState = { status: 'not ready' };
  mockConsent = { consent: 'loading', busy: false, saveFailed: false };
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

  it('has no search button until search is built', async () => {
    await renderHome();

    expect(screen.queryByRole('button', { name: /search/i })).not.toBeOnTheScreen();
    expect(screen.queryByText(/search/i)).not.toBeOnTheScreen();
  });

  it('shows only the series and age groups the store has, in order, then "All series"', async () => {
    await renderHome();

    expect(linkTargets()).toEqual([
      '/browse',
      '/collection/wimpy-kid-series',
      '/collection/harry-potter-series',
      '/collection/tintin-series',
      '/collection/geronimo-stilton',
      '/collection/read-it-yourself',
      '/browse',
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

  it('shows no cart or notify-me button until they are wired (D-081)', async () => {
    mockAppEnv = 'production';

    await renderHome();

    expect(screen.getByText('New book 2')).toBeOnTheScreen();
    expect(screen.getByText('Rented Out')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
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

  it('links to the book card preview on a development build', async () => {
    await renderHome();

    const link = screen.getByText('Open the book card preview');
    expect(link.props.accessibilityHint).toBe('/dev-catalogue');
  });

  it.each(['staging', 'production'])(
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
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
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
      fetch: undefined,
    };

    await renderHome();

    expect(
      screen.getByText('Remote Config fetch for the next launch: not started'),
    ).toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no feature flag line on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    expect(screen.queryByText(/Feature flags|checkout_presentation/)).not.toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no crash test controls on a %s build', async (env) => {
    mockAppEnv = env;

    await renderHome();

    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
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
