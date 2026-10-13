import {
  getAnalyticsConsentState,
  grantAnalyticsConsent,
  isAnalyticsConsentGranted,
  loadAnalyticsConsent,
  withdrawAnalyticsConsent,
} from './consent';
import { trackLogin } from './events';

/**
 * The analytics side of a login that has just succeeded (P7-03, D-129, D-130). The Account tab
 * calls these; nothing here knows about tokens or the customer.
 */

/**
 * After a successful login: `ask` while the choice is `not asked`, and the consent request is
 * shown; otherwise `login` is sent, which happens only under consent.
 */
export async function analyticsAfterLogin(): Promise<'ask' | 'done'> {
  await loadAnalyticsConsent();
  if (getAnalyticsConsentState().consent === 'not asked') return 'ask';
  trackLogin();
  return 'done';
}

/**
 * "Allow" on the request: the choice is saved and collection switched on, then the login that
 * showed the request is sent, once. False when the choice could not be saved (nothing is sent).
 */
export async function allowAfterLogin(): Promise<boolean> {
  await grantAnalyticsConsent();
  if (!isAnalyticsConsentGranted()) return false;
  trackLogin();
  return true;
}

/**
 * "Don't allow" on the request: the same as turning the Account switch off (D-048). Nothing is
 * sent. False only when the choice could neither be saved nor deleted.
 */
export async function denyAfterLogin(): Promise<boolean> {
  await withdrawAnalyticsConsent();
  return !getAnalyticsConsentState().saveFailed;
}
