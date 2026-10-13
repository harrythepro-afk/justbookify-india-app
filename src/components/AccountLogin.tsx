import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { trackLogout } from '@/analytics/events';
import { analyticsAfterLogin } from '@/analytics/loginConsent';
import { getAppEnvironment } from '@/config';
import {
  getCustomerSessionState,
  login,
  logout,
  useCustomerSession,
  type CustomerSessionState,
} from '@/customerAccount/session';

import { AnalyticsConsentRequest } from './AnalyticsConsentRequest';
import {
  colors,
  disabledOpacity,
  fonts,
  fontSize,
  minTouchTarget,
  radius,
  spacing,
} from '@/theme/tokens';

// Wording approved by the owner at the P7-01 plan review (D-123). The logged-out line is the
// architect's (answer 3).
export const LOG_IN_LABEL = 'Log in';
export const LOGGING_IN_LABEL = 'Logging in…';
export const LOG_OUT_LABEL = 'Log out';
export const LOGGED_IN_AS = 'Logged in as';
export const LOGGED_IN = 'Logged in';
export const LOGGED_OUT_NOTICE = "You've been logged out. Please log in again.";
export const LOGIN_FAILED_NOTICE = "Login didn't finish. Please try again.";
export const LOGIN_NOT_SET_UP = 'Login is not set up on this build.';

/**
 * The Account tab's login section (P7-01, D-123): "Log in" when signed out, the customer's email
 * and "Log out" when signed in. The email comes from the ID token and is shown only here.
 *
 * P7-03 (D-129, D-130): right after a login that succeeded here, while the analytics choice is
 * `not asked`, the consent request opens, once for that login; otherwise `login` is sent under
 * consent. "Log out" sends `logout` under consent before the session ends. No other pop-up.
 */
export function AccountLogin() {
  const session = useCustomerSession();
  const [asking, setAsking] = useState(false);

  const logIn = async () => {
    if ((await login()) !== 'signedIn') return;
    if ((await analyticsAfterLogin()) === 'ask') setAsking(true);
  };

  const logOut = () => {
    if (getCustomerSessionState().status !== 'signedIn') return;
    trackLogout();
    void logout();
  };

  return (
    <>
      <LoginSection onLogIn={() => void logIn()} onLogOut={logOut} session={session} />
      <AnalyticsConsentRequest onDone={() => setAsking(false)} visible={asking} />
    </>
  );
}

type LoginSectionProps = {
  readonly session: CustomerSessionState;
  readonly onLogIn: () => void;
  readonly onLogOut: () => void;
};

function LoginSection({ session, onLogIn, onLogOut }: LoginSectionProps) {
  switch (session.status) {
    case 'loading':
      return (
        <View style={styles.section}>
          <ActivityIndicator accessibilityLabel="Loading" color={colors.text} />
        </View>
      );
    case 'notConfigured':
      // A production build cannot be made without the shop ID (app.config.ts), so this shows on
      // development and staging builds only.
      return getAppEnvironment() === 'production' ? null : (
        <View style={styles.section}>
          <Text style={styles.text}>{LOGIN_NOT_SET_UP}</Text>
        </View>
      );
    case 'signedIn':
      return (
        <View style={styles.section}>
          {session.email === undefined ? (
            <Text style={styles.label}>{LOGGED_IN}</Text>
          ) : (
            <>
              <Text style={styles.text}>{LOGGED_IN_AS}</Text>
              <Text style={styles.label}>{session.email}</Text>
            </>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onLogOut}
            style={[styles.button, styles.secondaryButton]}
          >
            <Text style={styles.secondaryButtonText}>{LOG_OUT_LABEL}</Text>
          </Pressable>
        </View>
      );
    case 'signedOut': {
      const notice =
        session.notice === 'refused'
          ? LOGGED_OUT_NOTICE
          : session.notice === 'loginFailed'
            ? LOGIN_FAILED_NOTICE
            : undefined;
      return (
        <View style={styles.section}>
          {notice !== undefined && (
            <Text accessibilityLiveRegion="polite" style={styles.notice}>
              {notice}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: session.loggingIn }}
            disabled={session.loggingIn}
            onPress={onLogIn}
            style={[styles.button, styles.primaryButton, session.loggingIn && styles.disabled]}
          >
            <Text style={styles.primaryButtonText}>
              {session.loggingIn ? LOGGING_IN_LABEL : LOG_IN_LABEL}
            </Text>
          </Pressable>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  text: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  notice: {
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
  },
  button: {
    minHeight: minTouchTarget,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  primaryButton: { backgroundColor: colors.primaryButton },
  primaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
  secondaryButton: { borderWidth: 1, borderColor: colors.secondaryButtonBorder },
  secondaryButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.secondaryButtonText,
  },
  disabled: { opacity: disabledOpacity },
});
