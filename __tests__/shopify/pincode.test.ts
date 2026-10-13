import { act, renderHook } from '@testing-library/react-native';

import {
  checkPincode,
  editPincode,
  forgetPincode,
  getPincodeState,
  pincodeDigits,
  submitPincode,
  usePincode,
} from '@/shopify/pincode';

// The India store's ranges (R3; `SHOPIFY_AUDIT.md`, "Rule: Shipping Restriction").
const INDIA = [
  { from: 50, to: 53 },
  { from: 56, to: 69 },
];

beforeEach(() => {
  forgetPincode();
});

describe('checkPincode (R3, D-142)', () => {
  it.each(['560001', '500000', '539999', '560000', '699999', '600001'])(
    'delivers to %s',
    (pincode) => {
      expect(checkPincode(pincode, INDIA)).toBe('in_area');
    },
  );

  it.each(['400001', '540000', '559999', '700000', '049999', '110001', '000000'])(
    'does not deliver to %s',
    (pincode) => {
      expect(checkPincode(pincode, INDIA)).toBe('outside_area');
    },
  );

  it.each(['12345', '', '1234567', '56000a', ' 560001', '560 01'])(
    'asks for six digits for %p',
    (text) => {
      expect(checkPincode(text, INDIA)).toBe('invalid');
    },
  );

  it('follows the configured ranges, not fixed ones', () => {
    const other = [{ from: 10, to: 13 }];

    expect(checkPincode('110001', other)).toBe('in_area');
    expect(checkPincode('560001', other)).toBe('outside_area');
    expect(checkPincode('560001', [])).toBe('outside_area');
  });
});

describe('pincodeDigits', () => {
  it('keeps digits only, at most six', () => {
    expect(pincodeDigits('56-00 01')).toBe('560001');
    expect(pincodeDigits('abc')).toBe('');
    expect(pincodeDigits('5600012')).toBe('560001');
  });
});

describe('the pincode in memory', () => {
  it('keeps the text and the result for every reader, across a new mount', async () => {
    const first = await renderHook(() => usePincode());
    await act(async () => {
      editPincode('560001');
      expect(submitPincode(INDIA)).toBe('in_area');
    });
    expect(first.result.current).toEqual({ text: '560001', result: 'in_area' });
    await first.unmount();

    const second = await renderHook(() => usePincode());
    expect(second.result.current).toEqual({ text: '560001', result: 'in_area' });
  });

  it('gives a result once until the field changes', () => {
    editPincode('400001');

    expect(submitPincode(INDIA)).toBe('outside_area');
    expect(submitPincode(INDIA)).toBeUndefined();
    expect(getPincodeState().result).toBe('outside_area');

    editPincode('40000');
    expect(getPincodeState()).toEqual({ text: '40000', result: undefined });
    expect(submitPincode(INDIA)).toBe('invalid');
  });

  it('keeps the result when the same text is set again', () => {
    editPincode('560001');
    submitPincode(INDIA);
    editPincode('560001');

    expect(getPincodeState().result).toBe('in_area');
  });

  it('strips anything but digits as it is typed', () => {
    editPincode('5a6b0-001');

    expect(getPincodeState().text).toBe('560001');
  });

  it('forgets the pincode and its result', () => {
    editPincode('560001');
    submitPincode(INDIA);

    forgetPincode();

    expect(getPincodeState()).toEqual({ text: '', result: undefined });
  });
});
