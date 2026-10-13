/**
 * The delivery fee hint (R4, P8-02, D-141). The store charges a flat rate for prepaid delivery and
 * a higher one for cash on delivery; an automatic shipping discount takes a fixed amount off either
 * rate once the cart reaches a threshold (the SMART Checkout Rules shipping discount; D-031). With
 * the India store's values: prepaid ₹75, free from ₹200; cash on delivery ₹125, ₹50 from ₹200.
 * Every value is store configuration (`src/config/`), and every figure is a hint: checkout sets
 * the final amount.
 *
 * Counted on the subtotal the app counts (D-134), so a rented-out book never changes the hint.
 * Amounts are compared in hundredths, as the order cap's are.
 */

import type { StoreConfig } from '@/config';

import { fitsUnderCap } from './orderCap';

export type DeliveryConfig = Pick<
  StoreConfig,
  | 'shippingFeePrepaid'
  | 'shippingFeeCod'
  | 'freeDeliveryThreshold'
  | 'shippingDiscount'
  | 'orderCap'
>;

export type DeliveryEstimate = {
  /** Whether the counted subtotal has reached the discount's threshold. */
  readonly fromThreshold: boolean;
  /** Prepaid delivery for this cart; 0 means free. */
  readonly prepaid: number;
  /** Cash on delivery for this cart. */
  readonly cod: number;
  /** Cash on delivery once the threshold is reached, for the line under it. */
  readonly codFromThreshold: number;
  /**
   * How much more makes prepaid delivery free, or `undefined` when the hint is not shown: the cart
   * has reached the threshold, the discount does not make delivery free, or the books it suggests
   * would not fit under the order cap (R2).
   */
  readonly freeDeliveryShortfall: number | undefined;
};

function hundredths(amount: number): number {
  return Math.round(amount * 100);
}

/** A rate after the discount, never below zero. */
function discounted(fee: number, discount: number): number {
  return Math.max(0, hundredths(fee) - hundredths(discount)) / 100;
}

export function deliveryEstimate(counted: number, config: DeliveryConfig): DeliveryEstimate {
  const fromThreshold = hundredths(counted) >= hundredths(config.freeDeliveryThreshold);
  const prepaidFromThreshold = discounted(config.shippingFeePrepaid, config.shippingDiscount);
  const codFromThreshold = discounted(config.shippingFeeCod, config.shippingDiscount);

  let freeDeliveryShortfall: number | undefined;
  if (!fromThreshold && prepaidFromThreshold === 0) {
    const shortfall = (hundredths(config.freeDeliveryThreshold) - hundredths(counted)) / 100;
    if (fitsUnderCap(counted, shortfall, config.orderCap)) freeDeliveryShortfall = shortfall;
  }

  return {
    fromThreshold,
    prepaid: fromThreshold ? prepaidFromThreshold : config.shippingFeePrepaid,
    cod: fromThreshold ? codFromThreshold : config.shippingFeeCod,
    codFromThreshold,
    freeDeliveryShortfall,
  };
}
