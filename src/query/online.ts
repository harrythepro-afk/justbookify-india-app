import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Whether a network state means the phone is offline (D-064). Only a definite "not connected"
 * counts: an unknown type, a missing field or an unreadable state counts as online, so a wrong
 * reading never holds queries back. `isInternetReachable` is not used, because Android sets it
 * from its own connectivity check, which some working networks never pass.
 */
export function isOfflineState(state: Network.NetworkState): boolean {
  return state.isConnected === false && state.type !== Network.NetworkStateType.UNKNOWN;
}

/**
 * Tells TanStack Query when the phone goes offline and comes back (D-064), following TanStack's
 * React Native guide. Offline, queries pause and keep their cached data; on reconnect, paused
 * queries resume and stale ones refetch. Mutations are never paused (D-065). Returns a function
 * that stops listening and puts the online state back to TanStack's default.
 */
export function connectOnlineToNetwork(): () => void {
  onlineManager.setEventListener((setOnline) => {
    let changed = false;
    const subscription = Network.addNetworkStateListener((state) => {
      changed = true;
      setOnline(!isOfflineState(state));
    });
    Network.getNetworkStateAsync()
      .then((state) => {
        if (!changed) setOnline(!isOfflineState(state));
      })
      // An unreadable state leaves the app online (D-064).
      .catch(() => undefined);
    return () => subscription.remove();
  });
  return () => {
    // Replacing the listener removes ours; TanStack's own default listener always says online.
    onlineManager.setEventListener(() => undefined);
    onlineManager.setOnline(true);
  };
}
