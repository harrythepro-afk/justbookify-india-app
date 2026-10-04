import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  grantAnalyticsConsent,
  useAnalyticsConsent,
  withdrawAnalyticsConsent,
} from '@/analytics/consent';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

// DRAFT wording (D-048), to be reviewed by the owner's adviser with the privacy policy's app
// section (risk 21). Phase 7 adds that usage is linked to the customer's account (D-050).
export const ANALYTICS_SWITCH_LABEL = 'Share app usage';
export const ANALYTICS_SWITCH_DESCRIPTION =
  'Helps us improve the app. We record which screens you open, what you do in the app and the ' +
  'link you installed it from. We never record your name, email, phone number or address, and ' +
  "the app never asks for or records a child's name or date of birth. Turning this off stops " +
  'it at once and clears the usage data on this phone.';

/** The customer's analytics consent (D-048). Off unless the customer has turned it on. */
export function AnalyticsConsentSwitch() {
  const { consent, busy, saveFailed } = useAnalyticsConsent();
  const on = consent === 'granted';
  const disabled = consent === 'loading' || busy;

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        <Text style={styles.label}>{ANALYTICS_SWITCH_LABEL}</Text>
        <Switch
          accessibilityLabel={ANALYTICS_SWITCH_LABEL}
          accessibilityRole="switch"
          accessibilityState={{ checked: on, disabled }}
          disabled={disabled}
          onValueChange={(next) => {
            void (next ? grantAnalyticsConsent() : withdrawAnalyticsConsent());
          }}
          thumbColor={colors.switchThumb}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          value={on}
        />
      </View>
      <Text style={styles.description}>{ANALYTICS_SWITCH_DESCRIPTION}</Text>
      {saveFailed && (
        <Text accessibilityLiveRegion="polite" style={styles.description}>
          Your choice could not be saved. Please try again.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  // The row's height keeps the switch's touch target at the 44-point minimum.
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  description: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
});
