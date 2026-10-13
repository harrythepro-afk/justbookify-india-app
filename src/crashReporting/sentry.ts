import * as Sentry from '@sentry/react-native';

import {
  getAppEnvironment,
  getCrashReportingConfig,
  getCustomerAccountConfig,
  getStoreConfig,
} from '@/config';

import { scrubBreadcrumb, scrubEvent, type SensitiveValues } from './scrub';

let started = false;

let customerTokenSource: () => readonly string[] = () => [];

/**
 * The customer's tokens held in memory (D-121), so the scrubber removes them by value as well as
 * by shape. Set by `src/customerAccount/session.ts`; this module never imports it, so there is
 * no import cycle.
 */
export function setCustomerTokenSource(source: () => readonly string[]): void {
  customerTokenSource = source;
}

function shopIdOrUndefined(): string | undefined {
  try {
    return getCustomerAccountConfig().shopId;
  } catch {
    return undefined;
  }
}

/** The store's own values, when configured, so the scrubber can remove them by value too. */
export function getSensitiveValues(): SensitiveValues {
  let values: SensitiveValues = {};
  try {
    const { storeDomain, storefrontAccessToken } = getStoreConfig();
    values = { storeDomain, storefrontToken: storefrontAccessToken };
  } catch {
    // An unconfigured build still scrubs by pattern.
  }
  const shopId = shopIdOrUndefined();
  return {
    ...values,
    ...(shopId === undefined ? {} : { shopId }),
    customerTokens: customerTokenSource(),
  };
}

/**
 * Starts Sentry once (D-042). Off, with no error, when no DSN is set and always under Jest.
 * Errors only: no tracing, replay, screenshots, view hierarchy, logs or failed-request capture,
 * and every event and breadcrumb passes through the scrubber first.
 */
export function startCrashReporting(): void {
  if (started) return;
  const config = getCrashReportingConfig();
  if (config === undefined) return;

  Sentry.init({
    dsn: config.dsn,
    environment: getAppEnvironment(),
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableAutoPerformanceTracing: false,
    enableUserInteractionTracing: false,
    enableCaptureFailedRequests: false,
    enableLogs: false,
    maxBreadcrumbs: 50,
    beforeSend: (event) => scrubEvent(event, getSensitiveValues()),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb, getSensitiveValues()),
  });
  started = true;
}

export function isCrashReportingOn(): boolean {
  return started;
}

/**
 * An unexpected feature-flag problem (D-046). `problem` is a fixed description plus an error
 * code, never a native error message or a flag value.
 */
export function reportFeatureFlagProblem(problem: string): void {
  if (!started) return;
  Sentry.captureException(new Error(`Remote Config: ${problem}`));
}

/** A flag whose Remote Config value is not allowed. Names the flag, never the value. */
export function reportMalformedFeatureFlag(name: string): void {
  if (!started) return;
  Sentry.captureMessage(
    `Remote Config: malformed value for ${name}; the in-app default is used`,
    'warning',
  );
}

/**
 * A Remote Config list with entries dropped or ignored as a whole (P6-11, D-116). `summary` is
 * built from reason codes and counts only (`src/analytics/wantedList.ts`): never a name or a value.
 */
export function reportMalformedRemoteConfigList(parameter: string, summary: string): void {
  if (!started) return;
  Sentry.captureMessage(`Remote Config: ${parameter} ${summary}`, 'warning');
}

/**
 * An analytics problem (D-048, D-053): a dropped event or a consent or Firebase call that
 * failed. `problem` names the event, parameter or step and an error code, never a value.
 */
export function reportAnalyticsProblem(problem: string): void {
  if (!started) return;
  Sentry.captureMessage(`Analytics: ${problem}`, 'warning');
}

/**
 * A Storefront API failure worth seeing (D-057). Carries the error code and the operation's
 * name only: never Shopify's message, the variables, the store's domain or the token.
 */
export function reportStorefrontProblem(code: string, operationName: string): void {
  if (!started) return;
  Sentry.captureMessage(`Storefront API: ${code} in ${operationName}`, 'error');
}

/**
 * A data-layer error that is not a Storefront error (D-061). Carries a code from
 * `safeErrorCode()` only: never the error's message.
 */
export function reportUnexpectedDataError(code: string): void {
  if (!started) return;
  Sentry.captureMessage(`Data layer: unexpected ${code}`, 'error');
}

/**
 * A login, refresh, storage or logout problem (D-121, D-122). `code` is one of the codes made in
 * `src/customerAccount/` (for example `refresh_refused` or `exchange_oauth_invalid_client`):
 * never a token, a URL, Shopify's text or the customer's email.
 */
export function reportCustomerAccountProblem(code: string): void {
  if (!started) return;
  Sentry.captureMessage(`Customer account: ${code}`, 'warning');
}

/** Development builds only: sends one handled error, so the owner can see it arrive. */
export function sendTestError(): void {
  if (!started) return;
  Sentry.captureException(new Error('P4-02 test error from the development build'));
}

/** Development builds only: crashes the app natively; the report is sent on the next launch. */
export function triggerTestNativeCrash(): void {
  if (!started) return;
  Sentry.nativeCrash();
}
