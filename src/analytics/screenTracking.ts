import { useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAnalyticsConsent } from './consent';
import { trackScreenView } from './events';

/**
 * The screen name is the route's file path with Expo Router's groups removed, so `(tabs)/account`
 * is `account` and a book page would be `book/[id]`. `useSegments()` returns the file segments,
 * never the values in the address, so a parameter can never reach a screen name (D-053).
 */
export function screenNameFromSegments(segments: readonly string[]): string {
  const visible = segments.filter((segment) => !/^\(.*\)$/.test(segment));
  return visible.length === 0 ? 'index' : visible.join('/');
}

/**
 * Logs a screen view whenever the route changes, and once more when consent is granted, so the
 * screen the customer is on is counted too. Firebase's automatic screen reporting stays off.
 */
export function useScreenTracking(): void {
  const screenName = screenNameFromSegments(useSegments());
  const granted = useAnalyticsConsent().consent === 'granted';

  useEffect(() => {
    if (granted) trackScreenView(screenName);
  }, [screenName, granted]);
}
