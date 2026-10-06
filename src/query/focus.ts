import { focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * Tells TanStack Query when the app is in the foreground, so stale queries refetch when the
 * customer comes back to the app (D-063). Follows TanStack's React Native guide. Returns a
 * function that stops listening.
 */
export function connectFocusToAppState(): () => void {
  const subscription = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}
