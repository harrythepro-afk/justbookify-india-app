import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { connectFocusToAppState } from './focus';
import { appQueryClient } from './queryClient';

/** Gives every screen the app's one query cache (D-061), and refetches on return (D-063). */
export function AppQueryProvider({ children }: { readonly children: ReactNode }) {
  useEffect(() => connectFocusToAppState(), []);
  return <QueryClientProvider client={appQueryClient}>{children}</QueryClientProvider>;
}
