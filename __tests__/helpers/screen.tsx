import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** An iPhone-sized screen with a status bar and a bottom system bar, so insets can be checked. */
export const SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Wraps a screen in the safe area above and a provider for the given query client. */
export function withScreen(client: QueryClient) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={SAFE_AREA}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    );
  };
}
