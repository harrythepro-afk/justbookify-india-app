import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAnalyticsConsent } from '@/analytics/consent';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { FEATURE_FLAG_NAMES, getAppEnvironment, type FeatureFlagSource } from '@/config';
import { isCrashReportingOn, sendTestError, triggerTestNativeCrash } from '@/crashReporting/sentry';
import { useFeatureFlags } from '@/featureFlags/session';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      message="Popular series, age groups and new arrivals will appear here."
      title="Home"
    >
      {getAppEnvironment() === 'development' && (
        <>
          <Link href="/dev-checkout" style={styles.link}>
            Open the test checkout screen
          </Link>
          <CrashReportingTestControls />
          <FeatureFlagStatus />
          <AnalyticsStatus />
        </>
      )}
    </PlaceholderScreen>
  );
}

const SOURCE_LABELS: Record<FeatureFlagSource, string> = {
  remote: 'Remote Config',
  default: 'in-app default',
};

/** Development builds only: each flag's value for this session, and where it came from. */
function FeatureFlagStatus() {
  const flags = useFeatureFlags();

  if (flags.status === 'not ready') {
    return <Text style={styles.flags}>Feature flags: not ready</Text>;
  }

  const { snapshot, fetch } = flags;
  return (
    <>
      {FEATURE_FLAG_NAMES.map((name) => (
        <Text key={name} style={styles.flags}>
          {name}: {snapshot.values[name]} ({SOURCE_LABELS[snapshot.sources[name]]})
        </Text>
      ))}
      <Text style={styles.note}>
        Remote Config fetch for the next launch: {fetch ?? 'not started'}
      </Text>
    </>
  );
}

/** Development builds only: whether analytics collection is on, and the stored consent. */
function AnalyticsStatus() {
  const { consent } = useAnalyticsConsent();
  if (consent === 'loading') return <Text style={styles.note}>Analytics: consent loading</Text>;
  return (
    <Text style={styles.note}>
      Analytics: {consent === 'granted' ? 'on' : 'off'} (consent: {consent})
    </Text>
  );
}

/** Development builds only: lets the owner see a test error and a native crash reach Sentry. */
function CrashReportingTestControls() {
  const [sent, setSent] = useState(false);

  if (!isCrashReportingOn()) {
    return <Text style={styles.note}>Crash reporting is off (no DSN).</Text>;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          sendTestError();
          setSent(true);
        }}
        style={styles.control}
      >
        <Text style={styles.controlText}>Send a test error to Sentry</Text>
      </Pressable>
      {sent && (
        <Text accessibilityLiveRegion="polite" style={styles.note}>
          Test error sent. Check Sentry.
        </Text>
      )}
      <Pressable accessibilityRole="button" onPress={triggerTestNativeCrash} style={styles.control}>
        <Text style={styles.controlText}>Trigger a native crash (test)</Text>
      </Pressable>
      <Text style={styles.note}>The app will close; reopen it to send the report.</Text>
    </>
  );
}

const linkText = {
  fontFamily: fonts.body,
  fontSize: fontSize.body,
  color: colors.link,
  textDecorationLine: 'underline',
} as const;

const styles = StyleSheet.create({
  link: { ...linkText, marginTop: spacing.xl },
  // Vertical padding brings the touch target to the 44-point minimum.
  control: { marginTop: spacing.sm, paddingVertical: spacing.md, alignSelf: 'flex-start' },
  controlText: linkText,
  note: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
  flags: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
});
