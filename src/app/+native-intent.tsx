import { redirectForIncomingLink } from '@/customerAccount/callbackUrl';

/** Expo Router's hook for incoming links: the login callback never reaches a route (D-120). */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string | null {
  try {
    return redirectForIncomingLink(path, initial);
  } catch {
    // Expo Router's advice: a throw here can end the app. Fall back to Home.
    return initial ? '/' : null;
  }
}
