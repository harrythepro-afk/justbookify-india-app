import { fireEvent, render, screen } from '@testing-library/react-native';
import { Modal, ScrollView, Switch } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { bookSortOptions, BookListControls, ListPicker } from '@/components/BookListControls';
import { SEARCH_CONTENT } from '@/config';

import { SAFE_AREA } from '../helpers/screen';

// React Native loads these modules on first access, which takes seconds on a cold Jest cache or
// a busy machine. Touching them here loads them with the file, before any test's time limit (as
// in collection.test.tsx).
void Modal;
void ScrollView;
void Switch;

const OPTIONS = [
  { value: 'early-readers', label: 'Up to 5 years' },
  { value: 'junior-readers', label: '9-10 years' },
] as const;

async function renderPicker(onSelect = jest.fn()) {
  await render(
    <SafeAreaProvider initialMetrics={SAFE_AREA}>
      <ListPicker
        accessibilityLabel="Age group"
        buttonLabel="Age group"
        onSelect={onSelect}
        options={OPTIONS}
        selected="junior-readers"
        testID="age-group"
        title="Age group"
      />
    </SafeAreaProvider>,
  );
  return onSelect;
}

async function openList() {
  await fireEvent.press(screen.getByRole('button', { name: 'Age group' }));
  expect(screen.getByRole('button', { name: 'Up to 5 years' })).toBeOnTheScreen();
}

describe('ListPicker (P6-04)', () => {
  it('opens its list, marks the chosen option, and closes when one is chosen', async () => {
    const onSelect = await renderPicker();

    await openList();
    expect(screen.getByRole('button', { name: '9-10 years' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Up to 5 years' })).not.toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Up to 5 years' }));

    expect(onSelect).toHaveBeenCalledWith('early-readers');
    expect(screen.queryByRole('button', { name: 'Up to 5 years' })).not.toBeOnTheScreen();
  });

  it("closes on Android's back button, without leaving the screen or changing the choice", async () => {
    const onSelect = await renderPicker();
    await openList();

    // Android's back button reaches an open Modal as onRequestClose.
    await fireEvent(screen.getByTestId('age-group-list'), 'requestClose');

    expect(screen.queryByRole('button', { name: 'Up to 5 years' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('closes on a tap outside the list, without changing the choice', async () => {
    const onSelect = await renderPicker();
    await openList();

    await fireEvent.press(screen.getByTestId('age-group-outside'));

    expect(screen.queryByRole('button', { name: 'Up to 5 years' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Age group' })).toBeOnTheScreen();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('BookListControls (P6-04)', () => {
  async function renderControls(inGroup: boolean, onAvailableChange = jest.fn()) {
    await render(
      <SafeAreaProvider initialMetrics={SAFE_AREA}>
        <BookListControls
          available
          onAvailableChange={onAvailableChange}
          onSort={jest.fn()}
          sort="title-ascending"
          sortOptions={bookSortOptions(inGroup)}
        />
      </SafeAreaProvider>,
    );
    return onAvailableChange;
  }

  it('shows "Available now" as a switch and passes on a change', async () => {
    const onAvailableChange = await renderControls(false);

    const toggle = screen.getByRole('switch', { name: 'Available now' });
    expect(toggle.props.value).toBe(true);

    await fireEvent(toggle, 'valueChange', false);

    expect(onAvailableChange).toHaveBeenCalledWith(false);
  });

  it('offers Featured only inside a group', async () => {
    await renderControls(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' }));

    expect(screen.queryByRole('button', { name: 'Featured' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Best selling' })).toBeOnTheScreen();
  });

  it('offers Featured first inside a group', async () => {
    await renderControls(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Sort, Alphabetically, A-Z' }));

    expect(screen.getByRole('button', { name: 'Featured' })).toBeOnTheScreen();
    expect(bookSortOptions(true)[0]).toEqual({ value: 'featured', label: 'Featured' });
  });

  it('offers only the sorts a screen passes, such as search’s three (P6-06)', async () => {
    const onSort = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={SAFE_AREA}>
        <BookListControls
          available={false}
          onAvailableChange={jest.fn()}
          onSort={onSort}
          sort="relevance"
          sortOptions={SEARCH_CONTENT.sortOptions.map((option) => ({
            value: option.sort,
            label: option.label,
          }))}
        />
      </SafeAreaProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Sort, Relevance' }));

    for (const name of ['Relevance', 'Price, low to high', 'Price, high to low']) {
      expect(screen.getByRole('button', { name })).toBeOnTheScreen();
    }
    expect(screen.queryByRole('button', { name: 'Featured' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Best selling' })).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Price, high to low' }));
    expect(onSort).toHaveBeenCalledWith('price-descending');
  });
});
