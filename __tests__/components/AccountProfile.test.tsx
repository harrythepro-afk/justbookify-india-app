import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  AccountProfile,
  DETAILS_HEADING,
  DETAILS_OFFLINE_NOTICE,
  NOT_ADDED,
} from '@/components/AccountProfile';
import { ERROR_MESSAGE, OFFLINE_MESSAGE } from '@/components/ScreenMessage';
import type { CustomerSessionState } from '@/customerAccount/session';
import { CustomerAccountApiError } from '@/customerAccountApi/errors';
import { toProfile, type CustomerProfile } from '@/customerAccountApi/profile';

import { MARKERS, profileData } from '../helpers/customerAccountApi';

let mockSession: CustomerSessionState = { status: 'signedIn' };
jest.mock('@/customerAccount/session', () => ({
  useCustomerSession: () => mockSession,
}));

type ProfileState = { data: CustomerProfile | undefined; error: unknown; isFetching: boolean };
let mockProfile: ProfileState;
let mockOffline = false;
const mockRefetch = jest.fn();
const mockRecheck = jest.fn(() => Promise.resolve());
jest.mock('@/customerAccountApi/hooks/customer', () => ({
  useCustomerProfile: () => ({ ...mockProfile, refetch: () => mockRefetch() }),
  useIsOffline: () => mockOffline,
  recheckNetwork: () => mockRecheck(),
}));

beforeEach(() => {
  mockSession = { status: 'signedIn' };
  mockProfile = { data: toProfile(profileData()), error: null, isFetching: false };
  mockOffline = false;
  jest.clearAllMocks();
});

describe('AccountProfile (architect, answer 1)', () => {
  it('shows the name, email, phone and default address, read only', async () => {
    await render(<AccountProfile />);

    expect(screen.getByRole('header', { name: DETAILS_HEADING })).toBeTruthy();
    expect(screen.getByText(`${MARKERS.firstName} ${MARKERS.lastName}`)).toBeTruthy();
    expect(screen.getByText(MARKERS.email)).toBeTruthy();
    expect(screen.getByText(MARKERS.phone)).toBeTruthy();
    expect(screen.getByText(MARKERS.addressLines.join('\n'))).toBeTruthy();
    for (const label of ['Name', 'Email', 'Phone', 'Default address']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('says "Not added" for each value the customer has not given', async () => {
    mockProfile = {
      data: { name: undefined, email: undefined, phone: undefined, addressLines: [] },
      error: null,
      isFetching: false,
    };
    await render(<AccountProfile />);

    expect(screen.getAllByText(NOT_ADDED)).toHaveLength(4);
  });

  it.each([
    ['signed out', { status: 'signedOut', notice: 'none', loggingIn: false }],
    ['loading', { status: 'loading' }],
    ['not configured', { status: 'notConfigured' }],
  ] as [string, CustomerSessionState][])('shows nothing while %s', async (_name, session) => {
    mockSession = session;
    await render(<AccountProfile />);

    expect(screen.queryByText(DETAILS_HEADING)).toBeNull();
    expect(screen.queryByText(MARKERS.email)).toBeNull();
  });

  it('shows a spinner while the profile loads', async () => {
    mockProfile = { data: undefined, error: null, isFetching: true };
    await render(<AccountProfile />);

    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('offline with nothing saved: the offline message, and "Try again" re-reads the network first', async () => {
    mockOffline = true;
    mockProfile = { data: undefined, error: null, isFetching: false };
    await render(<AccountProfile />);

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mockRefetch).toHaveBeenCalledTimes(1));
    expect(mockRecheck).toHaveBeenCalledTimes(1);
  });

  it('any other failure: the general error', async () => {
    mockProfile = {
      data: undefined,
      error: new CustomerAccountApiError('unauthorized', {
        operationName: 'CustomerProfile',
        status: 401,
      }),
      isFetching: false,
    };
    await render(<AccountProfile />);

    expect(screen.getByText(ERROR_MESSAGE)).toBeTruthy();
  });

  it('keeps saved details offline, with the details notice', async () => {
    mockOffline = true;
    await render(<AccountProfile />);

    expect(screen.getByText(DETAILS_OFFLINE_NOTICE)).toBeTruthy();
    expect(screen.getByText(MARKERS.email)).toBeTruthy();
  });
});
