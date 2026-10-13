import { toProfile } from '@/customerAccountApi/profile';

import { MARKERS, profileData } from '../helpers/customerAccountApi';

describe('toProfile', () => {
  it('joins the name and keeps the email, phone and address lines', () => {
    expect(toProfile(profileData())).toEqual({
      name: `${MARKERS.firstName} ${MARKERS.lastName}`,
      email: MARKERS.email,
      phone: MARKERS.phone,
      addressLines: [...MARKERS.addressLines],
    });
  });

  it('gives undefined for each value the customer has not given', () => {
    expect(
      toProfile(
        profileData({
          firstName: null,
          lastName: '  ',
          emailAddress: null,
          phoneNumber: null,
          defaultAddress: null,
        }),
      ),
    ).toEqual({ name: undefined, email: undefined, phone: undefined, addressLines: [] });
  });

  it('uses one name alone, and drops empty address lines', () => {
    const profile = toProfile(
      profileData({ lastName: null, defaultAddress: { formatted: ['1 Main Road', ' ', 'India'] } }),
    );
    expect(profile.name).toBe(MARKERS.firstName);
    expect(profile.addressLines).toEqual(['1 Main Road', 'India']);
  });
});
