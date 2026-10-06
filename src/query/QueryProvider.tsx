import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { connectFocusToAppState } from './focus';
import { connectOnlineToNetwork } from './online';
import { appQueryClient } from './queryClient';

/**
 * Gives every screen the app's one query cache (D-061), refetches on return to the app (D-063)
 * and pauses queries while the phone is offline (D-064).
 */
export function AppQueryProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => connectFocusToAppState(), []);
  useEffect(() => connectOnlineToNetwork(), []);
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
