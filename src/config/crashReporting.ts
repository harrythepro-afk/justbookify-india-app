/**
 * Crash reporting configuration (D-042). The Sentry DSN is public by design: it only lets an
 * app send events to the project. It comes from an EXPO_PUBLIC_ variable so a second store
 * can use its own Sentry project without code changes.
 */

export type CrashReportingConfig = { readonly dsn: string };

export const SENTRY_DSN_ENV_NAME = 'EXPO_PUBLIC_SENTRY_DSN';

// https://<32 hex public key>@<ingest host>/<numeric project ID>
const DSN_PATTERN = /^https:\/\/[0-9a-f]{32}@[a-z0-9.-]+\/\d+$/;

/**
 * Crash reporting is off, with no error, when the DSN is unset or blank and always under
 * Jest, even if `.env.local` holds a DSN. A malformed DSN also turns it off, with a warning
 * that names the variable but never echoes its value.
 */
export function parseCrashReportingConfig(env: {
  dsn: string | undefined;
  nodeEnv: string | undefined;
}): CrashReportingConfig | undefined {
  if (env.nodeEnv === 'test') return undefined;

  const dsn = env.dsn?.trim();
  if (dsn === undefined || dsn === '') return undefined;

  if (!DSN_PATTERN.test(dsn)) {
    console.warn(`${SENTRY_DSN_ENV_NAME} is not a valid Sentry DSN; crash reporting is off.`);
    return undefined;
  }
  return { dsn };
}

/** Static `process.env.NAME` access, so Expo inlines the value at build time (see store.ts). */
export function getCrashReportingConfig(): CrashReportingConfig | undefined {
  return parseCrashReportingConfig({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    nodeEnv: process.env.NODE_ENV,
  });
}
