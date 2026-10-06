import easJson from '../eas.json';

type Profile = { readonly env?: Readonly<Record<string, string>> };

const profiles: Readonly<Record<string, Profile>> = easJson.build;
const ARCHITECTURES = 'ORG_GRADLE_PROJECT_reactNativeArchitectures';

describe('eas.json build profiles', () => {
  it('builds the development app for the owner phone processor type only (D-066)', () => {
    expect(profiles.development?.env?.[ARCHITECTURES]).toBe('arm64-v8a');
  });

  it.each(['staging', 'production'])(
    'leaves %s on every processor type the stores need (D-066)',
    (name) => {
      expect(profiles[name]).toBeDefined();
      expect(profiles[name]?.env?.[ARCHITECTURES]).toBeUndefined();
    },
  );

  it.each(['development', 'staging', 'production'])('sets APP_ENV for %s', (name) => {
    expect(profiles[name]?.env?.APP_ENV).toBe(name);
  });
});
