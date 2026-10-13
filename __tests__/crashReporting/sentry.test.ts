import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

const mockInit = jest.fn();
const mockCaptureException = jest.fn();
const mockNativeCrash = jest.fn();
const mockCaptureMessage = jest.fn();

jest.mock('@sentry/react-native', () => ({
  init: (options: unknown) => mockInit(options),
  captureException: (error: unknown) => mockCaptureException(error),
  captureMessage: (message: string, level: string) => mockCaptureMessage(message, level),
  nativeCrash: () => mockNativeCrash(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { appEnv: 'development' } } },
}));

const DSN = 'https://0123456789abcdef0123456789abcdef@o123.ingest.de.sentry.io/456';
let mockConfig: { dsn: string } | undefined;

jest.mock('@/config/crashReporting', () => ({
  getCrashReportingConfig: () => mockConfig,
}));

type SentryModule = typeof import('@/crashReporting/sentry');

// Each test gets a fresh module, because the module remembers that Sentry has started.
function loadModule(): SentryModule {
  let loaded: SentryModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<SentryModule>('@/crashReporting/sentry');
  });
  if (loaded === undefined) throw new Error('module did not load');
  return loaded;
}

type InitOptions = {
  beforeSend: (event: ErrorEvent) => ErrorEvent | null;
  beforeBreadcrumb: (breadcrumb: Breadcrumb) => Breadcrumb | null;
  [key: string]: unknown;
};

function initOptions(): InitOptions {
  return mockInit.mock.calls[0]?.[0] as InitOptions;
}

describe('crash reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = undefined;
  });

  describe('without a DSN', () => {
    it('does not start Sentry', () => {
      const crashReporting = loadModule();

      crashReporting.startCrashReporting();

      expect(mockInit).not.toHaveBeenCalled();
      expect(crashReporting.isCrashReportingOn()).toBe(false);
    });

    it('sends nothing and never crashes from the test controls', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.sendTestError();
      crashReporting.triggerTestNativeCrash();

      expect(mockCaptureException).not.toHaveBeenCalled();
      expect(mockNativeCrash).not.toHaveBeenCalled();
    });

    it('sends no feature flag reports', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.reportFeatureFlagProblem('activation timed out');
      crashReporting.reportMalformedFeatureFlag('checkout_presentation');

      expect(mockCaptureException).not.toHaveBeenCalled();
      expect(mockCaptureMessage).not.toHaveBeenCalled();
    });
  });

  describe('with a DSN', () => {
    beforeEach(() => {
      mockConfig = { dsn: DSN };
    });

    it('starts Sentry once, however often it is called', () => {
      const crashReporting = loadModule();

      crashReporting.startCrashReporting();
      crashReporting.startCrashReporting();

      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(crashReporting.isCrashReportingOn()).toBe(true);
    });

    it('tags the environment and turns off personal data, tracing, replay and attachments', () => {
      loadModule().startCrashReporting();

      expect(initOptions()).toMatchObject({
        dsn: DSN,
        environment: 'development',
        sendDefaultPii: false,
        attachScreenshot: false,
        attachViewHierarchy: false,
        enableAutoPerformanceTracing: false,
        enableUserInteractionTracing: false,
        enableCaptureFailedRequests: false,
        enableLogs: false,
      });
      const options = initOptions();
      expect(options).not.toHaveProperty('tracesSampleRate');
      expect(options).not.toHaveProperty('tracesSampler');
      expect(options).not.toHaveProperty('profilesSampleRate');
      expect(options).not.toHaveProperty('replaysSessionSampleRate');
      expect(options).not.toHaveProperty('replaysOnErrorSampleRate');
      expect(options).not.toHaveProperty('integrations');
    });

    it('scrubs every event and breadcrumb before sending', () => {
      loadModule().startCrashReporting();
      const { beforeSend, beforeBreadcrumb } = initOptions();

      const event = beforeSend({
        type: undefined,
        message: 'failed for asha.reader@example.com',
        user: { email: 'asha.reader@example.com' },
      });

      expect(event?.user).toBeUndefined();
      expect(event?.message).toBe('failed for [Filtered]');
      expect(beforeBreadcrumb({ category: 'console', message: 'anything' })).toBeNull();
    });

    it('sends a handled test error', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.sendTestError();

      expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it('reports a feature flag problem as a handled error with a fixed message', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.reportFeatureFlagProblem('activation failed (remoteConfig/unknown)');

      expect(mockCaptureException).toHaveBeenCalledTimes(1);
      const error = mockCaptureException.mock.calls[0]?.[0] as Error;
      expect(error.message).toBe('Remote Config: activation failed (remoteConfig/unknown)');
    });

    it('reports a malformed flag as a warning that names the flag only', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.reportMalformedFeatureFlag('checkout_presentation');

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Remote Config: malformed value for checkout_presentation; the in-app default is used',
        'warning',
      );
    });

    it('reports a Remote Config list by its parameter, reason codes and counts only', () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.reportMalformedRemoteConfigList(
        'search_wanted_list',
        'dropped entries (empty 1, duplicate_code 2)',
      );

      expect(mockCaptureMessage).toHaveBeenCalledWith(
        'Remote Config: search_wanted_list dropped entries (empty 1, duplicate_code 2)',
        'warning',
      );
    });

    it("uses Sentry's own native crash for the native test", () => {
      const crashReporting = loadModule();
      crashReporting.startCrashReporting();

      crashReporting.triggerTestNativeCrash();

      expect(mockNativeCrash).toHaveBeenCalledTimes(1);
    });
  });
});

describe('the customer login and crash reports (P7-01, D-121)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = { dsn: DSN };
  });

  it("removes the session's tokens by value from every event and breadcrumb", () => {
    const crashReporting = loadModule();
    const tokens = ['opaque-access-value-one', 'opaque-refresh-value-two'];
    crashReporting.setCustomerTokenSource(() => tokens);
    crashReporting.startCrashReporting();
    const { beforeSend, beforeBreadcrumb } = initOptions();

    const event = beforeSend({ type: undefined, message: `failed with ${tokens[0]}` });
    const breadcrumb = beforeBreadcrumb({ category: 'auth', message: `kept ${tokens[1]}` });

    expect(event?.message).toBe('failed with [Filtered]');
    expect(breadcrumb?.message).toBe('kept [Filtered]');
    expect(crashReporting.getSensitiveValues().customerTokens).toEqual(tokens);
  });

  it('reads the source at send time, so a logout leaves nothing to remove', () => {
    const crashReporting = loadModule();
    let tokens: string[] = ['opaque-access-value-one'];
    crashReporting.setCustomerTokenSource(() => tokens);
    tokens = [];
    expect(crashReporting.getSensitiveValues().customerTokens).toEqual([]);
  });

  it('reports a login problem as a warning by its code only', () => {
    const crashReporting = loadModule();
    crashReporting.startCrashReporting();

    crashReporting.reportCustomerAccountProblem('refresh_refused');

    expect(mockCaptureMessage).toHaveBeenCalledWith('Customer account: refresh_refused', 'warning');
  });

  it('sends no login report before Sentry starts', () => {
    mockConfig = undefined;
    const crashReporting = loadModule();
    crashReporting.startCrashReporting();

    crashReporting.reportCustomerAccountProblem('refresh_refused');

    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });
});
