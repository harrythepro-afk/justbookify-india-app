import { buildConfig, resolveAppEnv } from '../app.config';
import { APP_ENVIRONMENTS, parseAppEnvironment } from '@/config/appEnvironment';

describe('buildConfig', () => {
  it.each([
    ['production', 'JustBookify', 'com.justbookify.india'],
    ['staging', 'JustBookify (Staging)', 'com.justbookify.india.staging'],
    ['development', 'JustBookify (Dev)', 'com.justbookify.india.dev'],
  ] as const)('sets the name and app ID for %s', (appEnv, name, appId) => {
    const config = buildConfig(appEnv);

    expect(config.name).toBe(name);
    expect(config.ios?.bundleIdentifier).toBe(appId);
    expect(config.android?.package).toBe(appId);
    expect(config.extra?.appEnv).toBe(appEnv);
  });

  it.each(APP_ENVIRONMENTS)('links %s to the one EAS project', (appEnv) => {
    const config = buildConfig(appEnv);

    expect(config.owner).toBe('hemant6626');
    expect(config.extra?.eas).toEqual({ projectId: '33687d66-0fd2-4b7d-8f50-30c1cb920c3c' });
  });

  it.each(APP_ENVIRONMENTS)("adds Sentry's config plugin for the EU region to %s", (appEnv) => {
    const sentry = buildConfig(appEnv).plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === '@sentry/react-native/expo',
    );

    expect(sentry).toEqual([
      '@sentry/react-native/expo',
      { url: 'https://de.sentry.io/', organization: 'justbookify', project: 'react-native' },
    ]);
  });

  it.each(APP_ENVIRONMENTS)('keeps %s light on Android through expo-system-ui', (appEnv) => {
    const config = buildConfig(appEnv);

    expect(config.userInterfaceStyle).toBe('light');
    expect(config.plugins).toContain('expo-system-ui');
  });

  it.each(APP_ENVIRONMENTS)(
    "reads %s's google-services.json from the gitignored local file by default",
    (appEnv) => {
      expect(buildConfig(appEnv).android?.googleServicesFile).toBe('./google-services.json');
    },
  );

  it("uses the EAS file variable's path when the build supplies one", () => {
    const config = buildConfig('development', {}, '/home/expo/workingdir/google-services.json');

    expect(config.android?.googleServicesFile).toBe('/home/expo/workingdir/google-services.json');
  });

  it.each(APP_ENVIRONMENTS)("adds React Native Firebase's config plugins to %s", (appEnv) => {
    const { plugins } = buildConfig(appEnv);

    expect(plugins).toContain('@react-native-firebase/app');
    expect(plugins).toContainEqual([
      '@react-native-firebase/analytics',
      { ios: { withoutAdIdSupport: true } },
    ]);
  });

  it.each(APP_ENVIRONMENTS)('blocks the advertising ID permission on %s (D-009)', (appEnv) => {
    expect(buildConfig(appEnv).android?.blockedPermissions).toEqual([
      'com.google.android.gms.permission.AD_ID',
    ]);
  });

  it('never puts an auth token in the config', () => {
    const text = JSON.stringify(APP_ENVIRONMENTS.map((appEnv) => buildConfig(appEnv)));

    expect(text).not.toMatch(/authToken|auth_token|sntrys_|sntryu_/i);
  });

  it('keeps fields from the base config that it does not set', () => {
    const config = buildConfig('development', { sdkVersion: '57.0.0' });

    expect(config.sdkVersion).toBe('57.0.0');
  });
});

describe('resolveAppEnv', () => {
  it('treats an unset variable as development, never production', () => {
    expect(resolveAppEnv(undefined)).toBe('development');
  });

  it.each(APP_ENVIRONMENTS)('accepts %s', (value) => {
    expect(resolveAppEnv(value)).toBe(value);
  });

  it.each(['', 'prod', 'Production'])('rejects %p', (value) => {
    expect(() => resolveAppEnv(value)).toThrow('APP_ENV must be one of');
  });
});

describe('environments', () => {
  it('give every environment the app recognises its own app ID', () => {
    const appIds = APP_ENVIRONMENTS.map((appEnv) => buildConfig(appEnv).ios?.bundleIdentifier);

    expect(new Set(appIds).size).toBe(APP_ENVIRONMENTS.length);
  });
});

describe('parseAppEnvironment', () => {
  it.each(APP_ENVIRONMENTS)('accepts %s', (value) => {
    expect(parseAppEnvironment(value)).toBe(value);
  });

  it.each([undefined, '', 'prod', 'Production', 42])('rejects %p', (value) => {
    expect(() => parseAppEnvironment(value)).toThrow('APP_ENV must be one of');
  });
});
