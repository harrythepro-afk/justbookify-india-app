import type { FeatureFlagSnapshot, RawRemoteConfigValue } from '@/config';

const mockActivateLastFetched = jest.fn();
const mockFetchForNextLaunch = jest.fn();
const mockReportProblem = jest.fn();
const mockReportMalformed = jest.fn();
const mockReportList = jest.fn();
let mockAppEnv = 'production';

// Remote Config is mocked whole: these tests never load Firebase or touch a network.
jest.mock('@/featureFlags/remoteConfig', () => ({
  activateLastFetched: (settings: unknown) => mockActivateLastFetched(settings),
  fetchForNextLaunch: () => mockFetchForNextLaunch(),
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportFeatureFlagProblem: (problem: string) => mockReportProblem(problem),
  reportMalformedFeatureFlag: (name: string) => mockReportMalformed(name),
  reportMalformedRemoteConfigList: (parameter: string, summary: string) =>
    mockReportList(parameter, summary),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { appEnv: mockAppEnv } };
    },
  },
}));

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A React Native Firebase error: its code, and a native message that must never be sent. */
function firebaseError(code: string): Error {
  return Object.assign(
    new Error(`[${code}] host firebaseremoteconfig.googleapis.com unreachable`),
    {
      code,
    },
  );
}

const BROWSER: Record<string, RawRemoteConfigValue> = {
  checkout_presentation: { value: 'browser', source: 'remote' },
};

const SHEET_DEFAULT: FeatureFlagSnapshot = {
  values: { checkout_presentation: 'sheet' },
  sources: { checkout_presentation: 'default' },
  malformed: [],
};

const BROWSER_REMOTE: FeatureFlagSnapshot = {
  values: { checkout_presentation: 'browser' },
  sources: { checkout_presentation: 'remote' },
  malformed: [],
};

/** Lets pending promise callbacks run, without moving the clock. */
async function settle(): Promise<void> {
  await jest.advanceTimersByTimeAsync(0);
}

function track<T>(promise: Promise<T>) {
  const result: { settled: boolean; value?: T } = { settled: false };
  void promise.then((value) => {
    result.settled = true;
    result.value = value;
  });
  return result;
}

function reportedText(): string {
  return JSON.stringify([
    mockReportProblem.mock.calls,
    mockReportMalformed.mock.calls,
    mockReportList.mock.calls,
  ]);
}

describe('feature flag session', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAppEnv = 'production';
    mockFetchForNextLaunch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts without waiting, with the settings for the build environment', async () => {
    mockActivateLastFetched.mockReturnValue(new Promise(() => {}));
    const session = loadModule();

    // Returns at once; activation begins on the next microtask.
    expect(session.startFeatureFlags()).toBeUndefined();
    await settle();

    expect(mockActivateLastFetched).toHaveBeenCalledWith({
      minimumFetchIntervalMillis: 3_600_000,
      fetchTimeoutMillis: 30_000,
    });
  });

  it('uses the development settings on a development build', async () => {
    mockAppEnv = 'development';
    mockActivateLastFetched.mockReturnValue(new Promise(() => {}));

    loadModule().startFeatureFlags();
    await settle();

    expect(mockActivateLastFetched).toHaveBeenCalledWith({
      minimumFetchIntervalMillis: 0,
      fetchTimeoutMillis: 30_000,
    });
  });

  it('makes an early read wait for activation, so it gets the Remote Config value', async () => {
    const activation = deferred<Record<string, RawRemoteConfigValue>>();
    mockActivateLastFetched.mockReturnValue(activation.promise);
    const session = loadModule();
    session.startFeatureFlags();

    const early = track(session.loadFeatureFlags());
    await jest.advanceTimersByTimeAsync(2000);
    expect(early.settled).toBe(false);
    expect(mockFetchForNextLaunch).not.toHaveBeenCalled();

    activation.resolve(BROWSER);
    await settle();

    expect(early.value).toEqual(BROWSER_REMOTE);
    expect(mockReportProblem).not.toHaveBeenCalled();
  });

  it('activates once, however many consumers ask', async () => {
    mockActivateLastFetched.mockResolvedValue(BROWSER);
    const session = loadModule();

    const [first, second] = await Promise.all([
      session.loadFeatureFlags(),
      session.loadFeatureFlags(),
    ]);
    session.startFeatureFlags();

    expect(first).toBe(second);
    expect(await session.loadFeatureFlags()).toBe(first);
    expect(mockActivateLastFetched).toHaveBeenCalledTimes(1);
  });

  it('fetches for the next launch only after the snapshot is frozen, and keeps the snapshot', async () => {
    const fetch = deferred<void>();
    mockFetchForNextLaunch.mockReturnValue(fetch.promise);
    mockActivateLastFetched.mockResolvedValue({});
    const session = loadModule();

    const snapshot = await session.loadFeatureFlags();
    expect(snapshot).toEqual(SHEET_DEFAULT);
    expect(mockFetchForNextLaunch).toHaveBeenCalledTimes(1);

    // The fetched value is not activated in this session.
    fetch.resolve();
    await settle();

    expect(await session.loadFeatureFlags()).toBe(snapshot);
    expect(mockActivateLastFetched).toHaveBeenCalledTimes(1);
  });

  it('waits no longer than 3 seconds, then freezes the defaults and reports the timeout', async () => {
    const activation = deferred<Record<string, RawRemoteConfigValue>>();
    mockActivateLastFetched.mockReturnValue(activation.promise);
    const session = loadModule();

    const read = track(session.loadFeatureFlags());
    await jest.advanceTimersByTimeAsync(2999);
    expect(read.settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);

    expect(read.value).toEqual(SHEET_DEFAULT);
    expect(mockReportProblem).toHaveBeenCalledWith('activation timed out');
    expect(mockFetchForNextLaunch).toHaveBeenCalledTimes(1);
  });

  it('never changes a frozen snapshot when activation finishes late', async () => {
    const activation = deferred<Record<string, RawRemoteConfigValue>>();
    mockActivateLastFetched.mockReturnValue(activation.promise);
    const session = loadModule();
    const read = session.loadFeatureFlags();
    await jest.advanceTimersByTimeAsync(3000);

    activation.resolve(BROWSER);
    await settle();

    expect(await read).toEqual(SHEET_DEFAULT);
    expect(await session.loadFeatureFlags()).toEqual(SHEET_DEFAULT);
  });

  it('uses the defaults and reports only the code when activation fails', async () => {
    mockActivateLastFetched.mockRejectedValue(firebaseError('remoteConfig/unknown'));
    const session = loadModule();

    expect(await session.loadFeatureFlags()).toEqual(SHEET_DEFAULT);

    expect(mockReportProblem).toHaveBeenCalledWith('activation failed (remoteConfig/unknown)');
    expect(reportedText()).not.toMatch(/googleapis|unreachable/);
    expect(mockFetchForNextLaunch).not.toHaveBeenCalled();
  });

  it('uses the defaults when the native module is missing and throws at once', async () => {
    mockActivateLastFetched.mockImplementation(() => {
      throw new Error('Native module RNFBAppModule not found. Re-check module install.');
    });
    const session = loadModule();

    expect(await session.loadFeatureFlags()).toEqual(SHEET_DEFAULT);

    expect(mockReportProblem).toHaveBeenCalledWith('activation failed (Error)');
    expect(reportedText()).not.toMatch(/RNFBAppModule/);
  });

  it('uses the default for a malformed value and reports the flag name, never the value', async () => {
    mockActivateLastFetched.mockResolvedValue({
      checkout_presentation: { value: 'Browser-asha@example.com', source: 'remote' },
    });
    const session = loadModule();

    expect(await session.loadFeatureFlags()).toEqual({
      ...SHEET_DEFAULT,
      malformed: ['checkout_presentation'],
    });

    expect(mockReportMalformed).toHaveBeenCalledTimes(1);
    expect(mockReportMalformed).toHaveBeenCalledWith('checkout_presentation');
    expect(reportedText()).not.toMatch(/asha|Browser-/);
  });

  it.each(['remoteConfig/failure', 'remoteConfig/throttled'])(
    'does not report an expected fetch failure (%s)',
    async (code) => {
      mockActivateLastFetched.mockResolvedValue(BROWSER);
      mockFetchForNextLaunch.mockRejectedValue(firebaseError(code));
      const session = loadModule();

      expect(await session.loadFeatureFlags()).toEqual(BROWSER_REMOTE);
      await settle();

      expect(mockReportProblem).not.toHaveBeenCalled();
    },
  );

  it('reports an unexpected fetch error by its code only', async () => {
    mockActivateLastFetched.mockResolvedValue(BROWSER);
    mockFetchForNextLaunch.mockRejectedValue(firebaseError('remoteConfig/internal'));
    const session = loadModule();

    await session.loadFeatureFlags();
    await settle();

    expect(mockReportProblem).toHaveBeenCalledWith('fetch failed (remoteConfig/internal)');
    expect(reportedText()).not.toMatch(/googleapis|unreachable/);
  });

  it('reports a non-Firebase fetch error by its class name only', async () => {
    mockActivateLastFetched.mockResolvedValue(BROWSER);
    mockFetchForNextLaunch.mockRejectedValue(new TypeError('token abc123 for asha@example.com'));
    const session = loadModule();

    await session.loadFeatureFlags();
    await settle();

    expect(mockReportProblem).toHaveBeenCalledWith('fetch failed (TypeError)');
    expect(reportedText()).not.toMatch(/abc123|asha/);
  });

  it('never rejects, even when the build environment cannot be read', async () => {
    mockAppEnv = 'not-an-environment';
    const session = loadModule();

    expect(await session.loadFeatureFlags()).toEqual(SHEET_DEFAULT);
    expect(mockReportProblem).toHaveBeenCalledWith('activation failed (Error)');
  });
});

describe('the wanted list in the session (P6-11, D-115, D-116)', () => {
  const LIST = JSON.stringify(['David Walliams', 'Rick Riordan', 'Tintin', 'Harry Potter']);
  const WITH_LIST: Record<string, RawRemoteConfigValue> = {
    ...BROWSER,
    search_wanted_list: { value: LIST, source: 'remote' },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockAppEnv = 'production';
    mockFetchForNextLaunch.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('freezes the list with the flags, from the same activated values', async () => {
    mockActivateLastFetched.mockResolvedValue(WITH_LIST);
    const session = loadModule();

    const wanted = await session.loadWantedList();

    expect(wanted.source).toBe('remote');
    expect(wanted.list.map((name) => name.code)).toEqual([
      'david_walliams',
      'rick_riordan',
      'tintin',
      'harry_potter',
    ]);
    // The checkout flag is read exactly as before (D-046).
    expect(await session.loadFeatureFlags()).toEqual(BROWSER_REMOTE);
    expect(mockActivateLastFetched).toHaveBeenCalledTimes(1);
    expect(mockReportList).not.toHaveBeenCalled();
  });

  it('keeps the list for the whole launch, whatever the background fetch does', async () => {
    const fetch = deferred<void>();
    mockFetchForNextLaunch.mockReturnValue(fetch.promise);
    mockActivateLastFetched.mockResolvedValue(WITH_LIST);
    const session = loadModule();

    const first = await session.loadWantedList();
    mockActivateLastFetched.mockResolvedValue({});
    fetch.resolve();
    await settle();

    expect(await session.loadWantedList()).toBe(first);
  });

  it('uses the empty default when Remote Config has no list', async () => {
    mockActivateLastFetched.mockResolvedValue(BROWSER);
    const session = loadModule();

    expect(await session.loadWantedList()).toEqual({ list: [], source: 'default' });
    expect(mockReportList).not.toHaveBeenCalled();
  });

  it('uses the empty default when activation fails', async () => {
    mockActivateLastFetched.mockRejectedValue(firebaseError('remoteConfig/unknown'));
    const session = loadModule();

    expect(await session.loadWantedList()).toEqual({ list: [], source: 'default' });
  });

  it('uses the empty default after 3 seconds, and never the list that activates late', async () => {
    const activation = deferred<Record<string, RawRemoteConfigValue>>();
    mockActivateLastFetched.mockReturnValue(activation.promise);
    const session = loadModule();

    const read = track(session.loadWantedList());
    await jest.advanceTimersByTimeAsync(3000);
    activation.resolve(WITH_LIST);
    await settle();

    expect(read.value).toEqual({ list: [], source: 'default' });
    expect(await session.loadWantedList()).toEqual({ list: [], source: 'default' });
    expect(mockReportList).not.toHaveBeenCalled();
  });

  it('reports dropped entries once per launch, by reason codes and counts only', async () => {
    mockActivateLastFetched.mockResolvedValue({
      search_wanted_list: {
        value: JSON.stringify(['Asha Rao', 'asha rao', '', 'asha.rao@example.com 9876543210']),
        source: 'remote',
      },
    });
    const session = loadModule();

    await Promise.all([session.loadWantedList(), session.loadFeatureFlags()]);
    await session.loadWantedList();
    session.startFeatureFlags();
    await settle();

    expect(mockReportList.mock.calls).toEqual([
      ['search_wanted_list', 'dropped entries (empty 1, no_code 1, duplicate_code 1)'],
    ]);
    expect(reportedText()).not.toMatch(/asha|rao|example|9876543210/i);
  });

  it('ignores a value that is not a list, reports it once, and keeps the checkout flag', async () => {
    mockActivateLastFetched.mockResolvedValue({
      ...BROWSER,
      search_wanted_list: { value: '{"Asha Rao": true}', source: 'remote' },
    });
    const session = loadModule();

    expect(await session.loadWantedList()).toEqual({ list: [], source: 'default' });
    expect(await session.loadFeatureFlags()).toEqual(BROWSER_REMOTE);
    expect(mockReportList.mock.calls).toEqual([['search_wanted_list', 'ignored (not_list)']]);
    expect(mockReportMalformed).not.toHaveBeenCalled();
    expect(reportedText()).not.toMatch(/asha|rao/i);
  });
});
