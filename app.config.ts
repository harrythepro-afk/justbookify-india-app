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

// Each environment's google-services.json comes from its own Firebase project (D-044). On EAS
// it is the file variable GOOGLE_SERVICES_JSON, whose value is the file's path on the build
// machine. Locally it is the gitignored file in the project root. Only prebuild reads the
// file, so the config still evaluates where it is absent, as in CI.
const LOCAL_GOOGLE_SERVICES_FILE = './google-services.json';

// D-009, permanent for version 1 (D-045, D-049): no advertising ID and no ad attribution.
// Firebase Analytics declares these permissions; Expo removes them from the merged manifest.
// The second and third are Android's Privacy Sandbox advertising ID and attribution. The last
// two come with expo-secure-store's biometric library; the app never uses biometric unlock
// (D-052).
const BLOCKED_PERMISSIONS = [
  'com.google.android.gms.permission.AD_ID',
  'android.permission.ACCESS_ADSERVICES_AD_ID',
  'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
  'android.permission.USE_BIOMETRIC',
  'android.permission.USE_FINGERPRINT',
];

const ENVIRONMENT_VARIANTS: Record<AppEnvironment, { idSuffix: string; nameSuffix: string }> = {
  development: { idSuffix: '.dev', nameSuffix: ' (Dev)' },
  staging: { idSuffix: '.staging', nameSuffix: ' (Staging)' },
  production: { idSuffix: '', nameSuffix: '' },
};

// The shop's numeric ID names the login callback scheme, `shop.<id>.app` (Shopify requires
// `shop.{shop_id}.*` for mobile clients; D-120). The scheme is compiled into the build, so on EAS
// EXPO_PUBLIC_SHOP_ID is an environment variable of the build's environment; .env.local is never
// uploaded. The same rule as SHOP_ID_PATTERN in src/config/customerAccount.ts (a test keeps them
// in step).
const SHOP_ID_PATTERN = /^\d{1,20}$/;

/**
 * Unset or empty means a build without login (development and staging only; the Account tab
 * says so). A production build without it stops, as does a value that is set but is not a shop
 * ID, rather than registering a scheme no login can return to.
 */
export function resolveShopId(
  value: string | undefined,
  appEnv: AppEnvironment,
): string | undefined {
  const text = value?.trim();
  if (text === undefined || text === '') {
    if (appEnv === 'production') throw new Error('EXPO_PUBLIC_SHOP_ID is required for production.');
    return undefined;
  }
  if (!SHOP_ID_PATTERN.test(text)) throw new Error('EXPO_PUBLIC_SHOP_ID must be digits only.');
  return text;
}

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

export function buildConfig(
  appEnv: AppEnvironment,
  base: Partial<ExpoConfig> = {},
  googleServicesFile: string = LOCAL_GOOGLE_SERVICES_FILE,
  shopId?: string,
): ExpoConfig {
  const { idSuffix, nameSuffix } = ENVIRONMENT_VARIANTS[appEnv];
  const appId = `${PRODUCTION_APP_ID}${idSuffix}`;
  // The app's own scheme first, then the login callback scheme when the shop ID is known.
  const scheme = shopId === undefined ? appId : [appId, `shop.${shopId}.app`];

  return {
    ...base,
    name: `${APP_NAME}${nameSuffix}`,
    owner: EAS_OWNER,
    slug: 'justbookify-india',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme,
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
      googleServicesFile,
      blockedPermissions: BLOCKED_PERMISSIONS,
      // No backup and no device-to-device transfer, so a restored install never starts with
      // analytics collection on but no stored consent (D-052; see plugins/withNoAndroidBackup.js).
      allowBackup: false,
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
      // Copies google-services.json into the native project and applies the Google Services
      // Gradle plugin (D-045).
      '@react-native-firebase/app',
      // iOS only: builds Analytics without advertising ID support (D-009, D-045). Collection
      // itself is off in firebase.json.
      ['@react-native-firebase/analytics', { ios: { withoutAdIdSupport: true } }],
      // Stores the analytics consent (D-048, D-052). Its own backup rules are off because they
      // back up every other SharedPreferences file, including Firebase's collection setting.
      ['expo-secure-store', { configureAndroidBackup: false }],
      './plugins/withNoAndroidBackup',
    ],
    experiments: { typedRoutes: true },
    extra: { appEnv, eas: { projectId: EAS_PROJECT_ID } },
  };
}

// APP_ENV, GOOGLE_SERVICES_JSON and EXPO_PUBLIC_SHOP_ID are read when the config is evaluated,
// at build time.
export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = resolveAppEnv(process.env.APP_ENV);
  return buildConfig(
    appEnv,
    config,
    process.env.GOOGLE_SERVICES_JSON,
    resolveShopId(process.env.EXPO_PUBLIC_SHOP_ID, appEnv),
  );
};
