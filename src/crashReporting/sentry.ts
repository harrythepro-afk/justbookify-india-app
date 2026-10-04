import * as Sentry from '@sentry/react-native';

import { getAppEnvironment, getCrashReportingConfig, getStoreConfig } from '@/config';

import { scrubBreadcrumb, scrubEvent, type SensitiveValues } from './scrub';

let started = false;

/** The store's own values, when configured, so the scrubber can remove them by value too. */
function getSensitiveValues(): SensitiveValues {
  try {
    const { storeDomain, storefrontAccessToken } = getStoreConfig();
    return { storeDomain, storefrontToken: storefrontAccessToken };
  } catch {
    // An unconfigured build still scrubs by pattern.
    return {};
  }
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
