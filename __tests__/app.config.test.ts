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
