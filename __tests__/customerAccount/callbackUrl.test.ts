import { redirectSystemPath } from '@/app/+native-intent';
import { isLoginCallback, redirectForIncomingLink } from '@/customerAccount/callbackUrl';

const CALLBACK = 'shop.987654321012.app://callback?code=abc123&state=xyz789';

describe('the login callback and Expo Router (P7-01, D-120)', () => {
  it.each(['shop.987654321012.app://callback', CALLBACK, 'SHOP.987654321012.APP://callback#x'])(
    'recognises %s',
    (url) => {
      expect(isLoginCallback(url)).toBe(true);
    },
  );

  it.each([
    'com.justbookify.india.dev://account',
    'shop.987654321012.app://other',
    'shop.app://callback',
    'https://example.com/callback?code=abc',
    '/account',
  ])('leaves %s alone', (url) => {
    expect(isLoginCallback(url)).toBe(false);
    expect(redirectForIncomingLink(url, true)).toBe(url);
    expect(redirectForIncomingLink(url, false)).toBe(url);
  });

  it('opens the Account tab, with no query, when the callback started the app', () => {
    expect(redirectSystemPath({ path: CALLBACK, initial: true })).toBe('/account');
  });

  it('does not move when the callback arrives while the app runs (the Account tab is in front)', () => {
    expect(redirectSystemPath({ path: CALLBACK, initial: false })).toBeNull();
  });
});
