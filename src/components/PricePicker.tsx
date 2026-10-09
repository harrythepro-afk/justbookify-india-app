import type { PriceOption } from '@/shopify/hooks/catalogue';

import { ListPicker, type ListOption } from './BookListControls';

export const PRICE_BUTTON_NAME = 'Price';
export const ALL_PRICES_LABEL = 'All prices';
// Never a maximum, which is always a number.
const ALL_PRICES = 'all-prices';

/**
 * The Price button and its list (P6-08, D-104): "All prices" first, then each maximum, lowest
 * first ("Up to ₹34"), one at a time. The button says "Price: Up to ₹49" when one is chosen, and
 * the screen reader hears "Price, up to ₹49". The list needs no read, so the button is never
 * disabled. Draws nothing when the options cannot be built (no store configuration).
 */
export function PricePicker({
  options,
  chosen,
  onChoose,
}: {
  readonly options: readonly PriceOption[] | null;
  readonly chosen: PriceOption | null;
  readonly onChoose: (price: PriceOption | null) => void;
}) {
  if (options === null) return null;

  const listOptions: ListOption<string>[] = [
    { value: ALL_PRICES, label: ALL_PRICES_LABEL },
    ...options.map((option) => ({ value: String(option.max), label: option.label })),
  ];

  return (
    <ListPicker
      accessibilityLabel={
        chosen === null ? PRICE_BUTTON_NAME : `${PRICE_BUTTON_NAME}, ${chosen.phrase}`
      }
      buttonLabel={chosen === null ? PRICE_BUTTON_NAME : `${PRICE_BUTTON_NAME}: ${chosen.label}`}
      onSelect={(value) => {
        if (value === ALL_PRICES) {
          onChoose(null);
          return;
        }
        const option = options.find((candidate) => String(candidate.max) === value);
        if (option !== undefined) onChoose(option);
      }}
      options={listOptions}
      selected={chosen === null ? ALL_PRICES : String(chosen.max)}
      testID="price"
      title={PRICE_BUTTON_NAME}
    />
  );
}
