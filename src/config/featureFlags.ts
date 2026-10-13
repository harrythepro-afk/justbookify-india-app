import type { AppEnvironment } from './appEnvironment';

/**
 * Feature flags read from Firebase Remote Config (D-012, D-046). Every flag has a safe value
 * compiled into the app, used whenever Remote Config has no valid value for it: no network,
 * an empty template, a failed activation or a malformed value. A flag's Remote Config
 * parameter has the same name as the flag.
 */
export const FEATURE_FLAGS = {
  /**
   * How checkout is presented (D-033): the in-app Checkout Kit sheet, or the system browser
   * with a return link. The kill switch for risk 2; used by the checkout screens in Phase 9.
   */
  checkout_presentation: { values: ['sheet', 'browser'], defaultValue: 'sheet' },
} as const satisfies Record<string, { values: readonly string[]; defaultValue: string }>;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

export type FeatureFlags = {
  readonly [Name in FeatureFlagName]: (typeof FEATURE_FLAGS)[Name]['values'][number];
};

/** Where a flag's value came from: a valid Remote Config value, or the compiled default. */
export type FeatureFlagSource = 'remote' | 'default';

export type FeatureFlagSnapshot = {
  readonly values: FeatureFlags;
  readonly sources: { readonly [Name in FeatureFlagName]: FeatureFlagSource };
  /** Flags whose Remote Config value was set but not one of the allowed values. */
  readonly malformed: readonly FeatureFlagName[];
};

/** One Remote Config value as React Native Firebase reports it. */
export type RawRemoteConfigValue = {
  readonly value: string;
  readonly source: 'remote' | 'default' | 'static';
};

export const FEATURE_FLAG_NAMES = Object.keys(FEATURE_FLAGS) as FeatureFlagName[];

function allowedValue(
  name: FeatureFlagName,
  value: string,
): FeatureFlags[FeatureFlagName] | undefined {
  const allowed: readonly string[] = FEATURE_FLAGS[name].values;
  return allowed.includes(value) ? (value as FeatureFlags[FeatureFlagName]) : undefined;
}

export function defaultFeatureFlags(): FeatureFlagSnapshot {
  return parseFeatureFlags({});
}

/**
 * Only a value whose source is `remote` and that is exactly one of the allowed values (same
 * case, no spaces) overrides the default. The app sets no Remote Config defaults of its own,
 * so `default` and `static` both mean Remote Config has nothing for the flag.
 */
export function parseFeatureFlags(
  raw: Readonly<Record<string, RawRemoteConfigValue | undefined>>,
): FeatureFlagSnapshot {
  const values: Partial<Record<FeatureFlagName, string>> = {};
  const sources: Partial<Record<FeatureFlagName, FeatureFlagSource>> = {};
  const malformed: FeatureFlagName[] = [];

  for (const name of FEATURE_FLAG_NAMES) {
    const entry = Object.prototype.hasOwnProperty.call(raw, name) ? raw[name] : undefined;
    const remote = entry?.source === 'remote' ? allowedValue(name, entry.value) : undefined;

    if (entry?.source === 'remote' && remote === undefined) malformed.push(name);
    values[name] = remote ?? FEATURE_FLAGS[name].defaultValue;
    sources[name] = remote === undefined ? 'default' : 'remote';
  }

  return {
    values: values as FeatureFlags,
    sources: sources as FeatureFlagSnapshot['sources'],
    malformed,
  };
}

/**
 * The wanted list (P6-11, D-115, D-116): names the owner is thinking of stocking, held in one
 * Remote Config parameter of JSON type as a plain list of strings. It is read with the flags, on
 * the same timing (D-046), and parsed by `src/analytics/wantedList.ts`. The compiled default is an
 * empty list. Each name's code is made by the app, never written by hand.
 */
export const WANTED_LIST = {
  parameter: 'search_wanted_list',
  /** Entries after this many, in the list's order, are dropped. */
  maxEntries: 200,
  /** The longest name kept, in characters (code points), as the search field (D-097). */
  maxNameLength: 100,
} as const;

export type RemoteConfigSettings = {
  readonly minimumFetchIntervalMillis: number;
  readonly fetchTimeoutMillis: number;
};

const MINUTE = 60 * 1000;

/**
 * D-046. Values fetched in one session apply from the next cold start, so in production a
 * change reaches a phone at its second cold start after the change, the first of them at
 * least an hour after its previous fetch. Firebase's own default interval is 12 hours.
 */
export const REMOTE_CONFIG_SETTINGS: Record<AppEnvironment, RemoteConfigSettings> = {
  development: { minimumFetchIntervalMillis: 0, fetchTimeoutMillis: 30 * 1000 },
  staging: { minimumFetchIntervalMillis: 15 * MINUTE, fetchTimeoutMillis: 30 * 1000 },
  production: { minimumFetchIntervalMillis: 60 * MINUTE, fetchTimeoutMillis: 30 * 1000 },
};

/**
 * The longest a flag consumer waits for the last fetched values to be activated from the
 * phone's storage (a local read, no network) before the defaults are used for the session.
 */
export const FLAG_ACTIVATION_TIMEOUT_MILLIS = 3000;
