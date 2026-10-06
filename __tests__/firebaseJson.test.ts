import firebaseJson from '../firebase.json';

// firebase.json is read by React Native Firebase's native build. D-009 is permanent for
// version 1 (D-045, D-049): no advertising ID, no SSAID, every advertising consent denied.
// Analytics collection is opt-in (D-048, D-053): off at install, switched on at runtime only
// after the customer's consent.
const settings: Record<string, unknown> = firebaseJson['react-native'];

describe('firebase.json', () => {
  it.each([
    'google_analytics_adid_collection_enabled',
    'google_analytics_ssaid_collection_enabled',
    'analytics_default_allow_ad_storage',
    'analytics_default_allow_ad_user_data',
    'analytics_default_allow_ad_personalization_signals',
  ])('keeps %s false for all of version 1', (key) => {
    expect(settings[key]).toBe(false);
  });

  it('starts with analytics collection off and analytics storage denied until consent', () => {
    expect(settings.analytics_auto_collection_enabled).toBe(false);
    expect(settings.analytics_default_allow_analytics_storage).toBe(false);
  });

  // `true` would disable Analytics permanently: the runtime switch could never turn it on.
  it('lets the consent switch turn collection on at runtime', () => {
    expect(settings.analytics_collection_deactivated).toBe(false);
  });

  it('names screens by route only, never through automatic screen reporting', () => {
    expect(settings.google_analytics_automatic_screen_reporting_enabled).toBe(false);
  });

  it('holds only the React Native Firebase settings', () => {
    expect(Object.keys(firebaseJson)).toEqual(['react-native']);
  });
});
