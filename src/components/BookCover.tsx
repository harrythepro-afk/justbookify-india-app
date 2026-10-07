import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { BookCard as BookCardData } from '@/shopify/hooks/catalogue';
import { colors, coverAspectRatio, radius } from '@/theme/tokens';

/**
 * A book's cover in the square white frame (D-077), shared by the card and the book page
 * (P6-05). Covers fit inside, never cropped. With no cover, the cream frame and a book icon
 * only; the screen reader hears the title (D-073). `children` sit over the cover, such as the
 * card's "Rented Out" badge.
 */
export function BookCover({
  book,
  iconSize,
  testID,
  children,
}: {
  readonly book: Pick<BookCardData, 'id' | 'title' | 'cover'>;
  /** The size of the book icon when there is no cover. */
  readonly iconSize: number;
  /** The cover's test ID; the fallback's is the same with `-fallback`. */
  readonly testID: string;
  readonly children?: ReactNode;
}) {
  return (
    <View style={styles.frame}>
      {book.cover === null ? (
        <View accessibilityLabel={book.title} style={styles.fallback} testID={`${testID}-fallback`}>
          <Ionicons color={colors.text} name="book-outline" size={iconSize} />
        </View>
      ) : (
        <Image
          accessibilityLabel={book.cover.altText ?? book.title}
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={book.id}
          source={{ uri: book.cover.url }}
          style={StyleSheet.absoluteFill}
          testID={testID}
          transition={150}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: coverAspectRatio,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.coverFrame,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coverFallback,
  },
});
