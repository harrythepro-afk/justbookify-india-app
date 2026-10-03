import {
  parseStoreConfig,
  StoreConfigError,
  type RawStoreEnv,
  type StoreConfigStatus,
} from '@/config/store';

// Invented values for the parser only. They are not the store's real settings.
const validEnv: RawStoreEnv = {
  EXPO_PUBLIC_STORE_DOMAIN: 'Test-Store.example.com',
  EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN: ' invented-public-token ',
  EXPO_PUBLIC_STORE_CURRENCY: 'USD',
  EXPO_PUBLIC_SHIPPING_FEE_PREPAID: '4.50',
  EXPO_PUBLIC_SHIPPING_FEE_COD: '7',
  EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD: '30',
  EXPO_PUBLIC_ORDER_CAP: '60',
  EXPO_PUBLIC_DELIVERY_PINCODE_RANGES: '10-13, 20',
};

function thrownBy(env: RawStoreEnv): StoreConfigError {
  try {
    parseStoreConfig(env);
  } catch (error) {
    if (error instanceof StoreConfigError) return error;
    throw error;
  }
  throw new Error('Expected parseStoreConfig to throw.');
}

describe('parseStoreConfig', () => {
  it('parses a complete configuration', () => {
    expect(parseStoreConfig(validEnv)).toEqual({
      storeDomain: 'test-store.example.com',
      storefrontAccessToken: 'invented-public-token',
      currencyCode: 'USD',
      shippingFeePrepaid: 4.5,
      shippingFeeCod: 7,
      freeDeliveryThreshold: 30,
      orderCap: 60,
      deliveryPincodeRanges: [
        { from: 10, to: 13 },
        { from: 20, to: 20 },
      ],
    });
  });

  it('reports every variable that is missing, by name', () => {
    const empty: RawStoreEnv = {
      EXPO_PUBLIC_STORE_DOMAIN: undefined,
      EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN: '  ',
      EXPO_PUBLIC_STORE_CURRENCY: '',
      EXPO_PUBLIC_SHIPPING_FEE_PREPAID: undefined,
      EXPO_PUBLIC_SHIPPING_FEE_COD: undefined,
      EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD: undefined,
      EXPO_PUBLIC_ORDER_CAP: undefined,
      EXPO_PUBLIC_DELIVERY_PINCODE_RANGES: '',
    };

    expect(thrownBy(empty).invalid).toEqual(Object.keys(empty));
  });

  it.each([
    ['EXPO_PUBLIC_STORE_DOMAIN', 'https://test-store.example.com'],
    ['EXPO_PUBLIC_STORE_DOMAIN', 'test-store.example.com/path'],
    ['EXPO_PUBLIC_STORE_DOMAIN', 'localhost'],
    ['EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN', 'two words'],
    ['EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN', 'shpat_invented'],
    ['EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN', 'SHPSS_invented'],
    ['EXPO_PUBLIC_STORE_CURRENCY', 'usd'],
    ['EXPO_PUBLIC_STORE_CURRENCY', 'USDX'],
    ['EXPO_PUBLIC_SHIPPING_FEE_PREPAID', '-1'],
    ['EXPO_PUBLIC_SHIPPING_FEE_COD', 'free'],
    ['EXPO_PUBLIC_FREE_DELIVERY_THRESHOLD', '1.234'],
    ['EXPO_PUBLIC_ORDER_CAP', '0'],
    ['EXPO_PUBLIC_DELIVERY_PINCODE_RANGES', '13-10'],
    ['EXPO_PUBLIC_DELIVERY_PINCODE_RANGES', '1-2'],
    ['EXPO_PUBLIC_DELIVERY_PINCODE_RANGES', '10-13,'],
  ] as const)('rejects %s = %p', (name, value) => {
    expect(thrownBy({ ...validEnv, [name]: value }).invalid).toEqual([name]);
  });

  it('never puts a rejected value in the error message', () => {
    const error = thrownBy({ ...validEnv, EXPO_PUBLIC_STORE_DOMAIN: 'not a domain 12345' });

    expect(error.message).toContain('EXPO_PUBLIC_STORE_DOMAIN');
    expect(error.message).not.toContain('12345');
  });

  it('never puts a rejected token in the error message', () => {
    const error = thrownBy({ ...validEnv, EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN: 'shpat_invented' });

    expect(error.message).toContain('EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN');
    expect(error.message).not.toContain('invented');
  });
});

describe('getStoreConfigStatus', () => {
  const originalEnv = process.env;

  // getStoreConfig caches its result, so each case loads a fresh copy of the module.
  function statusWith(env: Partial<RawStoreEnv>): StoreConfigStatus {
    process.env = { ...originalEnv, ...env };
    let status: StoreConfigStatus | undefined;
    jest.isolateModules(() => {
      const store = jest.requireActual<typeof import('@/config/store')>('@/config/store');
      status = store.getStoreConfigStatus();
    });
    if (status === undefined) throw new Error('Expected a status.');
    return status;
  }

  afterEach(() => {
    process.env = originalEnv;
  });

  it('reports a complete configuration as configured', () => {
    expect(statusWith(validEnv)).toBe('configured');
  });

  it('reports a missing variable as not configured instead of throwing', () => {
    expect(statusWith({ ...validEnv, EXPO_PUBLIC_STORE_DOMAIN: undefined })).toBe('not configured');
  });

  it('reports a secret token as not configured', () => {
    expect(statusWith({ ...validEnv, EXPO_PUBLIC_STOREFRONT_ACCESS_TOKEN: 'shpat_invented' })).toBe(
      'not configured',
    );
  });
});
