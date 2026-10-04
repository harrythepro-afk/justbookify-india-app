import {
  activate,
  fetchConfig,
  getAll,
  getRemoteConfig,
} from '@react-native-firebase/remote-config';

import type { RawRemoteConfigValue, RemoteConfigSettings } from '@/config';

/**
 * The only file that talks to Firebase Remote Config (D-045, D-046), so tests mock this one
 * module and never need Firebase or a network.
 *
 * Never call `ensureInitialized()`: on Android, React Native Firebase 26.4.0 also runs a
 * blocking fetch-and-activate inside it, which would apply new values in the middle of a
 * launch.
 */

/**
 * Applies the fetch settings, then activates the values fetched in an earlier session. This
 * reads the phone's storage only. Resolves with every parameter Remote Config now holds.
 */
export async function activateLastFetched(
  settings: RemoteConfigSettings,
): Promise<Record<string, RawRemoteConfigValue>> {
  const remoteConfig = getRemoteConfig();
  remoteConfig.settings = { ...settings };
  await activate(remoteConfig);

  const values: Record<string, RawRemoteConfigValue> = {};
  for (const [key, value] of Object.entries(getAll(remoteConfig))) {
    values[key] = { value: value.asString(), source: value.getSource() };
  }
  return values;
}

/**
 * Fetches new values and stores them without activating them, so they apply from the next
 * cold start ("load new values for next startup" in Firebase's loading guide). Skipped by the
 * SDK when the last fetch is younger than the minimum fetch interval.
 */
export async function fetchForNextLaunch(): Promise<void> {
  await fetchConfig(getRemoteConfig());
}
