import {
  getAnalytics,
  logEvent,
  logScreenView,
  resetAnalyticsData,
  setAnalyticsCollectionEnabled,
  setConsent,
} from '@react-native-firebase/analytics';

/**
 * The only file that talks to Firebase Analytics (D-048, D-053), so tests mock this one module.
 * Every call does nothing under Jest.
 *
 * There is deliberately no user ID function: none is set until Phase 7, and then only under the
 * rules in D-050.
 */

/** A parameter value as Google Analytics accepts it, after the guard (`guard.ts`). */
export type AnalyticsWireValue = string | number;

// D-009 as amended by D-049: every advertising consent stays denied for all of version 1.
export const NO_ADVERTISING = {
  ad_storage: false,
  ad_user_data: false,
  ad_personalization: false,
} as const;

const UNDER_JEST = process.env.NODE_ENV === 'test';

/**
 * Grants analytics storage and switches collection on. Both settings persist on the phone across
 * launches until changed (Firebase's "Configure Analytics data collection" page).
 */
export async function turnCollectionOn(): Promise<void> {
  if (UNDER_JEST) return;
  const analytics = getAnalytics();
  await setConsent(analytics, { analytics_storage: true, ...NO_ADVERTISING });
  await setAnalyticsCollectionEnabled(analytics, true);
}

/** Switches collection off first, then denies analytics storage. */
export async function turnCollectionOff(): Promise<void> {
  if (UNDER_JEST) return;
  const analytics = getAnalytics();
  await setAnalyticsCollectionEnabled(analytics, false);
  await setConsent(analytics, { analytics_storage: false, ...NO_ADVERTISING });
}

/** Clears the analytics data on the phone and starts a new app instance ID. */
export async function clearAnalyticsData(): Promise<void> {
  if (UNDER_JEST) return;
  await resetAnalyticsData(getAnalytics());
}

export async function sendEvent(
  name: string,
  params: Readonly<Record<string, AnalyticsWireValue>>,
): Promise<void> {
  if (UNDER_JEST) return;
  await logEvent(getAnalytics(), name, { ...params });
}

/** A screen view named by its route (`screenTracking.ts`), never by its parameters. */
export async function sendScreenView(screenName: string): Promise<void> {
  if (UNDER_JEST) return;
  await logScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName });
}
