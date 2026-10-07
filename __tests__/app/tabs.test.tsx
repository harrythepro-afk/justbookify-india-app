import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { ScrollView } from 'react-native';

import RootLayout from '@/app/_layout';
import TabLayout from '@/app/(tabs)/_layout';
import AccountScreen from '@/app/(tabs)/account';
import BrowseScreen from '@/app/(tabs)/browse';
import CartScreen from '@/app/(tabs)/cart';
import HomeScreen from '@/app/(tabs)/index';
import MyBooksScreen from '@/app/(tabs)/my-books';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockAppEnv = 'development';

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
}));

// The root layout starts the feature flags; Remote Config itself never loads in tests.
jest.mock('@/featureFlags/remoteConfig', () => ({
  activateLastFetched: () => Promise.resolve({}),
  fetchForNextLaunch: () => Promise.resolve(),
}));

// The root layout starts analytics; Firebase Analytics and the consent store never load in
// tests, and with no stored consent nothing is sent.
jest.mock('@/analytics/firebase', () => ({
  turnCollectionOn: () => Promise.resolve(),
  turnCollectionOff: () => Promise.resolve(),
  clearAnalyticsData: () => Promise.resolve(),
  sendEvent: () => Promise.resolve(),
  sendScreenView: () => Promise.resolve(),
}));

// The root layout's query provider follows the network state (D-064). jest-expo's automatic mock
// of expo-network returns no subscription, so the phone is shown as online here.
jest.mock('expo-network', () => ({
  NetworkStateType: { NONE: 'NONE', UNKNOWN: 'UNKNOWN', WIFI: 'WIFI' },
  addNetworkStateListener: () => ({ remove: () => undefined }),
  getNetworkStateAsync: () => Promise.resolve({ isConnected: true, type: 'WIFI' }),
}));

jest.mock('@/analytics/consentStorage', () => ({
  readStoredConsent: () => Promise.resolve(null),
  writeStoredConsent: () => Promise.resolve(),
  deleteStoredConsent: () => Promise.resolve(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

function renderApp() {
  return renderRouter({
    _layout: RootLayout,
    '(tabs)/_layout': TabLayout,
    '(tabs)/index': HomeScreen,
    '(tabs)/browse': BrowseScreen,
    '(tabs)/cart': CartScreen,
    '(tabs)/my-books': MyBooksScreen,
    '(tabs)/account': AccountScreen,
  });
}

const TABS = [
  ['Browse', 'Books for Rent', '/browse'],
  ['Cart', 'Cart', '/cart'],
  ['My Books', 'My Books', '/my-books'],
  ['Account', 'Account', '/account'],
  ['Home', 'Home', '/'],
] as const;

describe('tab navigation', () => {
  beforeEach(() => {
    mockAppEnv = 'development';
  });

  // renderRouter switches to fake timers.
  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens on the Home tab', async () => {
    const app = renderApp();
    await app;

    expect(app.getPathname()).toBe('/');
    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
  });

  it('shows five tabs with their labels, in order', async () => {
    await renderApp();

    const tabs = screen
      .getAllByRole('button')
      .filter((element) =>
        ['Home', 'Browse', 'Cart', 'My Books', 'Account'].some((label) =>
          String(element.props.accessibilityLabel ?? '').startsWith(label),
        ),
      );
    expect(tabs.map((tab) => String(tab.props.accessibilityLabel).split(',')[0])).toEqual([
      'Home',
      'Browse',
      'Cart',
      'My Books',
      'Account',
    ]);
  });

  it.each(TABS)('opens the %s tab and its placeholder screen', async (label, heading, pathname) => {
    const app = renderApp();
    await app;
    // Home is already open, so leave it first to prove that its tab brings it back.
    if (pathname === '/') await fireEvent.press(screen.getByLabelText(/^Cart/));

    await fireEvent.press(screen.getByLabelText(new RegExp(`^${label}`)));

    expect(app.getPathname()).toBe(pathname);
    expect(screen.getByRole('header', { name: heading })).toBeOnTheScreen();
  });

  it('shows the environment banner above the tabs on a development build', async () => {
    await renderApp();

    expect(screen.getByText('Development build')).toBeOnTheScreen();
  });

  it('shows no banner on a production build', async () => {
    mockAppEnv = 'production';

    await renderApp();

    expect(screen.queryByTestId('environment-banner')).not.toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
  });
});
