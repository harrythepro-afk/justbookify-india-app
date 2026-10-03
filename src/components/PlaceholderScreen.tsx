import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

/** A tab's screen until its feature is built: a heading and one line on what will appear. */
export function PlaceholderScreen({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      style={styles.screen}
    >
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
});
