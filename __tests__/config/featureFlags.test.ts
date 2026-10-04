import {
  defaultFeatureFlags,
  FEATURE_FLAG_NAMES,
  FEATURE_FLAGS,
  FLAG_ACTIVATION_TIMEOUT_MILLIS,
  parseFeatureFlags,
  REMOTE_CONFIG_SETTINGS,
} from '@/config';
import { APP_ENVIRONMENTS } from '@/config/appEnvironment';

const SHEET_DEFAULT = {
  values: { checkout_presentation: 'sheet' },
  sources: { checkout_presentation: 'default' },
  malformed: [],
};

describe('feature flags', () => {
  it('has the checkout presentation switch from D-033, defaulting to the sheet', () => {
    expect(FEATURE_FLAG_NAMES).toEqual(['checkout_presentation']);
    expect(FEATURE_FLAGS.checkout_presentation).toEqual({
      values: ['sheet', 'browser'],
      defaultValue: 'sheet',
    });
  });

  it('gives every flag a default that is one of its own values', () => {
    for (const name of FEATURE_FLAG_NAMES) {
      const flag: { values: readonly string[]; defaultValue: string } = FEATURE_FLAGS[name];
      expect(flag.values).toContain(flag.defaultValue);
    }
  });

  it('uses the compiled defaults when Remote Config is empty', () => {
    expect(parseFeatureFlags({})).toEqual(SHEET_DEFAULT);
    expect(defaultFeatureFlags()).toEqual(SHEET_DEFAULT);
  });

  it('lets a valid Remote Config value override the default', () => {
    expect(
      parseFeatureFlags({ checkout_presentation: { value: 'browser', source: 'remote' } }),
    ).toEqual({
      values: { checkout_presentation: 'browser' },
      sources: { checkout_presentation: 'remote' },
      malformed: [],
    });
  });

  it('accepts the default value when Remote Config sets it explicitly', () => {
    const flags = parseFeatureFlags({
      checkout_presentation: { value: 'sheet', source: 'remote' },
    });

    expect(flags.values.checkout_presentation).toBe('sheet');
    expect(flags.sources.checkout_presentation).toBe('remote');
  });

  it.each(['Browser', 'BROWSER', ' browser', 'browser ', '', 'webview', 'true', '1', '{}'])(
    'falls back to the default for the malformed value %j and names the flag',
    (value) => {
      expect(parseFeatureFlags({ checkout_presentation: { value, source: 'remote' } })).toEqual({
        ...SHEET_DEFAULT,
        malformed: ['checkout_presentation'],
      });
    },
  );

  it.each(['default', 'static'] as const)(
    'ignores a value whose source is %s, without calling it malformed',
    (source) => {
      expect(parseFeatureFlags({ checkout_presentation: { value: 'browser', source } })).toEqual(
        SHEET_DEFAULT,
      );
    },
  );

  it('ignores Remote Config parameters that are not flags', () => {
    expect(
      parseFeatureFlags({ some_other_parameter: { value: 'browser', source: 'remote' } }),
    ).toEqual(SHEET_DEFAULT);
  });

  it('does not read a flag from the prototype chain', () => {
    const raw = Object.create({
      checkout_presentation: { value: 'browser', source: 'remote' },
    }) as Record<string, never>;

    expect(parseFeatureFlags(raw)).toEqual(SHEET_DEFAULT);
  });
});

describe('Remote Config settings (D-046)', () => {
  it('has settings for every environment, with a 30-second fetch timeout', () => {
    for (const environment of APP_ENVIRONMENTS) {
      expect(REMOTE_CONFIG_SETTINGS[environment].fetchTimeoutMillis).toBe(30_000);
    }
  });

  it('fetches at most hourly in production, every 15 minutes on staging, always in development', () => {
    expect(REMOTE_CONFIG_SETTINGS.production.minimumFetchIntervalMillis).toBe(3_600_000);
    expect(REMOTE_CONFIG_SETTINGS.staging.minimumFetchIntervalMillis).toBe(900_000);
    expect(REMOTE_CONFIG_SETTINGS.development.minimumFetchIntervalMillis).toBe(0);
  });

  it('waits at most 3 seconds for local activation', () => {
    expect(FLAG_ACTIVATION_TIMEOUT_MILLIS).toBe(3000);
  });
});
