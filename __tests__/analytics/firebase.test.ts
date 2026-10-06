import * as firebaseAnalytics from '@react-native-firebase/analytics';

import {
  clearAnalyticsData,
  NO_ADVERTISING,
  sendEvent,
  sendScreenView,
  turnCollectionOff,
  turnCollectionOn,
} from '@/analytics/firebase';
import * as wrapper from '@/analytics/firebase';

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  logScreenView: jest.fn(),
  resetAnalyticsData: jest.fn(),
  setAnalyticsCollectionEnabled: jest.fn(),
  setConsent: jest.fn(),
  setUserId: jest.fn(),
}));

describe('the Firebase Analytics wrapper', () => {
  it('does nothing under Jest', async () => {
    await turnCollectionOn();
    await turnCollectionOff();
    await clearAnalyticsData();
    await sendEvent('login', {});
    await sendScreenView('account');

    for (const fn of Object.values(firebaseAnalytics)) {
      if (jest.isMockFunction(fn)) expect(fn).not.toHaveBeenCalled();
    }
  });

  it('denies every advertising consent, whatever the analytics consent (D-049)', () => {
    expect(NO_ADVERTISING).toEqual({
      ad_storage: false,
      ad_user_data: false,
      ad_personalization: false,
    });
  });

  it('offers no way to set a user ID before Phase 7 (D-050)', () => {
    expect(Object.keys(wrapper).filter((name) => /user/i.test(name))).toEqual([]);
  });
});
