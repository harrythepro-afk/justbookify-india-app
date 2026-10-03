import { getCrashReportingConfig, parseCrashReportingConfig } from '@/config/crashReporting';

// Shaped like a Sentry DSN; not a real project.
const DSN = 'https://0123456789abcdef0123456789abcdef@o123.ingest.de.sentry.io/456';

describe('parseCrashReportingConfig', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it.each(['development', 'production'])('accepts a valid DSN when NODE_ENV is %s', (nodeEnv) => {
    expect(parseCrashReportingConfig({ dsn: DSN, nodeEnv })).toEqual({ dsn: DSN });
  });

  it('trims the DSN', () => {
    expect(parseCrashReportingConfig({ dsn: ` ${DSN} `, nodeEnv: 'production' })).toEqual({
      dsn: DSN,
    });
  });

  it.each([undefined, '', '   '])('is off, silently, when the DSN is %p', (dsn) => {
    expect(parseCrashReportingConfig({ dsn, nodeEnv: 'production' })).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('is always off under Jest, even with a valid DSN', () => {
    expect(parseCrashReportingConfig({ dsn: DSN, nodeEnv: 'test' })).toBeUndefined();
  });

  it.each([
    'http://0123456789abcdef0123456789abcdef@o123.ingest.de.sentry.io/456',
    'https://o123.ingest.de.sentry.io/456',
    'https://0123456789abcdef0123456789abcdef@o123.ingest.de.sentry.io/',
    'not a dsn',
  ])('is off when the DSN is malformed: %p', (dsn) => {
    expect(parseCrashReportingConfig({ dsn, nodeEnv: 'production' })).toBeUndefined();
  });

  it('names the variable in its warning but never echoes the value', () => {
    const malformed = 'https://secret-looking-value@example.com';

    parseCrashReportingConfig({ dsn: malformed, nodeEnv: 'production' });

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('EXPO_PUBLIC_SENTRY_DSN');
    expect(message).not.toContain(malformed);
  });
});

describe('getCrashReportingConfig', () => {
  it('is off in the test suite', () => {
    expect(getCrashReportingConfig()).toBeUndefined();
  });
});
