import { render, screen } from '@testing-library/react-native';

import PlaceholderScreen from '@/app/index';

let mockAppEnv = 'development';

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
});
