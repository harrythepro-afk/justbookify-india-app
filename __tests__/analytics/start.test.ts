import { AppState, type AppStateStatus } from 'react-native';

const mockLoad = jest.fn(() => Promise.resolve('granted'));
const mockTrackAppOpen = jest.fn();

jest.mock('@/analytics/consent', () => ({ loadAnalyticsConsent: () => mockLoad() }));
jest.mock('@/analytics/events', () => ({
  trackAppOpen: (params: unknown) => mockTrackAppOpen(params),
}));

type StartModule = typeof import('@/analytics/start');

function loadModule(): StartModule {
  let loaded: StartModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<StartModule>('@/analytics/start');
  });
  if (loaded === undefined) throw new Error('module did not load');
  return loaded;
}

describe('startAnalytics', () => {
  let listener: ((state: AppStateStatus) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
      listener = handler as (state: AppStateStatus) => void;
      return { remove: jest.fn() };
    });
  });

  it('logs the cold start only after consent has been read, and starts once', async () => {
    const { startAnalytics } = loadModule();

    startAnalytics();
    startAnalytics();
    expect(mockTrackAppOpen).not.toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockLoad).toHaveBeenCalledTimes(1);
    expect(mockTrackAppOpen.mock.calls).toEqual([[{ source: 'cold_start' }]]);
  });

  it('logs a return from the background, but not a passing inactive state', () => {
    const { startAnalytics } = loadModule();
    startAnalytics();
    mockTrackAppOpen.mockClear();

    listener?.('inactive');
    listener?.('active');
    listener?.('background');
    listener?.('active');

    expect(mockTrackAppOpen.mock.calls).toEqual([[{ source: 'foreground' }]]);
  });
});
