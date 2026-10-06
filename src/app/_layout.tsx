import { Archivo_400Regular, Archivo_700Bold } from '@expo-google-fonts/archivo';
import { Asul_400Regular } from '@expo-google-fonts/asul';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useScreenTracking } from '@/analytics/screenTracking';
import { startAnalytics } from '@/analytics/start';
import { EnvironmentBanner } from '@/components/EnvironmentBanner';
import { getAppEnvironment } from '@/config';
import { startCrashReporting } from '@/crashReporting/sentry';
import { startFeatureFlags } from '@/featureFlags/session';
import { AppQueryProvider } from '@/query/QueryProvider';

// Once, before the first render, so a crash during start-up is reported too (D-042).
startCrashReporting();
// Starts activating the flags fetched last session; the first render does not wait (D-046).
startFeatureFlags();
// Reads the customer's analytics consent; nothing is sent without it (D-048).
startAnalytics();

export default function RootLayout() {
  useScreenTracking();

  // Loaded at runtime, so no new native build is needed (D-041). The keys are the
  // family names in src/theme/tokens.ts.
  const [fontsLoaded, fontError] = useFonts({
    Asul_400Regular,
    Archivo_400Regular,
    Archivo_700Bold,
  });

  // If the fonts fail to load, the app goes on with the system fonts.
  if (!fontsLoaded && fontError === null) return null;

  return (
    <AppQueryProvider>
      <EnvironmentBanner>
        <Stack screenOptions={{ headerShown: false }} />
      </EnvironmentBanner>
      {/* Light text over the dark banner; dark text over the light screens on production. */}
      <StatusBar style={getAppEnvironment() === 'production' ? 'dark' : 'light'} />
    </AppQueryProvider>
  );
}
