/**
 * The customer's profile for the Account tab (P7-02, read only; architect's answer 1): name,
 * email, phone and the default address. Read through the Customer Account API client (D-126),
 * typed by code generation (D-125). Values go to the screen only: never logged, never in
 * analytics or Sentry (D-127).
 */

import { customerAccountQuery } from './client';
import type { CustomerProfileQuery } from './generated/customer.generated';

export const CUSTOMER_PROFILE_QUERY = `#graphql
query CustomerProfile {
  customer {
    firstName
    lastName
    emailAddress {
      emailAddress
    }
    phoneNumber {
      phoneNumber
    }
    defaultAddress {
      formatted
    }
  }
}
`;

export type CustomerProfile = {
  /** First and last name joined; undefined when neither is set. */
  readonly name: string | undefined;
  readonly email: string | undefined;
  readonly phone: string | undefined;
  /** The default address as Shopify formats it, one line each; empty when there is none. */
  readonly addressLines: readonly string[];
};

function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

export function toProfile(data: CustomerProfileQuery): CustomerProfile {
  const { customer } = data;
  const name = [present(customer.firstName), present(customer.lastName)]
    .filter((part) => part !== undefined)
    .join(' ');
  return {
    name: name === '' ? undefined : name,
    email: present(customer.emailAddress?.emailAddress),
    phone: present(customer.phoneNumber?.phoneNumber),
    addressLines: (customer.defaultAddress?.formatted ?? [])
      .map((line) => present(line))
      .filter((line): line is string => line !== undefined),
  };
}

export async function fetchCustomerProfile(signal?: AbortSignal): Promise<CustomerProfile> {
  return toProfile(await customerAccountQuery(CUSTOMER_PROFILE_QUERY, { signal }));
}
