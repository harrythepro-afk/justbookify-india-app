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
