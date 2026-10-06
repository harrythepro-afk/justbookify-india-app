import { AppState, type AppStateStatus } from 'react-native';

import { loadAnalyticsConsent } from './consent';
import { trackAppOpen } from './events';

let started = false;

/**
 * Called once at start-up, before the first render; nothing waits for it. Reads the stored
 * consent and syncs Firebase to it (D-048), then logs `app_open` for the cold start, and again
 * each time the app comes back from the background. Nothing is sent without consent.
 */
export function startAnalytics(): void {
  if (started) return;
  started = true;

  void loadAnalyticsConsent().then(() => trackAppOpen({ source: 'cold_start' }));

  let previous: AppStateStatus = AppState.currentState;
  AppState.addEventListener('change', (next) => {
    if (next === 'active' && previous === 'background') trackAppOpen({ source: 'foreground' });
    previous = next;
  });
}
