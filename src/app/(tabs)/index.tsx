import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { getAppEnvironment } from '@/config';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <PlaceholderScreen
      message="Popular series, age groups and new arrivals will appear here."
      title="Home"
    >
      {getAppEnvironment() === 'development' && (
        <Link href="/dev-checkout" style={styles.link}>
          Open the test checkout screen
        </Link>
      )}
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.link,
    textDecorationLine: 'underline',
  },
});
