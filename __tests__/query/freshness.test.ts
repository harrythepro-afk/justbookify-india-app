import { freshness } from '@/query/freshness';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// The numbers the architect approved (D-062).
describe('freshness presets', () => {
  it('keeps catalogue data fresh for 5 minutes and for 30 minutes in all', () => {
    expect(freshness.catalogue).toEqual({ staleTime: 5 * MINUTE, gcTime: 30 * MINUTE });
  });

  it('keeps live stock fresh for 30 seconds and refetches it whenever a screen opens', () => {
    expect(freshness.liveStock).toEqual({
      staleTime: 30 * SECOND,
      gcTime: 5 * MINUTE,
      refetchOnMount: 'always',
    });
  });

  it('keeps static content fresh for 6 hours and for 24 hours in all', () => {
    expect(freshness.staticContent).toEqual({ staleTime: 6 * HOUR, gcTime: 24 * HOUR });
  });

  it('never serves checkout data from the cache', () => {
    expect(freshness.checkout).toEqual({ staleTime: 0, gcTime: 0, refetchOnMount: 'always' });
  });
});

// P7-02 (D-127): the customer's own profile and orders.
describe('the account preset', () => {
  it('keeps customer data fresh for a minute and for 30 minutes in all', () => {
    expect(freshness.account).toEqual({ staleTime: 1 * MINUTE, gcTime: 30 * MINUTE });
  });
});
