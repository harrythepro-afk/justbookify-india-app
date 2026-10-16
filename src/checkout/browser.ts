/**
 * Checkout in the system browser (P9-01, D-152): the fallback of `checkout_presentation` (D-033),
 * for a failure of the in-app sheet at the launch rehearsal (risk 2). The only file outside
 * `src/customerAccount/` that may import `expo-web-browser` (ESLint).
 *
 * - `createTask: false` opens the browser (a Custom Tab on Android) in the app's own task, so the
 *   customer cannot go back to the app from recent apps while checkout is open, and returns to the
 *   app with Back or the tab's close button.
 * - On Android `openBrowserAsync` resolves as soon as the browser opens, and the browser sends the
 *   app no event when an order is placed, so the return is the app coming back to the foreground
 *   after leaving it; the caller then reads the cart again (a placed order's cart is gone, D-136).
 */

import { openBrowserAsync } from 'expo-web-browser';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Opens the checkout URL in the browser. Resolves with `opened` once it is showing; `onReturn` is
 * called once, when the app is back in the foreground after it. Rejects if it cannot be opened.
 */
export async function openCheckoutInBrowser(
  checkoutUrl: string,
  onReturn: () => void,
): Promise<'opened'> {
  let left = false;
  let returned = false;
  let previous: AppStateStatus = AppState.currentState;
  const back = () => {
    if (returned) return;
    returned = true;
    subscription.remove();
    try {
      onReturn();
    } catch {
      // The caller handles its own failures.
    }
  };
  const subscription = AppState.addEventListener('change', (next) => {
    if (next !== 'active') left = true;
    else if (left && previous !== 'active') back();
    previous = next;
  });
  let result: Awaited<ReturnType<typeof openBrowserAsync>>;
  try {
    result = await openBrowserAsync(checkoutUrl, { createTask: false, showTitle: true });
  } catch (error) {
    subscription.remove();
    throw error;
  }
  // iPhone (a later task): the browser resolves only when it is closed, without leaving the app.
  if (result.type === 'cancel' || result.type === 'dismiss') back();
  return 'opened';
}
