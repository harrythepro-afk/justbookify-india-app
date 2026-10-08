import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

import type { CatalogueViewState } from './catalogueViewState';

// Our own plain wording (owner, P6-03, D-078). Shopify's messages are never shown.
export const OFFLINE_MESSAGE = "You're offline. Check your connection and try again.";
export const ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const OFFLINE_NOTICE = "You're offline. Showing saved books.";
export const EMPTY_MESSAGE = 'No books here yet.';
// With "Available now" on, an empty list may only mean every book is rented out (owner, P6-04).
export const AVAILABLE_EMPTY_MESSAGE =
  'No books available right now. Switch off Available now to see rented-out books.';
// Proposed by Claude Code, confirmed by the owner at P6-03's plan review.
export const NOT_FOUND_MESSAGE = 'This collection is not available.';
// The owner's wording (answer 5, P6-05; D-093).
export const BOOK_NOT_FOUND_MESSAGE = 'This book is not available.';

/**
 * What an empty list says, by whether "Available now" is on (owner, P6-04) and, with a genre
 * chosen, naming the genre by the store's name (owner, P6-07 plan review; D-101).
 */
export function emptyMessageFor(available: boolean, genreName?: string): string {
  if (genreName !== undefined) {
    return available
      ? `No ${genreName} books available right now. Switch off Available now to see rented-out books, or choose another genre.`
      : `No ${genreName} books here. Choose another genre.`;
  }
  return available ? AVAILABLE_EMPTY_MESSAGE : EMPTY_MESSAGE;
}

/** A message in place of content, with an optional "Try again" button. */
export function ScreenMessage({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry?: () => void;
}) {
  return (
    <View style={styles.message}>
      <Text accessibilityLiveRegion="polite" style={styles.messageText}>
        {message}
      </Text>
      {onRetry !== undefined && (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

/** What a screen or section shows while it has no data: loading, offline or error. */
export function NoDataState({
  state,
  onRetry,
}: {
  readonly state: Exclude<CatalogueViewState, 'ready'>;
  readonly onRetry: () => void;
}) {
  if (state === 'loading') {
    return (
      <View style={styles.message}>
        <ActivityIndicator accessibilityLabel="Loading" color={colors.text} />
      </View>
    );
  }
  return (
    <ScreenMessage
      message={state === 'offline' ? OFFLINE_MESSAGE : ERROR_MESSAGE}
      onRetry={onRetry}
    />
  );
}

/** The thin notice above saved books while the phone is offline. */
export function OfflineNotice() {
  return (
    <View accessibilityLiveRegion="polite" style={styles.notice} testID="offline-notice">
      <Text style={styles.noticeText}>{OFFLINE_NOTICE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  messageText: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.text,
    textAlign: 'center',
  },
  retry: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  retryText: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.onPrimaryButton },
  notice: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.notice,
  },
  noticeText: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.onNotice },
});
