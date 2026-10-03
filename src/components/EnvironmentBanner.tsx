import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAppEnvironment, getEnvironmentLabel, getStoreConfigStatus } from '@/config';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

/**
 * On development and staging builds, shows a banner above `children` that names the
 * environment and whether the store is configured. On production it renders `children` alone.
 * The banner takes the top safe-area inset, so the screens below it get a top inset of zero.
 */
export function EnvironmentBanner({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const environment = getAppEnvironment();

  if (environment === 'production') return <>{children}</>;

  return (
    <View style={styles.frame}>
      <View
        accessibilityRole="summary"
        style={[styles.banner, { paddingTop: insets.top + spacing.xs }]}
        testID="environment-banner"
      >
        <Text style={styles.label}>{getEnvironmentLabel(environment)} build</Text>
        {/* Status only. The store's values never appear on screen. */}
        <Text style={styles.status}>Store configuration: {getStoreConfigStatus()}</Text>
      </View>
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0 }}>
        <View style={styles.frame}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.banner,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.small, color: colors.onBanner },
  status: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.onBanner },
});
