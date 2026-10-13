/**
 * The Cart tab's delivery hints and pincode check (P8-02, D-063: screens reach `src/shopify/` through
 * this folder only). Both read the store configuration and nothing else: no Storefront request, so
 * they work offline. Every figure is a hint; checkout sets the final amount.
 */

import { getStoreConfig } from '@/config';

import { deliveryEstimate, type DeliveryEstimate } from '../deliveryFee';
import { submitPincode, type PincodeResult } from '../pincode';

export type { DeliveryEstimate } from '../deliveryFee';
export {
  editPincode,
  forgetPincode,
  usePincode,
  type PincodeResult,
  type PincodeState,
} from '../pincode';

/** The delivery fee hint (R4, D-141) for the subtotal the app counts (D-134). */
export function cartDeliveryEstimate(counted: number): DeliveryEstimate {
  return deliveryEstimate(counted, getStoreConfig());
}

/** The subtotal from which the shipping discount applies, in the store's currency. */
export function freeDeliveryThresholdAmount(): number {
  return getStoreConfig().freeDeliveryThreshold;
}

/**
 * Checks the field's pincode against the configured ranges (R3, D-142). The result when it is new,
 * `undefined` when the same unchanged pincode was already checked.
 */
export function checkCartPincode(): PincodeResult | undefined {
  return submitPincode(getStoreConfig().deliveryPincodeRanges);
}
