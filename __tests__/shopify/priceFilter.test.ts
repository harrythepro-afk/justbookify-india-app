import { formatPrice } from '@/shopify/bookCard';
import { toPriceOptions } from '@/shopify/priceFilter';

const INDIA = { currencyCode: 'INR', language: 'EN', country: 'IN' };

describe('toPriceOptions (P6-08, D-104)', () => {
  it('labels each maximum in the store format, lowest first', () => {
    expect(toPriceOptions([34, 49, 74], INDIA)).toEqual([
      { max: 34, label: 'Up to ₹34', phrase: 'up to ₹34' },
      { max: 49, label: 'Up to ₹49', phrase: 'up to ₹49' },
      { max: 74, label: 'Up to ₹74', phrase: 'up to ₹74' },
    ]);
  });

  it('keeps the configured order and gives nothing for no maxima', () => {
    expect(toPriceOptions([74, 34], INDIA).map((option) => option.max)).toEqual([74, 34]);
    expect(toPriceOptions([], INDIA)).toEqual([]);
  });

  it('formats a part of a rupee and grouping as the book card does (D-073)', () => {
    expect(toPriceOptions([49.5, 100000], INDIA).map((option) => option.label)).toEqual([
      'Up to ₹49.50',
      'Up to ₹1,00,000',
    ]);
  });

  it("builds a second store's labels from its own currency, never India's", () => {
    const bahrain = { currencyCode: 'BHD', language: 'EN', country: 'BH' };

    const [option] = toPriceOptions([2], bahrain);

    expect(option?.label).toBe(`Up to ${formatPrice(2, 'BHD', 'en-BH')}`);
    expect(option?.label).not.toContain('₹');
  });
});
