/**
 * The Price filter's options (P6-08, D-104): one per configured maximum, lowest first, each
 * labelled from the store's currency format (D-073), so "Up to ₹49" is never typed by hand and a
 * second store (Bahrain) gets its own format from its own configuration. "All prices" is the
 * picker's own first option, not one of these.
 *
 * A pure function: the caller reads the configuration.
 */

import type { StoreConfig } from '@/config';

import { formatPrice, storeLocale } from './bookCard';

/** A price a customer can choose: Shopify's maximum and the words that show it. */
export type PriceOption = {
  /** Sent as `{ price: { max } }`, with no minimum. Inclusive (P6-08 gate b). */
  readonly max: number;
  /** On the list and the button: "Up to ₹49". */
  readonly label: string;
  /** Inside a sentence, for the screen reader and the empty list: "up to ₹49". */
  readonly phrase: string;
};

export function toPriceOptions(
  maxima: readonly number[],
  config: Pick<StoreConfig, 'currencyCode' | 'language' | 'country'>,
): readonly PriceOption[] {
  const locale = storeLocale(config);
  return maxima.map((max) => {
    const price = formatPrice(max, config.currencyCode, locale);
    return { max, label: `Up to ${price}`, phrase: `up to ${price}` };
  });
}
