import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { RawRemoteConfigValue } from '@/config';
import { loadFeatureFlags, useFeatureFlags } from '@/featureFlags/session';

// One module instance for the whole file, so React and the hook share it; this file therefore
// follows a single session from start to finish.

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
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

function FlagProbe() {
  const flags = useFeatureFlags();
  if (flags.status === 'not ready') return <Text>not ready</Text>;
  return (
    <Text>
      {flags.snapshot.values.checkout_presentation} {flags.snapshot.sources.checkout_presentation}{' '}
      {flags.fetch}
    </Text>
  );
}

describe('useFeatureFlags', () => {
  it('reports not ready until local activation, then the Remote Config value and the fetch', async () => {
    await render(<FlagProbe />);
    expect(screen.getByText('not ready')).toBeOnTheScreen();

    // A consumer that reads early waits too, and gets the same value.
    const early = loadFeatureFlags();

    await act(async () => {
      resolveActivation({ checkout_presentation: { value: 'browser', source: 'remote' } });
      await early;
    });

    expect(screen.getByText('browser remote in progress')).toBeOnTheScreen();
    expect((await early).values.checkout_presentation).toBe('browser');

    await act(async () => {
      resolveFetch();
      await Promise.resolve();
    });

    // The fetch finishing changes only its status, never the session's value.
    expect(screen.getByText('browser remote success')).toBeOnTheScreen();
  });
});
