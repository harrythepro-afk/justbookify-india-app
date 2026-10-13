import { Pressable, StyleSheet, Text } from 'react-native';

import { ERROR_MESSAGE } from '@/components/ScreenMessage';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

/**
 * "Load more" while there is a next page (P6-03, D-080). After a failed page it stays, as the
 * retry, with the general error above it. Shared by the book lists and the orders list (P7-02).
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  failed,
  onPress,
}: {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly failed: boolean;
  readonly onPress: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <>
      {failed && !isFetchingNextPage && (
        <Text accessibilityLiveRegion="polite" style={styles.footerMessage}>
          {ERROR_MESSAGE}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isFetchingNextPage }}
        disabled={isFetchingNextPage}
        onPress={onPress}
        style={[styles.loadMore, isFetchingNextPage && styles.disabled]}
      >
        <Text style={styles.loadMoreText}>{isFetchingNextPage ? 'Loading…' : 'Load more'}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  footerMessage: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  loadMore: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
    marginHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  disabled: { opacity: 0.5 },
  loadMoreText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
});
