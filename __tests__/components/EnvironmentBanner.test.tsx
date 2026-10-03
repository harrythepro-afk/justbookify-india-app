import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import type { StoreConfigStatus } from '@/config/store';

let mockAppEnv = 'development';
let mockStoreStatus: StoreConfigStatus = 'configured';

jest.mock('@/config/store', () => ({
  ...jest.requireActual('@/config/store'),
  getStoreConfigStatus: () => mockStoreStatus,
}));

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

function ScreenContent() {
  return <Text>Screen content, top inset {useSafeAreaInsets().top}</Text>;
}

async function renderBanner() {
  await render(
    <EnvironmentBanner>
      <ScreenContent />
    </EnvironmentBanner>,
    { wrapper: SafeArea },
  );
}

describe('EnvironmentBanner', () => {
  beforeEach(() => {
    mockAppEnv = 'development';
    mockStoreStatus = 'configured';
  });

  it.each([
    ['development', 'Development build'],
    ['staging', 'Staging build'],
  ])('names the environment on a %s build', async (env, label) => {
    mockAppEnv = env;

    await renderBanner();

    expect(screen.getByTestId('environment-banner')).toBeOnTheScreen();
    expect(screen.getByText(label)).toBeOnTheScreen();
    // The banner takes the top inset, so the screen below it does not add it again.
    expect(screen.getByText('Screen content, top inset 0')).toBeOnTheScreen();
  });

  it.each(['configured', 'not configured'] as const)(
    'says the store is %s, and shows no store value',
    async (status) => {
      mockStoreStatus = status;

      await renderBanner();

      expect(screen.getByText(`Store configuration: ${status}`)).toBeOnTheScreen();
      expect(screen.queryByText(/myshopify|https?:|shpat_|token/i)).not.toBeOnTheScreen();
    },
  );

  it('shows nothing but the screen on a production build', async () => {
    mockAppEnv = 'production';

    await renderBanner();

    expect(screen.queryByTestId('environment-banner')).not.toBeOnTheScreen();
    expect(screen.queryByText(/ build$/)).not.toBeOnTheScreen();
    expect(screen.queryByText(/^Store configuration/)).not.toBeOnTheScreen();
    expect(screen.getByText('Screen content, top inset 47')).toBeOnTheScreen();
  });
});
