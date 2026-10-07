import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Whether a network state means the phone is offline (D-064). Only a definite "not connected"
 * counts: an unknown type, a missing field or an unreadable state counts as online, so a wrong
 * reading never holds queries back. `isInternetReachable` is not used, because Android sets it
 * from its own connectivity check, which some working networks never pass.
 */
export function isOfflineState(state: Network.NetworkState): boolean {
  return state.isConnected === false && state.type !== Network.NetworkStateType.UNKNOWN;
}

/** How long the app waits between re-reads while it counts as offline in the foreground (D-082). */
export const OFFLINE_RECHECK_MS = 3_000;

/** Re-reads the network state now; set while `connectOnlineToNetwork` is connected. */
let readNetworkNow: (() => Promise<void>) | undefined;

/**
 * Tells TanStack Query when the phone goes offline and comes back (D-064), following TanStack's
 * React Native guide. Offline, queries pause and keep their cached data; on reconnect, paused
 * queries resume and stale ones refetch. Mutations are never paused (D-065).
 *
 * The platform's change events can leave the app wrongly offline (seen once in P6-03's phone
 * check, D-082), so the app also re-reads the state itself: each time it returns to the
 * foreground, and, while it is in the foreground and counts as offline, every few seconds until
 * it reads online. No timer runs while online or in the background. Returns a function that stops
 * listening and puts the online state back to TanStack's default.
 */
export function connectOnlineToNetwork(): () => void {
  onlineManager.setEventListener((setOnline) => {
    let changed = false;
    // At launch the state can briefly be unknown; only "background" counts as away.
    let inForeground = AppState.currentState !== 'background';
    let recheck: ReturnType<typeof setTimeout> | undefined;

    const stopRechecking = () => {
      clearTimeout(recheck);
      recheck = undefined;
    };
    const recheckLater = () => {
      if (!inForeground || recheck !== undefined || onlineManager.isOnline()) return;
      recheck = setTimeout(() => {
        recheck = undefined;
        void read();
      }, OFFLINE_RECHECK_MS);
    };
    const apply = (state: Network.NetworkState) => {
      setOnline(!isOfflineState(state));
      if (onlineManager.isOnline()) stopRechecking();
      else recheckLater();
    };
    const read = async () => {
      try {
        apply(await Network.getNetworkStateAsync());
      } catch {
        // An unreadable state changes nothing; if the app counts as offline, it tries again.
        recheckLater();
      }
    };

    const events = Network.addNetworkStateListener((state) => {
      changed = true;
      apply(state);
    });
    const appState = AppState.addEventListener('change', (status: AppStateStatus) => {
      inForeground = status !== 'background';
      if (status === 'active') void read();
      else if (!inForeground) stopRechecking();
    });
    Network.getNetworkStateAsync()
      .then((state) => {
        if (!changed) apply(state);
      })
      // An unreadable first state leaves the app online (D-064).
      .catch(() => undefined);
    readNetworkNow = read;

    return () => {
      stopRechecking();
      events.remove();
      appState.remove();
      readNetworkNow = undefined;
    };
  });
  return () => {
    // Replacing the listener removes ours; TanStack's own default listener always says online.
    onlineManager.setEventListener(() => undefined);
    onlineManager.setOnline(true);
  };
}

/**
 * Re-reads the network state and tells the query cache, before "Try again" refetches (D-082), so
 * a customer is never held back by an old offline signal. Does nothing when not connected.
 */
export async function recheckNetwork(): Promise<void> {
  await readNetworkNow?.();
}

function subscribeToOnline(onChange: () => void): () => void {
  return onlineManager.subscribe(onChange);
}

function isOfflineNow(): boolean {
  return !onlineManager.isOnline();
}

/**
 * Whether the app currently counts as offline (D-064), for screens that say so (D-078). It
 * follows TanStack's online state, which is what pauses queries.
 */
export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribeToOnline, isOfflineNow, isOfflineNow);
}
