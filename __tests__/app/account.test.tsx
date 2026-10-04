import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AnalyticsConsentState } from '@/analytics/consent';
import AccountScreen from '@/app/(tabs)/account';

let mockConsent: AnalyticsConsentState = { consent: 'not asked', busy: false, saveFailed: false };
const mockGrant = jest.fn();
const mockWithdraw = jest.fn();

jest.mock('@/analytics/consent', () => ({
  useAnalyticsConsent: () => mockConsent,
  grantAnalyticsConsent: () => mockGrant(),
  withdrawAnalyticsConsent: () => mockWithdraw(),
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
