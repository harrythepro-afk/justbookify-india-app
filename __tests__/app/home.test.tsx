import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '@/app/(tabs)/index';

let mockAppEnv = 'development';

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
});
