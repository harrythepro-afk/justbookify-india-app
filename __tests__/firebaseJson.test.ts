import firebaseJson from '../firebase.json';

// firebase.json is read by React Native Firebase's native build. D-009 is permanent for
// version 1 (D-045): no advertising ID, no SSAID, every advertising consent denied. P4-04 may
// switch on analytics collection only; the advertising keys stay false.
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

  it('keeps analytics collection off until P4-04', () => {
    expect(settings.analytics_auto_collection_enabled).toBe(false);
    expect(settings.analytics_collection_deactivated).toBe(true);
    expect(settings.google_analytics_automatic_screen_reporting_enabled).toBe(false);
    expect(settings.analytics_default_allow_analytics_storage).toBe(false);
  });

  it('holds only the React Native Firebase settings', () => {
    expect(Object.keys(firebaseJson)).toEqual(['react-native']);
  });
});
