import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

/**
 * The only file that talks to expo-secure-store for the analytics consent (D-048, D-052), so
 * tests mock this one module. No stored value means the customer has not been asked.
 */

export type StoredAnalyticsConsent = 'granted' | 'denied';

const KEY = 'analytics_consent';

/** The stored value as found, which may be anything; `consent.ts` decides what it means. */
export function readStoredConsent(): Promise<string | null> {
  return getItemAsync(KEY);
}

export function writeStoredConsent(consent: StoredAnalyticsConsent): Promise<void> {
  return setItemAsync(KEY, consent);
}

export function deleteStoredConsent(): Promise<void> {
  return deleteItemAsync(KEY);
}
