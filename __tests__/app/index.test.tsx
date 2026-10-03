import { render, screen } from '@testing-library/react-native';

import PlaceholderScreen from '@/app/index';
import type { StoreConfigStatus } from '@/config/store';

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfigStatus: () => mockStoreStatus,
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

describe('PlaceholderScreen', () => {
  beforeEach(() => {
    mockAppEnv = 'development';
    mockStoreStatus = 'configured';
  });

  it('shows the app name and the placeholder message', async () => {
    await render(<PlaceholderScreen />);

    expect(screen.getByRole('header', { name: 'JustBookify' })).toBeOnTheScreen();
    expect(screen.getByText('The app is set up. Screens arrive in later tasks.')).toBeOnTheScreen();
  });

  it('names the environment on a non-production build', async () => {
    mockAppEnv = 'staging';

    await render(<PlaceholderScreen />);

    expect(screen.getByText('Staging build')).toBeOnTheScreen();
  });

  it('does not name the environment on a production build', async () => {
    mockAppEnv = 'production';

    await render(<PlaceholderScreen />);

    expect(screen.queryByText(/ build$/)).not.toBeOnTheScreen();
  });

  it.each(['configured', 'not configured'] as const)(
    'says the store is %s on a development build',
    async (status) => {
      mockStoreStatus = status;

      await render(<PlaceholderScreen />);

      expect(screen.getByText(`Store configuration: ${status}`)).toBeOnTheScreen();
    },
  );

  it('does not show the store configuration on a production build', async () => {
    mockAppEnv = 'production';

    await render(<PlaceholderScreen />);

    expect(screen.queryByText(/^Store configuration/)).not.toBeOnTheScreen();
  });

  it('links to the test checkout screen on a development build', async () => {
    await render(<PlaceholderScreen />);

    const link = screen.getByText('Open the test checkout screen');
    expect(link).toBeOnTheScreen();
    expect(link.props.accessibilityHint).toBe('/dev-checkout');
  });

  it.each(['staging', 'production'])(
    'does not link to the test checkout screen on a %s build',
    async (env) => {
      mockAppEnv = env;

      await render(<PlaceholderScreen />);

      expect(screen.queryByText('Open the test checkout screen')).not.toBeOnTheScreen();
    },
  );
});
