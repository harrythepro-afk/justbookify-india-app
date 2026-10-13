import { deliveryEstimate, type DeliveryConfig } from '@/shopify/deliveryFee';

// The India store's values (D-031, D-134): prepaid ₹75, cash on delivery ₹125, ₹75 off either from
// ₹200, a ₹500 cap.
const INDIA: DeliveryConfig = {
  shippingFeePrepaid: 75,
  shippingFeeCod: 125,
  freeDeliveryThreshold: 200,
  shippingDiscount: 75,
  orderCap: 500,
};

describe('deliveryEstimate (R4, D-141)', () => {
  it.each([
    [0, 75, 125, 200],
    [150, 75, 125, 50],
    [199, 75, 125, 1],
    [199.99, 75, 125, 0.01],
  ])(
    'under ₹200 (%p): prepaid ₹%p, cash on delivery ₹%p, ₹%p more for free delivery',
    (counted, prepaid, cod, shortfall) => {
      expect(deliveryEstimate(counted, INDIA)).toEqual({
        fromThreshold: false,
        prepaid,
        cod,
        codFromThreshold: 50,
        freeDeliveryShortfall: shortfall,
      });
    },
  );

  it.each([200, 200.01, 350, 499])(
    'from ₹200 (%p): prepaid free, cash on delivery ₹50, no hint',
    (counted) => {
      expect(deliveryEstimate(counted, INDIA)).toEqual({
        fromThreshold: true,
        prepaid: 0,
        cod: 50,
        codFromThreshold: 50,
        freeDeliveryShortfall: undefined,
      });
    },
  );

  it('decides the boundary in hundredths, so a sum such as 0.1 + 0.2 never moves it', () => {
    // 199.9 + 0.1 is 199.99999999999997 in floating point.
    expect(deliveryEstimate(199.9 + 0.1, INDIA).fromThreshold).toBe(true);
    expect(deliveryEstimate(150.1 + 0.2, INDIA).freeDeliveryShortfall).toBe(49.7);
  });

  it('never shows a negative rate when the discount is larger than the fee', () => {
    const estimate = deliveryEstimate(250, { ...INDIA, shippingDiscount: 150 });

    expect(estimate.prepaid).toBe(0);
    expect(estimate.cod).toBe(0);
  });

  it('shows no free-delivery hint when the discount does not make prepaid delivery free', () => {
    const estimate = deliveryEstimate(100, { ...INDIA, shippingDiscount: 50 });

    expect(estimate.freeDeliveryShortfall).toBeUndefined();
    expect(estimate.prepaid).toBe(75);
  });

  describe('never suggests more than the order cap allows (R2)', () => {
    it('hides the hint when the threshold equals the cap', () => {
      const config = { ...INDIA, freeDeliveryThreshold: 500 };

      expect(deliveryEstimate(300, config).freeDeliveryShortfall).toBeUndefined();
      expect(deliveryEstimate(450, config).freeDeliveryShortfall).toBeUndefined();
      expect(deliveryEstimate(450, config).prepaid).toBe(75);
    });

    it('hides it when the threshold is over the cap', () => {
      expect(
        deliveryEstimate(450, { ...INDIA, freeDeliveryThreshold: 600 }).freeDeliveryShortfall,
      ).toBeUndefined();
    });

    it('shows it when the threshold is just under the cap', () => {
      expect(
        deliveryEstimate(450, { ...INDIA, freeDeliveryThreshold: 499 }).freeDeliveryShortfall,
      ).toBe(49);
    });
  });
});
