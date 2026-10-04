const calls: string[] = [];
const mockRead = jest.fn<Promise<string | null>, []>();
const mockWrite = jest.fn<Promise<void>, [string]>();
const mockDelete = jest.fn<Promise<void>, []>();
const mockOn = jest.fn<Promise<void>, []>();
const mockOff = jest.fn<Promise<void>, []>();
const mockClear = jest.fn<Promise<void>, []>();
const mockReportProblem = jest.fn();

// Storage and Firebase are mocked whole: these tests never touch a native module.
jest.mock('@/analytics/consentStorage', () => ({
  readStoredConsent: () => mockRead(),
  writeStoredConsent: (value: string) => {
    calls.push(`write ${value}`);
    return mockWrite(value);
  },
  deleteStoredConsent: () => {
    calls.push('delete');
    return mockDelete();
  },
}));

jest.mock('@/analytics/firebase', () => ({
  turnCollectionOn: () => {
    calls.push('collection on');
    return mockOn();
  },
  turnCollectionOff: () => {
    calls.push('collection off');
    return mockOff();
  },
  clearAnalyticsData: () => {
    calls.push('reset');
    return mockClear();
  },
}));

jest.mock('@/crashReporting/sentry', () => ({
  reportAnalyticsProblem: (problem: string) => mockReportProblem(problem),
}));

type ConsentModule = typeof import('@/analytics/consent');

// Each test gets a fresh module, because the module keeps one state per session.
function loadModule(): ConsentModule {
  let loaded: ConsentModule | undefined;
  jest.isolateModules(() => {
    loaded = jest.requireActual<ConsentModule>('@/analytics/consent');
  });
  if (loaded === undefined) throw new Error('module did not load');
  return loaded;
}

function nativeError(code: string): Error {
  return Object.assign(new Error(`[${code}] keystore detail`), { code });
}

describe('analytics consent (D-048)', () => {
  beforeEach(() => {
    calls.length = 0;
    jest.clearAllMocks();
    mockRead.mockResolvedValue(null);
    mockWrite.mockResolvedValue();
    mockDelete.mockResolvedValue();
    mockOn.mockResolvedValue();
    mockOff.mockResolvedValue();
    mockClear.mockResolvedValue();
  });

  it('is not granted while the stored choice is still being read', () => {
    mockRead.mockReturnValue(new Promise(() => {}));
    const consent = loadModule();

    void consent.loadAnalyticsConsent();

    expect(consent.isAnalyticsConsentGranted()).toBe(false);
  });

  it.each([
    [null, 'not asked'],
    ['denied', 'denied'],
    ['yes', 'not asked'],
    ['GRANTED', 'not asked'],
  ])('reads a stored %p as %s and keeps collection off', async (stored, expected) => {
    mockRead.mockResolvedValue(stored);
    const consent = loadModule();

    await expect(consent.loadAnalyticsConsent()).resolves.toBe(expected);

    expect(consent.isAnalyticsConsentGranted()).toBe(false);
    expect(calls).toEqual(['collection off']);
  });

  it('reads a stored grant and switches collection on', async () => {
    mockRead.mockResolvedValue('granted');
    const consent = loadModule();

    await expect(consent.loadAnalyticsConsent()).resolves.toBe('granted');

    expect(consent.isAnalyticsConsentGranted()).toBe(true);
    expect(calls).toEqual(['collection on']);
  });

  it('treats a value that cannot be read as not asked, and reports the code only', async () => {
    mockRead.mockRejectedValue(nativeError('ERR_KEY_STORE_ERROR'));
    const consent = loadModule();

    await expect(consent.loadAnalyticsConsent()).resolves.toBe('not asked');

    expect(calls).toEqual(['collection off']);
    expect(mockReportProblem).toHaveBeenCalledWith('consent read failed (ERR_KEY_STORE_ERROR)');
  });

  it('saves a grant before switching collection on', async () => {
    const consent = loadModule();

    await consent.grantAnalyticsConsent();

    expect(calls).toEqual(['collection off', 'write granted', 'collection on']);
    expect(consent.isAnalyticsConsentGranted()).toBe(true);
  });

  it('keeps collection off when a grant cannot be saved', async () => {
    mockWrite.mockRejectedValue(nativeError('ERR_KEY_STORE_ERROR'));
    const consent = loadModule();

    await consent.grantAnalyticsConsent();

    expect(calls).toEqual(['collection off', 'write granted']);
    expect(consent.isAnalyticsConsentGranted()).toBe(false);
    expect(mockReportProblem).toHaveBeenCalledWith('consent save failed (ERR_KEY_STORE_ERROR)');
  });

  it('on withdrawal stops sending at once, then switches off, resets and saves', async () => {
    mockRead.mockResolvedValue('granted');
    const consent = loadModule();
    await consent.loadAnalyticsConsent();
    calls.length = 0;

    const withdrawal = consent.withdrawAnalyticsConsent();
    await Promise.resolve();
    await Promise.resolve();
    expect(consent.isAnalyticsConsentGranted()).toBe(false);
    await withdrawal;

    expect(calls).toEqual(['collection off', 'reset', 'write denied']);
  });

  it('deletes the stored grant when the withdrawal cannot be saved', async () => {
    mockRead.mockResolvedValue('granted');
    mockWrite.mockRejectedValue(nativeError('ERR_KEY_STORE_ERROR'));
    const consent = loadModule();
    await consent.loadAnalyticsConsent();
    calls.length = 0;

    await consent.withdrawAnalyticsConsent();

    expect(calls).toEqual(['collection off', 'reset', 'write denied', 'delete']);
    expect(consent.isAnalyticsConsentGranted()).toBe(false);
  });

  it('says the choice could not be saved when neither save nor delete works', async () => {
    mockRead.mockResolvedValue('granted');
    mockWrite.mockRejectedValue(nativeError('ERR_KEY_STORE_ERROR'));
    mockDelete.mockRejectedValue(nativeError('ERR_KEY_STORE_ERROR'));
    const consent = loadModule();
    await consent.loadAnalyticsConsent();

    await consent.withdrawAnalyticsConsent();

    expect(consent.isAnalyticsConsentGranted()).toBe(false);
    expect(mockReportProblem).toHaveBeenCalledWith('consent delete failed (ERR_KEY_STORE_ERROR)');
  });

  it('still resets and saves the withdrawal when switching off fails', async () => {
    mockRead.mockResolvedValue('granted');
    const consent = loadModule();
    await consent.loadAnalyticsConsent();
    calls.length = 0;
    mockOff.mockRejectedValue(nativeError('analytics/unknown'));

    await consent.withdrawAnalyticsConsent();

    expect(calls).toEqual(['collection off', 'reset', 'write denied']);
    expect(mockReportProblem).toHaveBeenCalledWith('collection off failed (analytics/unknown)');
  });
});
