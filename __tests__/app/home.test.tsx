import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AnalyticsConsentState } from '@/analytics/consent';
import HomeScreen from '@/app/(tabs)/index';
import type { FeatureFlagState } from '@/featureFlags/session';

let mockAppEnv = 'development';
let mockCrashReportingOn = true;
const mockSendTestError = jest.fn();
const mockTriggerTestNativeCrash = jest.fn();

jest.mock('@/crashReporting/sentry', () => ({
  isCrashReportingOn: () => mockCrashReportingOn,
  sendTestError: () => mockSendTestError(),
  triggerTestNativeCrash: () => mockTriggerTestNativeCrash(),
}));

let mockFlagState: FeatureFlagState = { status: 'not ready' };
let mockConsent: AnalyticsConsentState = { consent: 'loading', busy: false, saveFailed: false };

jest.mock('@/analytics/consent', () => ({
  useAnalyticsConsent: () => mockConsent,
}));

jest.mock('@/featureFlags/session', () => ({
  useFeatureFlags: () => mockFlagState,
}));

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Link: ({ href, children }: { href: string; children: string }) => (
      <Text accessibilityHint={href}>{children}</Text>
    ),
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

// The app gets this provider from Expo Router; a screen rendered alone needs its own.
const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function SafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={SAFE_AREA}>{children}</SafeAreaProvider>;
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockAppEnv = 'development';
    mockCrashReportingOn = true;
    mockFlagState = { status: 'not ready' };
    mockConsent = { consent: 'loading', busy: false, saveFailed: false };
    jest.clearAllMocks();
  });

  it('shows its heading and placeholder message', async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.getByRole('header', { name: 'Home' })).toBeOnTheScreen();
    expect(
      screen.getByText('Popular series, age groups and new arrivals will appear here.'),
    ).toBeOnTheScreen();
  });

  it('links to the test checkout screen on a development build', async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

    const link = screen.getByText('Open the test checkout screen');
    expect(link).toBeOnTheScreen();
    expect(link.props.accessibilityHint).toBe('/dev-checkout');
  });

  it.each(['staging', 'production'])(
    'does not link to the test checkout screen on a %s build',
    async (env) => {
      mockAppEnv = env;

      await render(<HomeScreen />, { wrapper: SafeArea });

      expect(screen.queryByText('Open the test checkout screen')).not.toBeOnTheScreen();
    },
  );

  it('links to the book card preview on a development build', async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

    const link = screen.getByText('Open the book card preview');
    expect(link.props.accessibilityHint).toBe('/dev-catalogue');
  });

  it.each(['staging', 'production'])(
    'does not link to the book card preview on a %s build',
    async (env) => {
      mockAppEnv = env;

      await render(<HomeScreen />, { wrapper: SafeArea });

      expect(screen.queryByText('Open the book card preview')).not.toBeOnTheScreen();
    },
  );

  it('sends a test error to Sentry on a development build', async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

    fireEvent.press(screen.getByRole('button', { name: 'Send a test error to Sentry' }));

    expect(mockSendTestError).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Test error sent. Check Sentry.')).toBeOnTheScreen();
  });

  it("triggers Sentry's native test crash on a development build", async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.getByText('The app will close; reopen it to send the report.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Trigger a native crash (test)' }));

    expect(mockTriggerTestNativeCrash).toHaveBeenCalledTimes(1);
  });

  it('says crash reporting is off, with no test controls, when no DSN is set', async () => {
    mockCrashReportingOn = false;

    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.getByText('Crash reporting is off (no DSN).')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('says the feature flags are not ready before local activation', async () => {
    await render(<HomeScreen />, { wrapper: SafeArea });

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

      await render(<HomeScreen />, { wrapper: SafeArea });

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

    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(
      screen.getByText('Remote Config fetch for the next launch: not started'),
    ).toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no feature flag line on a %s build', async (env) => {
    mockAppEnv = env;

    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.queryByText(/Feature flags|checkout_presentation/)).not.toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no crash test controls on a %s build', async (env) => {
    mockAppEnv = env;

    await render(<HomeScreen />, { wrapper: SafeArea });

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

    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.getByText(line)).toBeOnTheScreen();
  });

  it.each(['staging', 'production'])('shows no analytics line on a %s build', async (env) => {
    mockAppEnv = env;

    await render(<HomeScreen />, { wrapper: SafeArea });

    expect(screen.queryByText(/^Analytics:/)).not.toBeOnTheScreen();
  });
});
