import type { ConfigContext, ExpoConfig } from 'expo/config';

// Type-only on purpose. The Expo CLI transpiles this file alone and cannot resolve a runtime
// import of another local TypeScript file, so nothing from src/ may be imported as a value.
import type { AppEnvironment } from './src/config/appEnvironment';

// Store-specific: the Bahrain app will have its own base ID (D-011).
const PRODUCTION_APP_ID = 'com.justbookify.india';

const APP_NAME = 'JustBookify';

// The Expo account that owns the EAS project, and that project's ID. Neither is a secret (D-028).
const EAS_OWNER = 'hemant6626';
const EAS_PROJECT_ID = '33687d66-0fd2-4b7d-8f50-30c1cb920c3c';

// Sentry's EU region, where the owner's organisation lives (D-042). The plugin reads the auth
// token for source map uploads only from the SENTRY_AUTH_TOKEN variable, an EAS secret; no
// token ever belongs in this file.
const SENTRY_URL = 'https://de.sentry.io/';
// The Sentry organisation and project that receive this app's crash reports. Not secrets.
const SENTRY_ORG = 'justbookify';
const SENTRY_PROJECT = 'react-native';

const ENVIRONMENT_VARIANTS: Record<AppEnvironment, { idSuffix: string; nameSuffix: string }> = {
  development: { idSuffix: '.dev', nameSuffix: ' (Dev)' },
  staging: { idSuffix: '.staging', nameSuffix: ' (Staging)' },
  production: { idSuffix: '', nameSuffix: '' },
};

/** Unset means development, so a forgotten variable can never yield the production app ID. */
export function resolveAppEnv(value: string | undefined): AppEnvironment {
  const requested = value ?? 'development';
  const match = (Object.keys(ENVIRONMENT_VARIANTS) as AppEnvironment[]).find(
    (appEnv) => appEnv === requested,
  );
  if (match === undefined) {
    throw new Error(`APP_ENV must be one of: ${Object.keys(ENVIRONMENT_VARIANTS).join(', ')}.`);
  }
  return match;
}

export function buildConfig(appEnv: AppEnvironment, base: Partial<ExpoConfig> = {}): ExpoConfig {
  const { idSuffix, nameSuffix } = ENVIRONMENT_VARIANTS[appEnv];
  const appId = `${PRODUCTION_APP_ID}${idSuffix}`;

  return {
    ...base,
    name: `${APP_NAME}${nameSuffix}`,
    owner: EAS_OWNER,
    slug: 'justbookify-india',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: appId,
    ios: { bundleIdentifier: appId, supportsTablet: true },
    android: {
      package: appId,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-router',
      'expo-status-bar',
      // Makes `userInterfaceStyle` take effect on Android, so the app stays light even when the
      // phone is in dark theme and Android draws dark navigation buttons (D-043).
      'expo-system-ui',
      [
        '@sentry/react-native/expo',
        { url: SENTRY_URL, organization: SENTRY_ORG, project: SENTRY_PROJECT },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: { appEnv, eas: { projectId: EAS_PROJECT_ID } },
  };
}

// APP_ENV is read when the config is evaluated, at build time.
export default ({ config }: ConfigContext): ExpoConfig =>
  buildConfig(resolveAppEnv(process.env.APP_ENV), config);
