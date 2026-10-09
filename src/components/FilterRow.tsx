import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

/**
 * One row of filter buttons (P6-08, D-105; architect's review of PR #20): the buttons scroll
 * sideways and never wrap, so a long chosen label ("Genre: Comics & graphic novels") never pushes
 * "Available now" and the sort down. "Clear", when the screen offers it, is pinned at the right
 * edge outside the scrolling part, so it is always visible while anything is chosen (owner, P6-08
 * plan review). The scrolling part takes the remaining width and its buttons stay left-aligned,
 * so none of them moves sideways when "Clear" appears or disappears.
 */
export function FilterRow({
  children,
  onClear,
}: {
  readonly children: ReactNode;
  /** Shows "Clear" when set; null when nothing is chosen or the screen has no "Clear". */
  readonly onClear: (() => void) | null;
}) {
  return (
    <View style={styles.row} testID="filter-row">
      <ScrollView
        contentContainerStyle={styles.buttons}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        testID="filter-scroll"
      >
        {children}
      </ScrollView>
      {onClear !== null && (
        <Pressable
          accessibilityLabel="Clear filters, show all books"
          accessibilityRole="button"
          onPress={onClear}
          style={styles.clear}
          testID="clear-filters"
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  // Takes the width "Clear" leaves; the buttons inside start at the left edge.
  scroll: { flexGrow: 1, flexShrink: 1 },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  clear: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    marginRight: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  clearText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.small,
    color: colors.onPrimaryButton,
  },
});
