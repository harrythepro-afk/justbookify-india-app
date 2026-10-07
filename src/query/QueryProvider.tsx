import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { getAppEnvironment } from '@/config';

import { connectFocusToAppState } from './focus';
import { startNetworkLog } from './networkLog';
import { connectOnlineToNetwork } from './online';
import { appQueryClient } from './queryClient';

// Screens may import this module only (D-063): the development tools read the network log here.
export { describeReading, useNetworkLog, type NetworkLog } from './networkLog';

/**
 * Gives every screen the app's one query cache (D-061), refetches on return to the app (D-063)
 * and pauses queries while the phone is offline (D-064). On development builds it also keeps a
 * log of what the platform says about the network, for the development tools.
 */
export function AppQueryProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => connectFocusToAppState(), []);
  useEffect(() => connectOnlineToNetwork(), []);
  useEffect(() => (getAppEnvironment() === 'development' ? startNetworkLog() : undefined), []);
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
