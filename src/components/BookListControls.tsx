import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sortOptionsFor, type BookSort } from '@/config';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

export const AVAILABLE_NOW_LABEL = 'Available now';

export type ListOption<T extends string> = { readonly value: T; readonly label: string };

/**
 * A button that opens a list of options over the screen (P6-04): Sort on Browse and the
 * collection screen, Age group and Series on Browse. Choosing an option closes the list.
 * Android's back button and a tap outside the list close it too, without leaving the screen or
 * changing the choice (owner, plan review). React Native's own `Modal`: no new package.
 */
export function ListPicker<T extends string>({
  buttonLabel,
  accessibilityLabel,
  title,
  options,
  selected,
  onSelect,
  testID,
}: {
  /** What the button says, such as "Sort: Featured". */
  readonly buttonLabel: string;
  readonly accessibilityLabel: string;
  /** The list's heading. */
  readonly title: string;
  readonly options: readonly ListOption<T>[];
  /** The chosen option, marked in the list; null when none is chosen. */
  readonly selected: T | null;
  readonly onSelect: (value: T) => void;
  readonly testID: string;
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={styles.button}
        testID={testID}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
      <Modal
        animationType="fade"
        // Edge to edge on Android: the list draws behind the system bars and pads itself.
        navigationBarTranslucent
        onRequestClose={close}
        statusBarTranslucent
        testID={`${testID}-list`}
        transparent
        visible={open}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={close}
            style={StyleSheet.absoluteFill}
            testID={`${testID}-outside`}
          >
            <View style={styles.scrim} />
          </Pressable>
          {/* The Modal keeps a screen reader inside it, so "Close" above stays reachable. */}
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>
              {title}
            </Text>
            <ScrollView>
              {options.map((option) => {
                const chosen = option.value === selected;
                return (
                  <Pressable
                    // The mark is visual; the screen reader hears "selected" from the state.
                    accessibilityLabel={option.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: chosen }}
                    key={option.value}
                    onPress={() => {
                      close();
                      onSelect(option.value);
                    }}
                    style={styles.option}
                  >
                    <Text style={chosen ? styles.optionChosen : styles.optionText}>
                      {option.label}
                    </Text>
                    {chosen && <Text style={styles.optionChosen}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/**
 * Browse's and the collection screen's sorts as list options (D-085). "Featured", a collection's
 * own order, is offered only inside a group.
 */
export function bookSortOptions(inGroup: boolean): readonly ListOption<BookSort>[] {
  return sortOptionsFor(inGroup).map((option) => ({ value: option.sort, label: option.label }));
}

/**
 * "Available now" and the sort (D-085, D-086), above a list of books. The screen passes the sorts
 * it offers: Browse and the collection screen theirs (`bookSortOptions`), search its own (P6-06).
 */
export function BookListControls<S extends string>({
  available,
  onAvailableChange,
  sort,
  sortOptions,
  onSort,
}: {
  readonly available: boolean;
  readonly onAvailableChange: (available: boolean) => void;
  readonly sort: S;
  readonly sortOptions: readonly ListOption<S>[];
  readonly onSort: (sort: S) => void;
}) {
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? '';
  return (
    <View style={styles.row}>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{AVAILABLE_NOW_LABEL}</Text>
        <Switch
          accessibilityLabel={AVAILABLE_NOW_LABEL}
          accessibilityRole="switch"
          accessibilityState={{ checked: available }}
          onValueChange={onAvailableChange}
          testID="available-now"
          thumbColor={colors.switchThumb}
          trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
          value={available}
        />
      </View>
      <ListPicker
        accessibilityLabel={`Sort, ${sortLabel}`}
        buttonLabel={`Sort: ${sortLabel}`}
        onSelect={onSort}
        options={sortOptions}
        selected={sort}
        testID="sort"
        title="Sort"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  // The row's height keeps the switch's touch target at the minimum.
  switchRow: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  switchLabel: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
  button: {
    minHeight: minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radius.md,
  },
  buttonText: { fontFamily: fonts.body, fontSize: fontSize.small, color: colors.link },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '70%',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    backgroundColor: colors.sheet,
  },
  sheetTitle: {
    marginBottom: spacing.sm,
    fontFamily: fonts.heading,
    fontSize: fontSize.title,
    color: colors.text,
  },
  option: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
  optionChosen: { fontFamily: fonts.bodyBold, fontSize: fontSize.body, color: colors.text },
});
