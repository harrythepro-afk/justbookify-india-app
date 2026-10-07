import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

/** A series on Home's "Popular series" row: text only, no image (owner, P6-03). */
export function SeriesTile({ label, href }: { readonly label: string; readonly href: Href }) {
  return (
    <Link asChild href={href}>
      <Pressable accessibilityRole="link" style={styles.tile}>
        <Text numberOfLines={2} style={styles.tileText}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

/** An age group on Home's "Browse by age" row. */
export function AgeChip({ label, href }: { readonly label: string; readonly href: Href }) {
  return (
    <Link asChild href={href}>
      <Pressable accessibilityRole="link" style={styles.chip}>
        <Text style={styles.chipText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const TILE_WIDTH = 128;

const styles = StyleSheet.create({
  tile: {
    width: TILE_WIDTH,
    minHeight: TILE_WIDTH / 2,
    padding: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.tileBorder,
    backgroundColor: colors.tile,
  },
  tileText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onTile,
    textAlign: 'center',
  },
  chip: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: minTouchTarget / 2,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.background,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: fontSize.small, color: colors.link },
});
