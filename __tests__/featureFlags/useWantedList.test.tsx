import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { RawRemoteConfigValue } from '@/config';
import { useWantedList } from '@/featureFlags/session';

// One module instance for the whole file, so React and the hook share it; this file therefore
// follows a single session from start to finish (as useFeatureFlags.test.tsx).

let resolveActivation: (values: Record<string, RawRemoteConfigValue>) => void = () => {};
let resolveFetch: () => void = () => {};

jest.mock('@/featureFlags/remoteConfig', () => ({
  activateLastFetched: () =>
    new Promise((resolve) => {
      resolveActivation = resolve;
    }),
  fetchForNextLaunch: () =>
    new Promise<void>((resolve) => {
      resolveFetch = resolve;
    }),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportFeatureFlagProblem: jest.fn(),
  reportMalformedFeatureFlag: jest.fn(),
  reportMalformedRemoteConfigList: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

function WantedProbe() {
  const list = useWantedList();
  return <Text>{list === null ? 'not ready' : list.map((name) => name.code).join(' ')}</Text>;
}

describe('useWantedList (P6-11, D-115)', () => {
  it('is null until the snapshot is frozen, then this launch’s codes, unchanged by the fetch', async () => {
    await render(<WantedProbe />);
    expect(screen.getByText('not ready')).toBeOnTheScreen();

    await act(async () => {
      resolveActivation({
        search_wanted_list: { value: '["David Walliams", "Tintin"]', source: 'remote' },
      });
      await Promise.resolve();
    });

    expect(screen.getByText('david_walliams tintin')).toBeOnTheScreen();

    await act(async () => {
      resolveFetch();
      await Promise.resolve();
    });

    expect(screen.getByText('david_walliams tintin')).toBeOnTheScreen();
  });
});
