import { hashKey, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * When the screen using `queryKey` regains focus, refetches that query only if it is stale under
 * its own freshness preset (D-079). Fresh data is never refetched. Follows TanStack's React
 * Native guide ("Refresh on Screen focus", checked 7 October 2026): `useFocusEffect` also runs
 * when the screen first mounts, and that first run is skipped, because mounting already fetches.
 * The app's return to the foreground is handled separately (D-063).
 */
export function useRefetchStaleOnFocus(queryKey: QueryKey): void {
  const queryClient = useQueryClient();
  const firstFocus = useRef(true);
  // The key's hash, not the array: a new array each render must not re-run the effect. The app
  // uses TanStack's default key hashing, so this is the query's own `queryHash`.
  const keyHash = hashKey(queryKey);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void queryClient.refetchQueries({
        predicate: (query) => query.queryHash === keyHash,
        stale: true,
        type: 'active',
      });
    }, [queryClient, keyHash]),
  );
}
