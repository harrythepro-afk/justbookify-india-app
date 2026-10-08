import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { openScreen } from '@/navigation/openGuard';
import { colors, iconSize, minTouchTarget } from '@/theme/tokens';

/** Opens the search screen (P6-06), through the shared guard (D-099). */
export function openSearch(): void {
  openScreen('/search');
}

/**
 * The search button in Home's header and beside Browse's title (P6-06): an icon with the
 * accessible name "Search" and at least the minimum touch target.
 */
export function SearchButton({ testID }: { readonly testID?: string }) {
  return (
    <Pressable
      accessibilityLabel="Search"
      accessibilityRole="button"
      onPress={openSearch}
      style={styles.button}
      testID={testID}
    >
      <Ionicons color={colors.text} name="search-outline" size={iconSize.search} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
