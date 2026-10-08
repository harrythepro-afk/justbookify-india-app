/**
 * The one guard every in-app open goes through (P6-06, D-099). On the phone, two fast taps on a
 * book card or on the search button opened the screen twice, so Back led to a second copy
 * (`router.push` adds a screen on every call). A second open within OPEN_GUARD_MS of the last one
 * is ignored, whichever control it comes from; after that, any open works as before, so Back and
 * a tap on another card, or opening another book later, are never blocked. Expo Router 57 has no
 * documented double-tap option (`dangerouslySingular` and a Stack's `getId` change the history
 * instead), so this is the app's own.
 */

import { router, type Href } from 'expo-router';

/** About half a second (owner, P6-06 review). */
export const OPEN_GUARD_MS = 500;

let lastOpenAt: number | null = null;

/**
 * Claims the right to open a screen now: true if no open happened in the last OPEN_GUARD_MS,
 * and the open is then recorded; false if this one must be ignored. A clock that moved back
 * never blocks.
 */
function claimOpen(): boolean {
  const now = Date.now();
  if (lastOpenAt !== null && now >= lastOpenAt && now - lastOpenAt < OPEN_GUARD_MS) return false;
  lastOpenAt = now;
  return true;
}

/**
 * Opens a screen through the guard. `push` adds the screen (a book page, search); `navigate` is
 * what Expo Router's `Link` does. Returns whether the screen was opened.
 */
export function openScreen(href: Href, action: 'push' | 'navigate' = 'push'): boolean {
  if (!claimOpen()) return false;
  if (action === 'push') router.push(href);
  else router.navigate(href);
  return true;
}

/**
 * For an Expo Router `Link`'s `onPress`: the link opens only if the guard allows it. `Link` calls
 * this before it navigates and skips navigating once the event's default is prevented
 * (`BaseExpoRouterLink`, `useLinkToPathProps`, expo-router 57.0.25).
 */
export function guardLinkPress(event: { preventDefault(): void }): void {
  if (!claimOpen()) event.preventDefault();
}

/** For tests: forgets the last open. */
export function resetOpenGuardForTests(): void {
  lastOpenAt = null;
}
