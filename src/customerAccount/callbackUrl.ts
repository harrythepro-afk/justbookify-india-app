/**
 * The login callback, `shop.<shop ID>.app://callback?code=…&state=…` (D-120). `expo-web-browser`
 * hands it to the login, but Android also delivers it to Expo Router as a link; this keeps the
 * code out of any route (`src/app/+native-intent.tsx`).
 */
const LOGIN_CALLBACK = /^shop\.\d{1,20}\.app:\/\/callback(?:[/?#]|$)/i;

export function isLoginCallback(url: string): boolean {
  return LOGIN_CALLBACK.test(url);
}

/**
 * Where Expo Router goes for an incoming link. A login callback never becomes a route: when it
 * started the app (Android ended the app while the login page was open, so that login is lost),
 * the Account tab opens (answer 2); otherwise the Account tab is already in front and nothing
 * moves. Any other link is unchanged.
 */
export function redirectForIncomingLink(path: string, initial: boolean): string | null {
  if (!isLoginCallback(path)) return path;
  return initial ? '/account' : null;
}
