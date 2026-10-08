import type { GenreListState, GenreOption } from '@/shopify/hooks/catalogue';

import { ListPicker, type ListOption } from './BookListControls';

export const GENRE_BUTTON_NAME = 'Genre';
export const ALL_GENRES_LABEL = 'All genres';
// Never a taxonomy value's ID, which always starts with "gid://".
const ALL_GENRES = 'all-genres';

/**
 * Whether the Genre button is drawn (D-101; owner, P6-07 plan review): while its list loads it is
 * drawn but disabled, so the buttons beside it never move; it is removed only when the list is
 * known to be empty or cannot be read, unless a genre is chosen, which always keeps it.
 */
export function genreButtonShown(state: GenreListState, chosen: GenreOption | null): boolean {
  if (chosen !== null || state.kind === 'loading') return true;
  return state.kind === 'ready' && state.options.length > 0;
}

/**
 * The Genre button and its list (P6-07, D-101): "All genres" first, then the store's names A-Z
 * (D-102), with no counts. A chosen genre stays in the list even when the current list has none
 * of its books, so the button and the list agree. Draws nothing when `genreButtonShown` is false.
 */
export function GenrePicker({
  state,
  chosen,
  onChoose,
}: {
  readonly state: GenreListState;
  readonly chosen: GenreOption | null;
  readonly onChoose: (genre: GenreOption | null) => void;
}) {
  if (!genreButtonShown(state, chosen)) return null;

  const options = state.kind === 'ready' ? [...state.options] : [];
  if (chosen !== null && !options.some((option) => option.filter.value === chosen.filter.value)) {
    // Kept in the store's A-Z order: insert before the first name that sorts after it.
    const at = options.findIndex(
      (option) => option.name.localeCompare(chosen.name, undefined, { sensitivity: 'base' }) > 0,
    );
    options.splice(at === -1 ? options.length : at, 0, chosen);
  }
  const listOptions: ListOption<string>[] = [
    { value: ALL_GENRES, label: ALL_GENRES_LABEL },
    ...options.map((option) => ({ value: option.filter.value, label: option.name })),
  ];

  return (
    <ListPicker
      accessibilityLabel={
        chosen === null ? GENRE_BUTTON_NAME : `${GENRE_BUTTON_NAME}, ${chosen.name}`
      }
      buttonLabel={chosen === null ? GENRE_BUTTON_NAME : `${GENRE_BUTTON_NAME}: ${chosen.name}`}
      disabled={state.kind === 'loading'}
      onSelect={(value) => {
        if (value === ALL_GENRES) {
          onChoose(null);
          return;
        }
        const option = options.find((candidate) => candidate.filter.value === value);
        if (option !== undefined) onChoose(option);
      }}
      options={listOptions}
      selected={chosen?.filter.value ?? ALL_GENRES}
      testID="genre"
      title={GENRE_BUTTON_NAME}
    />
  );
}
