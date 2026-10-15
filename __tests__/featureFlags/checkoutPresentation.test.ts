import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import type { RawRemoteConfigValue } from '@/config';
import { loadCheckoutPresentation, useCheckoutPresentationRead } from '@/featureFlags/session';

const mockActivateLastFetched = jest.fn();
const mockFetchForNextLaunch = jest.fn();
const mockReportProblem = jest.fn();
const mockReportMalformed = jest.fn();

// Remote Config is mocked whole: these tests never load Firebase or touch a network.
jest.mock('@/featureFlags/remoteConfig', () => ({
  activateLastFetched: (settings: unknown) => mockActivateLastFetched(settings),
  fetchForNextLaunch: () => mockFetchForNextLaunch(),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportFeatureFlagProblem: (problem: string) => mockReportProblem(problem),
  reportMalformedFeatureFlag: (name: string) => mockReportMalformed(name),
  reportMalformedRemoteConfigList: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'production' } } },
}));

let appStateListener: ((state: AppStateStatus) => void) | undefined;
jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
  appStateListener = listener as (state: AppStateStatus) => void;
  return { remove: jest.fn() } as never;
});

type SessionModule = typeof import('@/featureFlags/session');

// Each test gets a fresh module, because the module keeps one snapshot per session.
function loadModule(): SessionModule {
  let loaded: SessionModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<SessionModule>('@/featureFlags/session');
  });
  if (loaded === undefined) throw new Error('module did not load');
  return loaded;
}

const SHEET: Record<string, RawRemoteConfigValue> = {
  checkout_presentation: { value: 'sheet', source: 'remote' },
};
const BROWSER: Record<string, RawRemoteConfigValue> = {
  checkout_presentation: { value: 'browser', source: 'remote' },
};
const MALFORMED: Record<string, RawRemoteConfigValue> = {
  checkout_presentation: { value: 'Browser ', source: 'remote' },
};

async function settle(): Promise<void> {
  await jest.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  appStateListener = undefined;
  mockFetchForNextLaunch.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('checkout_presentation at checkout (D-150)', () => {
  it('reads the value activated now, while the rest of the session keeps its snapshot', async () => {
    mockActivateLastFetched.mockResolvedValueOnce(SHEET).mockResolvedValueOnce(BROWSER);
    const session = loadModule();
    const frozen = await session.loadFeatureFlags();

    await expect(session.loadCheckoutPresentation()).resolves.toBe('browser');

    expect(frozen.values.checkout_presentation).toBe('sheet');
    expect((await session.loadFeatureFlags()).values.checkout_presentation).toBe('sheet');
    expect(mockActivateLastFetched).toHaveBeenCalledTimes(2);
  });

  it('switches back the same way, with no restart', async () => {
    mockActivateLastFetched
      .mockResolvedValueOnce(SHEET)
      .mockResolvedValueOnce(BROWSER)
      .mockResolvedValueOnce(SHEET);
    const session = loadModule();

    await expect(session.loadCheckoutPresentation()).resolves.toBe('browser');
    await expect(session.loadCheckoutPresentation()).resolves.toBe('sheet');
  });

  it('uses the frozen value when activation takes longer than a second', async () => {
    mockActivateLastFetched
      .mockResolvedValueOnce(BROWSER)
      .mockReturnValueOnce(new Promise(() => undefined));
    const session = loadModule();
    await session.loadFeatureFlags();

    const read = session.loadCheckoutPresentation();
    await settle();
    await jest.advanceTimersByTimeAsync(999);
    let value: string | undefined;
    void read.then((result) => (value = result));
    await settle();
    expect(value).toBeUndefined();
    await jest.advanceTimersByTimeAsync(1);

    await expect(read).resolves.toBe('browser');
  });

  it('uses the frozen value when activation fails, and reports nothing new', async () => {
    mockActivateLastFetched
      .mockResolvedValueOnce(BROWSER)
      .mockRejectedValueOnce(Object.assign(new Error('native'), { code: 'remoteConfig/failure' }));
    const session = loadModule();
    await session.loadFeatureFlags();
    mockReportProblem.mockClear();

    await expect(session.loadCheckoutPresentation()).resolves.toBe('browser');
    expect(mockReportProblem).not.toHaveBeenCalled();
  });

  it('gives the default for a malformed value, which is not reported again', async () => {
    mockActivateLastFetched.mockResolvedValueOnce(MALFORMED).mockResolvedValueOnce(MALFORMED);
    const session = loadModule();
    await session.loadFeatureFlags();
    expect(mockReportMalformed).toHaveBeenCalledTimes(1);

    await expect(session.loadCheckoutPresentation()).resolves.toBe('sheet');
    expect(mockReportMalformed).toHaveBeenCalledTimes(1);
  });

  it("keeps what checkout read for Home's development line", async () => {
    mockActivateLastFetched.mockResolvedValueOnce(SHEET).mockResolvedValueOnce(BROWSER);
    // The module as the app loads it (one React): a hook cannot use an isolated copy.
    const { result } = await renderHook(() => useCheckoutPresentationRead());
    expect(result.current).toBeUndefined();

    await act(async () => {
      await loadCheckoutPresentation();
    });

    expect(result.current).toEqual({ value: 'browser', source: 'remote' });
  });
});

describe('the fetch on a return to the foreground (D-150)', () => {
  it('fetches again when the app comes back, and never activates', async () => {
    mockActivateLastFetched.mockResolvedValue(SHEET);
    const session = loadModule();
    session.startFeatureFlags();
    await settle();
    mockFetchForNextLaunch.mockClear();
    mockActivateLastFetched.mockClear();

    appStateListener?.('background');
    appStateListener?.('active');
    await settle();

    expect(mockFetchForNextLaunch).toHaveBeenCalledTimes(1);
    expect(mockActivateLastFetched).not.toHaveBeenCalled();
  });

  it('reports no expected fetch failure, and an unexpected one by code only', async () => {
    mockActivateLastFetched.mockResolvedValue(SHEET);
    const session = loadModule();
    session.startFeatureFlags();
    await settle();
    mockReportProblem.mockClear();

    mockFetchForNextLaunch.mockRejectedValueOnce(
      Object.assign(new Error('host unreachable'), { code: 'remoteConfig/throttled' }),
    );
    appStateListener?.('background');
    appStateListener?.('active');
    await settle();
    expect(mockReportProblem).not.toHaveBeenCalled();

    mockFetchForNextLaunch.mockRejectedValueOnce(
      Object.assign(new Error('host firebase.example unreachable'), { code: 'remoteConfig/other' }),
    );
    appStateListener?.('background');
    appStateListener?.('active');
    await settle();
    expect(mockReportProblem.mock.calls).toEqual([['fetch failed (remoteConfig/other)']]);
  });
});
