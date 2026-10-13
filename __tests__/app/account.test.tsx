import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AnalyticsConsentState } from '@/analytics/consent';
import AccountScreen from '@/app/(tabs)/account';
import type { CustomerSessionState } from '@/customerAccount/session';

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

let mockConsent: AnalyticsConsentState = { consent: 'not asked', busy: false, saveFailed: false };
const mockGrant = jest.fn();
const mockWithdraw = jest.fn();

jest.mock('@/analytics/consent', () => ({
  useAnalyticsConsent: () => mockConsent,
  grantAnalyticsConsent: () => mockGrant(),
  withdrawAnalyticsConsent: () => mockWithdraw(),
}));

// The login section (P7-01); the session itself has its own tests.
let mockSession: CustomerSessionState = { status: 'signedOut', notice: 'none', loggingIn: false };
const mockLogin = jest.fn();
const mockLogout = jest.fn();
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
  login: () => mockLogin(),
  logout: () => mockLogout(),
}));

let mockAppEnv = 'development';
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function SafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={SAFE_AREA}>{children}</SafeAreaProvider>;
}

function usageSwitch() {
  return screen.getByRole('switch', { name: 'Share app usage' });
}

describe('AccountScreen: analytics consent switch (D-048)', () => {
  beforeEach(() => {
    mockConsent = { consent: 'not asked', busy: false, saveFailed: false };
    jest.clearAllMocks();
  });

  it.each(['not asked', 'denied'] as const)('is off when the choice is %s', async (consent) => {
    mockConsent = { consent, busy: false, saveFailed: false };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(usageSwitch().props.value).toBe(false);
    expect(usageSwitch()).toBeEnabled();
  });

  it('is on only when the choice is granted', async () => {
    mockConsent = { consent: 'granted', busy: false, saveFailed: false };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(usageSwitch().props.value).toBe(true);
  });

  it('grants consent when turned on, and withdraws it when turned off', async () => {
    await render(<AccountScreen />, { wrapper: SafeArea });

    await fireEvent(usageSwitch(), 'valueChange', true);
    await fireEvent(usageSwitch(), 'valueChange', false);

    expect(mockGrant).toHaveBeenCalledTimes(1);
    expect(mockWithdraw).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['while the choice loads', { consent: 'loading', busy: false, saveFailed: false }],
    ['while a change is applied', { consent: 'granted', busy: true, saveFailed: false }],
  ] as const)('is disabled %s', async (_case, state) => {
    mockConsent = state;

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(usageSwitch()).toBeDisabled();
  });

  it('says what is recorded and what never is', async () => {
    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(
      screen.getByText(/the link you installed it from.*never record your name, email, phone/),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/nothing about your child/)).not.toBeOnTheScreen();
  });

  it('says when the choice could not be saved', async () => {
    mockConsent = { consent: 'denied', busy: false, saveFailed: true };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByText('Your choice could not be saved. Please try again.')).toBeOnTheScreen();
  });
});

describe('AccountScreen: login (P7-01, D-123)', () => {
  const SIGNED_OUT: CustomerSessionState = {
    status: 'signedOut',
    notice: 'none',
    loggingIn: false,
  };

  beforeEach(() => {
    mockConsent = { consent: 'not asked', busy: false, saveFailed: false };
    mockSession = SIGNED_OUT;
    mockAppEnv = 'development';
    jest.clearAllMocks();
  });

  it('shows "Log in" when signed out, and starts the login when tapped', async () => {
    await render(<AccountScreen />, { wrapper: SafeArea });

    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/logged out|didn't finish/)).not.toBeOnTheScreen();
  });

  it('shows the architect\'s one line above "Log in" after Shopify refused the login', async () => {
    mockSession = { status: 'signedOut', notice: 'refused', loggingIn: false };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByText("You've been logged out. Please log in again.")).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeOnTheScreen();
  });

  it('says a login did not finish', async () => {
    mockSession = { status: 'signedOut', notice: 'loginFailed', loggingIn: false };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByText("Login didn't finish. Please try again.")).toBeOnTheScreen();
  });

  it('disables the button while a login runs', async () => {
    mockSession = { status: 'signedOut', notice: 'none', loggingIn: true };

    await render(<AccountScreen />, { wrapper: SafeArea });

    const button = screen.getByRole('button', { name: 'Logging in…' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows the email and "Log out" when signed in, and logs out when tapped', async () => {
    mockSession = { status: 'signedIn', email: 'reader@example.com' };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByText('Logged in as')).toBeOnTheScreen();
    expect(screen.getByText('reader@example.com')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('says "Logged in" when the ID token has no email', async () => {
    mockSession = { status: 'signedIn' };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByText('Logged in')).toBeOnTheScreen();
    expect(screen.queryByText('Logged in as')).not.toBeOnTheScreen();
  });

  it('shows a spinner, and no login button, while the stored login is read', async () => {
    mockSession = { status: 'loading' };

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Log in' })).not.toBeOnTheScreen();
  });

  it.each(['development', 'staging'])(
    'says login is not set up on a %s build without it',
    async (env) => {
      mockSession = { status: 'notConfigured' };
      mockAppEnv = env;

      await render(<AccountScreen />, { wrapper: SafeArea });

      expect(screen.getByText('Login is not set up on this build.')).toBeOnTheScreen();
    },
  );

  it.each<[string, CustomerSessionState]>([
    ['signed out', { status: 'signedOut', notice: 'none', loggingIn: false }],
    ['refused', { status: 'signedOut', notice: 'refused', loggingIn: false }],
    ['failed', { status: 'signedOut', notice: 'loginFailed', loggingIn: false }],
    ['logging in', { status: 'signedOut', notice: 'none', loggingIn: true }],
    ['signed in', { status: 'signedIn', email: 'reader@example.com' }],
    ['loading', { status: 'loading' }],
    ['not set up', { status: 'notConfigured' }],
  ])('keeps "Share app usage" and opens no pop-up when %s', async (_case, state) => {
    const alert = jest.spyOn(Alert, 'alert');
    mockSession = state;

    await render(<AccountScreen />, { wrapper: SafeArea });

    expect(usageSwitch()).toBeOnTheScreen();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
