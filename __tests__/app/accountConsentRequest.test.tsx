import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resetAnalyticsConsentForTests } from '@/analytics/consent';
import AccountScreen from '@/app/(tabs)/account';
import {
  CONSENT_ALLOW,
  CONSENT_CLOSE,
  CONSENT_DONT_ALLOW,
  CONSENT_REQUEST_CHANGE_LATER,
  CONSENT_REQUEST_TEXT,
  CONSENT_REQUEST_TITLE,
  CONSENT_SAVE_FAILED,
} from '@/components/AnalyticsConsentRequest';
import type { CustomerSessionState, LoginOutcome } from '@/customerAccount/session';

/**
 * The consent request after a login (P7-03, D-129, D-130), with the real consent store, event
 * layer and guard. Only the phone's storage, Firebase's native calls and the login are replaced.
 */

// React Native loads ScrollView's module tree on first access, which takes several seconds on a
// cold Jest cache (CI). Touching it here loads it with the file, before any test's time limit.
void ScrollView;

// The phone's stored choice, and every call that reaches storage or Firebase, in order.
let mockStored: string | null = null;
let mockWriteFails = false;
// A write waits for this when it is set, so a test can tap while a choice is being saved.
let mockWriteHold: Promise<void> | undefined;
const mockCalls: string[] = [];
jest.mock('@/analytics/consentStorage', () => ({
  readStoredConsent: () => Promise.resolve(mockStored),
  writeStoredConsent: async (value: string) => {
    mockCalls.push(`write ${value}`);
    if (mockWriteHold !== undefined) await mockWriteHold;
    if (mockWriteFails) throw new Error('keystore');
    mockStored = value;
  },
  deleteStoredConsent: () => {
    mockCalls.push('delete');
    mockStored = null;
    return Promise.resolve();
  },
}));

jest.mock('@/analytics/firebase', () => ({
  turnCollectionOn: () => {
    mockCalls.push('collection on');
    return Promise.resolve();
  },
  turnCollectionOff: () => {
    mockCalls.push('collection off');
    return Promise.resolve();
  },
  clearAnalyticsData: () => {
    mockCalls.push('data reset');
    return Promise.resolve();
  },
  sendEvent: (name: string, params: Record<string, unknown>) => {
    mockCalls.push(`event ${name} ${JSON.stringify(params)}`);
    return Promise.resolve();
  },
  sendScreenView: (name: string) => {
    mockCalls.push(`screen ${name}`);
    return Promise.resolve();
  },
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: () => undefined,
}));

// The login: each test says how it ends; the session's own tests cover the login itself.
let mockSession: CustomerSessionState = { status: 'signedOut', notice: 'none', loggingIn: false };
let mockOutcome: LoginOutcome = 'signedIn';
const mockLogout = jest.fn();
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
  getCustomerSessionState: () => mockSession,
  login: () => Promise.resolve(mockOutcome),
  logout: () => {
    mockLogout();
    return Promise.resolve();
  },
}));

// The details section (P7-02) has its own tests; here it only loads.
jest.mock('@/customerAccountApi/hooks/customer', () => ({
  useCustomerProfile: () => ({
    data: undefined,
    error: null,
    isFetching: true,
    refetch: () => undefined,
  }),
  useIsOffline: () => false,
  recheckNetwork: () => Promise.resolve(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function SafeArea({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={SAFE_AREA}>{children}</SafeAreaProvider>;
}

const SIGNED_OUT: CustomerSessionState = { status: 'signedOut', notice: 'none', loggingIn: false };
const SIGNED_IN: CustomerSessionState = { status: 'signedIn', email: 'reader@example.com' };

function events(): string[] {
  return mockCalls.filter((call) => call.startsWith('event ') || call.startsWith('screen '));
}

function request() {
  return screen.queryByText(CONSENT_REQUEST_TITLE);
}

/** Renders the Account tab with the stored choice read, as at a launch. */
async function renderAccount(): Promise<void> {
  await render(<AccountScreen />, { wrapper: SafeArea });
  await waitFor(() =>
    expect(screen.getByRole('switch', { name: 'Share app usage' })).toBeEnabled(),
  );
  mockCalls.length = 0;
}

/** Taps "Log in" and lets the login, and what follows it, finish. */
async function logIn(): Promise<void> {
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  // The consent request (or the `login` event) follows the login's promise.
  await act(async () => {
    await Promise.resolve();
  });
  if (mockOutcome === 'signedIn') mockSession = SIGNED_IN;
}

describe('the analytics consent request after a login (P7-03, D-129)', () => {
  beforeEach(() => {
    resetAnalyticsConsentForTests();
    mockStored = null;
    mockWriteFails = false;
    mockWriteHold = undefined;
    mockCalls.length = 0;
    mockSession = SIGNED_OUT;
    mockOutcome = 'signedIn';
    jest.clearAllMocks();
  });

  it('is not shown at launch, signed out or signed in, while the choice is not asked', async () => {
    await renderAccount();
    expect(request()).not.toBeOnTheScreen();

    await screen.unmount();
    resetAnalyticsConsentForTests();
    mockSession = SIGNED_IN; // a login restored from storage, not a new one
    await renderAccount();

    expect(request()).not.toBeOnTheScreen();
    expect(events()).toEqual([]);
  });

  it('is shown right after a successful login while the choice is not asked', async () => {
    await renderAccount();

    await logIn();

    expect(await screen.findByText(CONSENT_REQUEST_TITLE)).toBeOnTheScreen();
    expect(screen.getByText(CONSENT_REQUEST_TEXT)).toBeOnTheScreen();
    expect(screen.getByText(CONSENT_REQUEST_CHANGE_LATER)).toBeOnTheScreen();
    // Nothing is sent or stored while it is open.
    expect(mockCalls).toEqual([]);
  });

  it.each<LoginOutcome>(['cancelled', 'failed', 'ignored'])(
    'is not shown after a login that ended %s',
    async (outcome) => {
      mockOutcome = outcome;
      await renderAccount();

      await logIn();

      expect(request()).not.toBeOnTheScreen();
      expect(mockCalls).toEqual([]);
    },
  );

  it('is not shown when the choice is granted, and `login` is sent at once', async () => {
    mockStored = 'granted';
    await renderAccount();

    await logIn();

    await waitFor(() => expect(events()).toEqual(['event login {}']));
    expect(request()).not.toBeOnTheScreen();
  });

  it('is not shown when the choice is denied, and nothing is sent', async () => {
    mockStored = 'denied';
    await renderAccount();

    await logIn();
    await act(async () => {
      await Promise.resolve();
    });

    expect(request()).not.toBeOnTheScreen();
    expect(mockCalls).toEqual([]);
  });

  it('"Allow" saves the choice first, then switches collection on, then sends `login` once', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    await fireEvent.press(screen.getByRole('button', { name: CONSENT_ALLOW }));

    await waitFor(() => expect(request()).not.toBeOnTheScreen());
    expect(mockStored).toBe('granted');
    expect(mockCalls).toEqual(['write granted', 'collection on', 'event login {}']);
    expect(screen.getByRole('switch', { name: 'Share app usage' }).props.value).toBe(true);
  });

  it('"Don\'t allow" saves `denied` and sends nothing', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    await fireEvent.press(screen.getByRole('button', { name: CONSENT_DONT_ALLOW }));

    await waitFor(() => expect(request()).not.toBeOnTheScreen());
    expect(mockStored).toBe('denied');
    expect(mockCalls).toEqual(['collection off', 'data reset', 'write denied']);
    expect(events()).toEqual([]);
  });

  it('"Close" stores nothing, sends nothing and leaves the choice not asked', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    await fireEvent.press(screen.getByRole('button', { name: CONSENT_CLOSE }));

    expect(request()).not.toBeOnTheScreen();
    expect(mockStored).toBeNull();
    expect(mockCalls).toEqual([]);
    expect(screen.getByRole('switch', { name: 'Share app usage' }).props.value).toBe(false);
  });

  it("Android's Back closes it the same way", async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    await fireEvent(screen.getByTestId('consent-request'), 'requestClose');

    expect(request()).not.toBeOnTheScreen();
    expect(mockStored).toBeNull();
    expect(mockCalls).toEqual([]);
  });

  it('comes back after the next login while the choice is still not asked, once per login', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);
    await fireEvent.press(screen.getByRole('button', { name: CONSENT_CLOSE }));

    // A re-render while signed in does not open it again.
    await screen.rerender(<AccountScreen />);
    expect(request()).not.toBeOnTheScreen();

    // Log out, then log in again.
    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));
    mockSession = SIGNED_OUT;
    await screen.rerender(<AccountScreen />);
    await logIn();

    expect(await screen.findByText(CONSENT_REQUEST_TITLE)).toBeOnTheScreen();
    expect(events()).toEqual([]);
  });

  it('stays open with a message when "Allow" cannot be saved, and sends nothing', async () => {
    mockWriteFails = true;
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    await fireEvent.press(screen.getByRole('button', { name: CONSENT_ALLOW }));

    // The request says so itself (the Account switch behind it says the same, D-048).
    const inRequest = within(screen.getByTestId('consent-request'));
    expect(await inRequest.findByText(CONSENT_SAVE_FAILED)).toBeOnTheScreen();
    expect(request()).toBeOnTheScreen();
    expect(events()).toEqual([]);

    // A second try that saves closes it and sends the login once.
    mockWriteFails = false;
    await fireEvent.press(screen.getByRole('button', { name: CONSENT_ALLOW }));

    await waitFor(() => expect(request()).not.toBeOnTheScreen());
    expect(events()).toEqual(['event login {}']);
  });

  it('takes one answer only while a choice is being saved', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    let release = () => {};
    mockWriteHold = new Promise<void>((resolve) => {
      release = resolve;
    });
    await fireEvent.press(screen.getByRole('button', { name: CONSENT_ALLOW }));

    // While "Allow" is being saved, every control is disabled and ignores taps.
    for (const name of [CONSENT_ALLOW, CONSENT_DONT_ALLOW, CONSENT_CLOSE]) {
      const button = screen.getByRole('button', { name });
      expect(button).toBeDisabled();
      await fireEvent.press(button);
    }
    await fireEvent(screen.getByTestId('consent-request'), 'requestClose');
    expect(request()).toBeOnTheScreen();

    await act(async () => {
      release();
      await mockWriteHold;
    });

    await waitFor(() => expect(request()).not.toBeOnTheScreen());
    expect(mockCalls.filter((call) => call.startsWith('write'))).toEqual(['write granted']);
    expect(events()).toEqual(['event login {}']);
  });

  it('offers both answers alike: same role and style, neither chosen; the title is a header', async () => {
    await renderAccount();
    await logIn();
    await screen.findByText(CONSENT_REQUEST_TITLE);

    const allow = screen.getByRole('button', { name: CONSENT_ALLOW });
    const deny = screen.getByRole('button', { name: CONSENT_DONT_ALLOW });
    expect(StyleSheet.flatten(allow.props.style)).toEqual(StyleSheet.flatten(deny.props.style));
    for (const button of [allow, deny]) {
      expect(button).toBeEnabled();
      expect(button.props.accessibilityState?.selected).toBeUndefined();
      expect(button.props.accessibilityState?.checked).toBeUndefined();
    }
    expect(screen.getByRole('header', { name: CONSENT_REQUEST_TITLE })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: CONSENT_CLOSE })).toBeEnabled();
  });
});

describe('the logout event (P7-03, D-130)', () => {
  beforeEach(() => {
    resetAnalyticsConsentForTests();
    mockStored = null;
    mockCalls.length = 0;
    mockSession = SIGNED_IN;
    jest.clearAllMocks();
  });

  it('is sent under consent when "Log out" is tapped, before the session ends', async () => {
    mockStored = 'granted';
    mockLogout.mockImplementation(() => mockCalls.push('logout'));
    await renderAccount();

    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    expect(mockCalls).toEqual(['event logout {}', 'logout']);
  });

  it.each([null, 'denied'])('is not sent when the stored choice is %p', async (stored) => {
    mockStored = stored;
    await renderAccount();

    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(events()).toEqual([]);
  });
});
