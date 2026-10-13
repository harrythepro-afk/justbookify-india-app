export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  Decimal: { input: string; output: string; }
  HTML: { input: string; output: string; }
  ISO8601DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
  URL: { input: string; output: string; }
  UnsignedInt64: { input: string; output: string; }
};

/** The bank account payment details related to a transaction. */
export type AchPaymentDetails = {
  __typename?: 'AchPaymentDetails';
  /** The name of the bank used. */
  bankName: Scalars['String']['output'];
  /** The last four digits of the bank account used. */
  last4?: Maybe<Scalars['String']['output']>;
};

/** A sale that includes an additional fee charge. */
export type AdditionalFeeSale = Node & Sale & {
  __typename?: 'AdditionalFeeSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** The address form field. */
export type AddressFormField = {
  __typename?: 'AddressFormField';
  /** The mode of the address field. */
  mode: AddressFormFieldMode;
};

/** Defines the mode for an address form field. */
export const AddressFormFieldMode = {
  /**
   * Indicates that the form field should be hidden from the UI.
   * Any values provided by the client will be ignored by the backend.
   */
  Ignored: 'IGNORED',
  /** Indicates that the form field is visible in the UI and can be left empty. */
  Optional: 'OPTIONAL',
  /** Indicates that the form field is visible in the UI and requires a non-empty value. */
  Required: 'REQUIRED'
} as const;

export type AddressFormFieldMode = typeof AddressFormFieldMode[keyof typeof AddressFormFieldMode];
/** The settings for the address form. */
export type AddressFormSettings = {
  __typename?: 'AddressFormSettings';
  /** The setting for the Address2 form field. */
  address2: AddressFormField;
  /** Whether the address autocompletion is enabled. */
  addressAutocompletion: Scalars['Boolean']['output'];
  /** The setting for the Company form field. */
  company: AddressFormField;
  /** The setting for the First name form field. */
  firstName: AddressFormField;
  /** The setting for the Phone form field. */
  phone: AddressFormField;
};

/** A sale event that results in an adjustment to the order price. */
export type AdjustmentSale = Node & Sale & {
  __typename?: 'AdjustmentSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** A Shopify app. */
export type App = Node & {
  __typename?: 'App';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The name of the app. */
  title: Scalars['String']['output'];
};

/** The input fields for the billing address received from Apple Pay. */
export type ApplePayBillingAddressInput = {
  /** The first line of the address, typically the street address or PO Box number. */
  address1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the address, typically the apartment, suite, or unit number. */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The region of the address, such as the province, state, or district. */
  administrativeArea?: InputMaybe<Scalars['String']['input']>;
  /** The name of the country. */
  country?: InputMaybe<Scalars['String']['input']>;
  /** The two-letter code for the country of the address. */
  countryCode?: InputMaybe<CountryCode>;
  /** The family name of the customer. */
  familyName?: InputMaybe<Scalars['String']['input']>;
  /** The given name of the customer. */
  givenName?: InputMaybe<Scalars['String']['input']>;
  /** The name of the city, district, village, or town. */
  locality?: InputMaybe<Scalars['String']['input']>;
  /** The telephone number of the customer. */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code of the address. */
  postalCode?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `applePayCreditCardAdd` mutation. */
export type ApplePayCreditCardAddPayload = {
  __typename?: 'ApplePayCreditCardAddPayload';
  /** The newly added credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `applePayCreditCardUpdate` mutation. */
export type ApplePayCreditCardUpdatePayload = {
  __typename?: 'ApplePayCreditCardUpdatePayload';
  /** The updated credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `applePaySessionCreate` mutation. */
export type ApplePaySessionCreatePayload = {
  __typename?: 'ApplePaySessionCreatePayload';
  /** The object that contains the session data. */
  body?: Maybe<Scalars['String']['output']>;
  /** The ID for the created session. */
  id?: Maybe<Scalars['String']['output']>;
  /** Whether the session is ready. The `body` field is `null` while this value is `false`. */
  ready?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<ApplePaySessionUserError>;
};

/** The error codes for failures to create Apple Pay sessions. */
export type ApplePaySessionUserError = DisplayableError & {
  __typename?: 'ApplePaySessionUserError';
  /** The error code. */
  code?: Maybe<ApplePaySessionUserErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `ApplePaySessionUserError`. */
export const ApplePaySessionUserErrorCode = {
  /** Apple Pay session could not be created. */
  SessionCouldNotBeCreated: 'SESSION_COULD_NOT_BE_CREATED',
  /** Validation URL is not an Apple Pay gateway endpoint. */
  ValidationUrlIsInvalid: 'VALIDATION_URL_IS_INVALID'
} as const;

export type ApplePaySessionUserErrorCode = typeof ApplePaySessionUserErrorCode[keyof typeof ApplePaySessionUserErrorCode];
/** The configuration settings for the Apple Pay wallet. */
export type ApplePayWalletConfig = {
  __typename?: 'ApplePayWalletConfig';
  /** Supported card networks for Apple Pay. */
  supportedNetworks: Array<Scalars['String']['output']>;
};

/** The details about the gift card used on the checkout. */
export type AppliedGiftCard = Node & {
  __typename?: 'AppliedGiftCard';
  /** The amount deducted from the gift card. */
  amountUsed: MoneyV2;
  /** The remaining amount on the gift card. */
  balance: MoneyV2;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last characters of the gift card. */
  lastCharacters: Scalars['String']['output'];
  /** The amount applied to the checkout in its currency. */
  presentmentAmountUsed: MoneyV2;
};

/**
 * A custom property. Attributes are used to store additional information about a Shopify resource, such as
 * products, customers, or orders. Attributes are stored as key-value pairs.
 *
 * For example, a list of attributes might include whether a customer is a first-time buyer (`"customer_first_order": "true"`),
 * whether an order is gift-wrapped (`"gift_wrapped": "true"`), a preferred delivery date
 * (`"preferred_delivery_date": "2025-10-01"`), the discount applied (`"loyalty_discount_applied": "10%"`), and any
 * notes provided by the customer (`"customer_notes": "Please leave at the front door"`).
 */
export type Attribute = {
  __typename?: 'Attribute';
  /** The key or name of the attribute. For example, `"customer_first_order"`. */
  key: Scalars['String']['output'];
  /** The value of the attribute. For example, `"true"`. */
  value?: Maybe<Scalars['String']['output']>;
};

/** Captures the intentions of a discount that was automatically applied. */
export type AutomaticDiscountApplication = DiscountApplication & {
  __typename?: 'AutomaticDiscountApplication';
  /** The method by which the discount's value is allocated to its entitled items. */
  allocationMethod: DiscountApplicationAllocationMethod;
  /** The lines of targetType that the discount is allocated over. */
  targetSelection: DiscountApplicationTargetSelection;
  /** The type of line that the discount is applicable towards. */
  targetType: DiscountApplicationTargetType;
  /** The title of the application. */
  title: Scalars['String']['output'];
  /** The value of the discount application. */
  value: PricingValue;
};

/** A collection of available shipping rates for a checkout. */
export type AvailableShippingRates = {
  __typename?: 'AvailableShippingRates';
  /**
   * Whether the shipping rates are ready.
   * The `shippingRates` field is `null` when this value is `false`.
   * This field should be polled until its value becomes `true`.
   */
  ready: Scalars['Boolean']['output'];
  /** The fetched shipping rates. `null` until the `ready` field is `true`. */
  shippingRates?: Maybe<Array<ShippingRate>>;
};

/** The type of bank account holder. */
export const BankAccountHolderType = {
  /** A company account holder. */
  Company: 'COMPANY',
  /** An individual account holder. */
  Individual: 'INDIVIDUAL'
} as const;

export type BankAccountHolderType = typeof BankAccountHolderType[keyof typeof BankAccountHolderType];
/** The type of bank account. */
export const BankAccountType = {
  /** A checking account. */
  Checking: 'CHECKING',
  /** A savings account. */
  Savings: 'SAVINGS'
} as const;

export type BankAccountType = typeof BankAccountType[keyof typeof BankAccountType];
/** Represents a bank account payment instrument. */
export type BankPaymentInstrument = Node & PaymentInstrument & {
  __typename?: 'BankPaymentInstrument';
  /** The type of account holder. */
  accountHolderType?: Maybe<BankAccountHolderType>;
  /** The type of bank account. */
  accountType: BankAccountType;
  /** The name of the bank. */
  bankName: Scalars['String']['output'];
  /** The billing address associated with the bank account. */
  billingAddress?: Maybe<PaymentInstrumentBillingAddress>;
  /** The list of open draft orders associated with this payment instrument. */
  draftOrders: DraftOrderConnection;
  /** The globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last four digits of the account number. */
  lastDigits: Scalars['String']['output'];
  /** The list of pending orders associated with this payment instrument. */
  orders: OrderConnection;
  /** The list of subscription contracts charged using this payment instrument. */
  subscriptionContracts: SubscriptionContractConnection;
};


/** Represents a bank account payment instrument. */
export type BankPaymentInstrumentDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents a bank account payment instrument. */
export type BankPaymentInstrumentOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents a bank account payment instrument. */
export type BankPaymentInstrumentSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/** A bank payment method that can be used for recurring and future payments. */
export type BankPaymentMethod = {
  __typename?: 'BankPaymentMethod';
  /** The payment provider client credentials. */
  paymentProviderClientCredentials: PaymentProviderClientCredentials;
};

/** The input fields required for updating a business contact. */
export type BusinessContactUpdateInput = {
  /** The first name of the business contact. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The last name of the business contact. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The locale of the business contact. */
  locale?: InputMaybe<Scalars['String']['input']>;
  /** The title of the business contact. */
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `businessContactUpdate` mutation. */
export type BusinessContactUpdatePayload = {
  __typename?: 'BusinessContactUpdatePayload';
  /** The updated business contact information. */
  businessContact?: Maybe<CompanyContact>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsBusinessContactUserErrors>;
};

/** Possible error codes that can be returned by `BusinessCustomerUserError`. */
export const BusinessCustomerErrorCode = {
  /** The input value is blank. */
  Blank: 'BLANK',
  /** Business location doesn't exist. */
  BusinessLocationNotFound: 'BUSINESS_LOCATION_NOT_FOUND',
  /** Deleting the resource failed. */
  FailedToDelete: 'FAILED_TO_DELETE',
  /** An internal error occurred. */
  InternalError: 'INTERNAL_ERROR',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** The input is invalid. */
  InvalidInput: 'INVALID_INPUT',
  /** The number of resources exceeded the limit. */
  LimitReached: 'LIMIT_REACHED',
  /** The input is empty. */
  NoInput: 'NO_INPUT',
  /** Permission denied. */
  PermissionDenied: 'PERMISSION_DENIED',
  /** Missing a required field. */
  Required: 'REQUIRED',
  /** The resource wasn't found. */
  ResourceNotFound: 'RESOURCE_NOT_FOUND',
  /** The input value is already taken. */
  Taken: 'TAKEN',
  /** The field value is too long. */
  TooLong: 'TOO_LONG',
  /** Unexpected type. */
  UnexpectedType: 'UNEXPECTED_TYPE'
} as const;

export type BusinessCustomerErrorCode = typeof BusinessCustomerErrorCode[keyof typeof BusinessCustomerErrorCode];
/** An error that happens during the execution of a business customer mutation. */
export type BusinessCustomerUserError = DisplayableError & {
  __typename?: 'BusinessCustomerUserError';
  /** The error code. */
  code?: Maybe<BusinessCustomerErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Return type for `businessLocationCreditCardAdd` mutation. */
export type BusinessLocationCreditCardAddPayload = {
  __typename?: 'BusinessLocationCreditCardAddPayload';
  /** The newly added credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** The URL to redirect the customer to for completing the 3D Secure payment flow. */
  nextActionUrl?: Maybe<Scalars['URL']['output']>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsBusinessLocationPaymentInstrumentUserErrors>;
};

/** Return type for `businessLocationCreditCardUpdate` mutation. */
export type BusinessLocationCreditCardUpdatePayload = {
  __typename?: 'BusinessLocationCreditCardUpdatePayload';
  /** The updated credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsBusinessLocationPaymentInstrumentUserErrors>;
};

/** Return type for `businessLocationPaymentInstrumentRemove` mutation. */
export type BusinessLocationPaymentInstrumentRemovePayload = {
  __typename?: 'BusinessLocationPaymentInstrumentRemovePayload';
  /** The ID of the removed payment instrument. */
  deletedPaymentInstrumentId?: Maybe<Scalars['ID']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsBusinessLocationPaymentInstrumentUserErrors>;
};

/** The configuration for the buyer's checkout. */
export type BuyerExperienceConfiguration = {
  __typename?: 'BuyerExperienceConfiguration';
  /** The deposit amount required for the order. */
  deposit?: Maybe<DepositConfiguration>;
  /**
   * Whether the buyer must pay at checkout or
   * can choose to pay at checkout or pay later using net terms.
   */
  payNowOnly: Scalars['Boolean']['output'];
  /** The merchant configured payment terms. */
  paymentTermsTemplate?: Maybe<PaymentTermsTemplate>;
};

/** The input fields to calculate return amounts associated with an order. */
export type CalculateReturnInput = {
  /** The ID of the order that will be returned. */
  orderId: Scalars['ID']['input'];
  /** The line items from the order to include in the return. */
  returnLineItems: Array<CalculateReturnLineItemInput>;
};

/** The input fields for return line items on a calculated return. */
export type CalculateReturnLineItemInput = {
  /** The ID of the line item to be returned. */
  lineItemId: Scalars['ID']['input'];
  /** The quantity of the item to be returned.Quantity can't exceed the line item's fulfilled quantity. */
  quantity: Scalars['Int']['input'];
};

/** The calculated financial outcome of a return based on the line items requested for return.Includes the monetary values of the line items, along with applicable taxes, discounts, and otherfees on the order. Financial summary may include return fees depending onthe [return rules](https://help.shopify.com/manual/fulfillment/managing-orders/returns/return-rules)at the time the order was placed. */
export type CalculatedReturn = {
  __typename?: 'CalculatedReturn';
  /** A breakdown of the monetary values for the calculated return. */
  financialSummary: ReturnFinancialSummary;
  /** A list of line items being processed for a return. */
  returnLineItems: CalculatedReturnLineItemConnection;
};


/** The calculated financial outcome of a return based on the line items requested for return.Includes the monetary values of the line items, along with applicable taxes, discounts, and otherfees on the order. Financial summary may include return fees depending onthe [return rules](https://help.shopify.com/manual/fulfillment/managing-orders/returns/return-rules)at the time the order was placed. */
export type CalculatedReturnReturnLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The line item being processed for a return and its calculated monetary values. */
export type CalculatedReturnLineItem = {
  __typename?: 'CalculatedReturnLineItem';
  /** The line item being processed for a return. */
  lineItem: LineItem;
  /** The quantity being returned. */
  quantity: Scalars['Int']['output'];
  /** The subtotal of the return line item without target all discounts. */
  subtotalBeforeTargetAllDiscountsSet: MoneyBag;
  /** The subtotal of the return line item. */
  subtotalSet: MoneyBag;
  /** The total tax of the return line item. */
  totalTaxSet: MoneyBag;
};

/** An auto-generated type for paginating through multiple CalculatedReturnLineItems. */
export type CalculatedReturnLineItemConnection = {
  __typename?: 'CalculatedReturnLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CalculatedReturnLineItemEdge>;
  /** A list of nodes that are contained in CalculatedReturnLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CalculatedReturnLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CalculatedReturnLineItem and a cursor during pagination. */
export type CalculatedReturnLineItemEdge = {
  __typename?: 'CalculatedReturnLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CalculatedReturnLineItemEdge. */
  node: CalculatedReturnLineItem;
};

/** The card payment details related to a transaction. */
export type CardPaymentDetails = {
  __typename?: 'CardPaymentDetails';
  /** The brand of the credit card used. */
  cardBrand: Scalars['String']['output'];
  /** The last four digits of the credit card used. */
  last4?: Maybe<Scalars['String']['output']>;
};

/** A container for information required to checkout items and pay. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type Checkout = Node & {
  __typename?: 'Checkout';
  /** The gift cards used on the checkout. */
  appliedGiftCards: Array<AppliedGiftCard>;
  /**
   * The available shipping rates for this Checkout.
   * Should only be used when checkout `requiresShipping` is `true` and
   * the shipping address is valid.
   */
  availableShippingRates?: Maybe<AvailableShippingRates>;
  /** The date and time when the checkout was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The currency code for the checkout. */
  currencyCode: CurrencyCode;
  /** The extra information added to the checkout. */
  customAttributes: Array<Attribute>;
  /** The discounts applied on the checkout. */
  discountApplications: DiscountApplicationConnection;
  /** The email associated with this checkout. */
  email?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** A list of line item objects, each containing information about an item in the checkout. */
  lineItems: CheckoutLineItemConnection;
  /**
   * The sum of all the prices of all the items in the checkout,
   * excluding duties, taxes, shipping, and discounts.
   */
  lineItemsSubtotalPrice: MoneyV2;
  /** The note associated with the checkout. */
  note?: Maybe<Scalars['String']['output']>;
  /** The amount left to be paid. This is equal to the cost of the line items, duties, taxes, and shipping, minus discounts and gift cards. */
  paymentDue: MoneyV2;
  /**
   * Whether the Checkout is ready and can be completed. Checkouts may
   * have asynchronous operations that can take time to finish. If you want
   * to complete a checkout or ensure all the fields are populated and up to
   * date, polling is required until the value is true.
   */
  ready: Scalars['Boolean']['output'];
  /** Whether the fulfillment requires shipping. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The address where the line items will be shipped. */
  shippingAddress?: Maybe<CustomerMailingAddress>;
  /** The discounts allocated to the shipping line by discount applications. */
  shippingDiscountAllocations: Array<DiscountAllocation>;
  /** The selected shipping rate, transitioned to a `shipping_line` object. */
  shippingLine?: Maybe<ShippingRate>;
  /** The price at checkout before duties, shipping, and taxes. */
  subtotalPrice: MoneyV2;
  /** Whether the checkout is tax exempt. */
  taxExempt: Scalars['Boolean']['output'];
  /** Whether taxes are included in the line item and shipping line prices. */
  taxesIncluded: Scalars['Boolean']['output'];
  /** The sum of all the duties applied to the line items in the checkout. */
  totalDuties?: Maybe<MoneyV2>;
  /**
   * The sum of all the prices of all the items in the checkout,
   * duties, taxes, and discounts included.
   */
  totalPrice: MoneyV2;
  /** The sum of all the taxes applied to the line items and shipping lines in the checkout. */
  totalTax: MoneyV2;
  /** The URL for the checkout, accessible from the web. */
  webUrl: Scalars['URL']['output'];
};


/** A container for information required to checkout items and pay. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CheckoutDiscountApplicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A container for information required to checkout items and pay. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CheckoutLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A line item in the checkout, grouped by variant and attributes. */
export type CheckoutLineItem = Node & {
  __typename?: 'CheckoutLineItem';
  /** An array of Key-Value pairs providing extra information about the line item. */
  customAttributes: Array<Attribute>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The price of the line item. */
  price?: Maybe<MoneyV2>;
  /** The quantity of the line item. */
  quantity: Scalars['Int']['output'];
  /** The title of the line item. Defaults to the product's title. */
  title: Scalars['String']['output'];
  /** The unit price of the line item. */
  unitPrice?: Maybe<MoneyV2>;
  /** The name of the variant. */
  variantTitle?: Maybe<Scalars['String']['output']>;
};

/** An auto-generated type for paginating through multiple CheckoutLineItems. */
export type CheckoutLineItemConnection = {
  __typename?: 'CheckoutLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CheckoutLineItemEdge>;
  /** A list of nodes that are contained in CheckoutLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CheckoutLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CheckoutLineItem and a cursor during pagination. */
export type CheckoutLineItemEdge = {
  __typename?: 'CheckoutLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CheckoutLineItemEdge. */
  node: CheckoutLineItem;
};

/** Represents a company's information. */
export type Company = HasMetafields & Node & {
  __typename?: 'Company';
  /** The list of company draft orders. */
  draftOrders: DraftOrderConnection;
  /** A unique externally-supplied ID for the company. */
  externalId?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The list of locations that the business of the business contact belongs to. */
  locations: CompanyLocationConnection;
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
  /** The name of the company. */
  name: Scalars['String']['output'];
  /** The list of customer orders under the company. */
  orders: OrderConnection;
  /** The profile of the customer. */
  profile?: Maybe<CompanyContact>;
};


/** Represents a company's information. */
export type CompanyDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<DraftOrderByCompanySortKeys>;
};


/** Represents a company's information. */
export type CompanyLocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<CompanyLocationSortKeys>;
};


/** Represents a company's information. */
export type CompanyMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** Represents a company's information. */
export type CompanyMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};


/** Represents a company's information. */
export type CompanyOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<OrderByCompanySortKeys>;
};

/** The address of a company location, either billing or shipping. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CompanyAddress = Node & {
  __typename?: 'CompanyAddress';
  /** The first line of the address. It is typically the street address or PO Box number. */
  address1: Scalars['String']['output'];
  /** The second line of the address. It is typically the apartment, suite, or unit number. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The city, district, village, or town. */
  city?: Maybe<Scalars['String']['output']>;
  /** The name of the company. */
  company: Scalars['String']['output'];
  /** The name of the company. */
  companyName: Scalars['String']['output'];
  /** The name of the country of the address. */
  country?: Maybe<Scalars['String']['output']>;
  /** The two-letter code for the country of the address, for example, US. */
  countryCode: CountryCode;
  /** The two-letter code for the country of the address, for example, US. */
  countryCodeV2: CountryCode;
  /**
   * The date and time (in [ISO 8601 format](http://en.wikipedia.org/wiki/ISO_8601))
   * when the company address was created.
   */
  createdAt: Scalars['DateTime']['output'];
  /** The first name of the recipient. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The formatted version of the address. */
  formatted: Array<Scalars['String']['output']>;
  /** The formatted version of the address. */
  formattedAddress: Array<Scalars['String']['output']>;
  /** A comma-separated list of the city, province, and country values. */
  formattedArea?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last name of the recipient. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The latitude coordinate of the address. */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** The longitude coordinate of the address. */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** The unique phone number of the customer, formatted using the E.164 standard, for example, _+16135551111_. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The region of the address, such as the province, state, or district. */
  province?: Maybe<Scalars['String']['output']>;
  /** The alphanumeric code for the region, for example, ON. */
  provinceCode?: Maybe<Scalars['String']['output']>;
  /** The identity of the recipient, for example, 'Receiving Department'. */
  recipient?: Maybe<Scalars['String']['output']>;
  /**
   * The date and time (in [ISO 8601 format](http://en.wikipedia.org/wiki/ISO_8601))
   * when the company address was last updated.
   */
  updatedAt: Scalars['DateTime']['output'];
  /** The zip or postal code of the address. */
  zip?: Maybe<Scalars['String']['output']>;
  /** The alphanumeric code for the region, for example, ON. */
  zoneCode?: Maybe<Scalars['String']['output']>;
};


/** The address of a company location, either billing or shipping. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CompanyAddressFormattedArgs = {
  withCompanyName?: InputMaybe<Scalars['Boolean']['input']>;
  withName?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The address of a company location, either billing or shipping. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CompanyAddressFormattedAddressArgs = {
  withCompanyName?: InputMaybe<Scalars['Boolean']['input']>;
  withName?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The input fields for creating or updating a company location address. */
export type CompanyAddressInput = {
  /** The first line of the address, typically the street address or PO Box number. */
  address1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the address, typically the number of the apartment, suite, or unit. */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The name of the city, district, village, or town. */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The two-letter code for the country of the address. */
  countryCode?: InputMaybe<CountryCode>;
  /** The first name in the address. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The last name in the address. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** A unique phone number for the business location, formatted using the E.164 standard, for example, _+16135551111_. */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** The identity of the recipient, for example, 'Receiving Department'. */
  recipient?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code of the address. */
  zip?: InputMaybe<Scalars['String']['input']>;
  /** The code for the region of the address, such as the province, state, or district, for example, QC for Quebec, Canada. */
  zoneCode?: InputMaybe<Scalars['String']['input']>;
};

/** The valid values for the address type of a company. */
export const CompanyAddressType = {
  /** The address is a billing address. */
  Billing: 'BILLING',
  /** The address is a shipping address. */
  Shipping: 'SHIPPING'
} as const;

export type CompanyAddressType = typeof CompanyAddressType[keyof typeof CompanyAddressType];
/** Represents the customer's contact information. */
export type CompanyContact = Node & {
  __typename?: 'CompanyContact';
  /** The information of the copmany contact's company. */
  company?: Maybe<Company>;
  /** The customer associated to this contact. */
  customer: Customer;
  /** The list of company contact's draft orders. */
  draftOrders: DraftOrderConnection;
  /** Whether the company contact has permissions on locations in the scope. */
  hasPermissionOnLocations: Scalars['Boolean']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The list of locations that the company contact belongs to. */
  locations: CompanyLocationConnection;
  /** The list of company contact's orders. */
  orders: OrderConnection;
  /** The current status of the company contact. */
  status: CompanyContactStatusType;
  /** The list of tax exemptions applied to the company contact with additional details. */
  taxExemptionsDetails: Array<TaxExemptionDetails>;
  /** The job title of the company contact. */
  title?: Maybe<Scalars['String']['output']>;
};


/** Represents the customer's contact information. */
export type CompanyContactDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<DraftOrderSortKeys>;
};


/** Represents the customer's contact information. */
export type CompanyContactHasPermissionOnLocationsArgs = {
  permissions: Array<PermittedOperation>;
  resource: ResourceType;
  scope: ContactPermissionLocationScopeType;
};


/** Represents the customer's contact information. */
export type CompanyContactLocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<CompanyLocationSortKeys>;
};


/** Represents the customer's contact information. */
export type CompanyContactOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<OrderByContactSortKeys>;
};

/** An auto-generated type for paginating through multiple CompanyContacts. */
export type CompanyContactConnection = {
  __typename?: 'CompanyContactConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CompanyContactEdge>;
  /** A list of nodes that are contained in CompanyContactEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CompanyContact>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CompanyContact and a cursor during pagination. */
export type CompanyContactEdge = {
  __typename?: 'CompanyContactEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CompanyContactEdge. */
  node: CompanyContact;
};

/** A role for a company contact. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CompanyContactRole = Node & {
  __typename?: 'CompanyContactRole';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The name of the role. */
  name: Scalars['String']['output'];
  /** The permissions on a specified resource. */
  resourcePermission: Array<PermittedOperation>;
  /** A list of permissions on all resources. */
  resourcePermissions: Array<ResourcePermission>;
};


/** A role for a company contact. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CompanyContactRoleResourcePermissionArgs = {
  resource: ResourceType;
};

/** Represents information about a company contact role assignment. */
export type CompanyContactRoleAssignment = Node & {
  __typename?: 'CompanyContactRoleAssignment';
  /** The company contact for whom this role is assigned. */
  contact: CompanyContact;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The role that's assigned. */
  role: CompanyContactRole;
};

/** An auto-generated type for paginating through multiple CompanyContactRoleAssignments. */
export type CompanyContactRoleAssignmentConnection = {
  __typename?: 'CompanyContactRoleAssignmentConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CompanyContactRoleAssignmentEdge>;
  /** A list of nodes that are contained in CompanyContactRoleAssignmentEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CompanyContactRoleAssignment>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CompanyContactRoleAssignment and a cursor during pagination. */
export type CompanyContactRoleAssignmentEdge = {
  __typename?: 'CompanyContactRoleAssignmentEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CompanyContactRoleAssignmentEdge. */
  node: CompanyContactRoleAssignment;
};

/** The set of valid sort keys for the CompanyContactRoleAssignment query. */
export const CompanyContactRoleAssignmentSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `location_name` value. */
  LocationName: 'LOCATION_NAME',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type CompanyContactRoleAssignmentSortKeys = typeof CompanyContactRoleAssignmentSortKeys[keyof typeof CompanyContactRoleAssignmentSortKeys];
/** The set of valid sort keys for the CompanyContact query. */
export const CompanyContactSortKeys = {
  /** Sort by the `company_id` value. */
  CompanyId: 'COMPANY_ID',
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `email` value. */
  Email: 'EMAIL',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `name` value. */
  Name: 'NAME',
  /** Sort by the `name_email` value. */
  NameEmail: 'NAME_EMAIL',
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   */
  Relevance: 'RELEVANCE',
  /** Sort by the `title` value. */
  Title: 'TITLE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type CompanyContactSortKeys = typeof CompanyContactSortKeys[keyof typeof CompanyContactSortKeys];
/** A flag to describe the current status of a company contact. */
export const CompanyContactStatusType = {
  /** The contact is disabled and removed from the company. */
  Disabled: 'DISABLED',
  /** The contact is enabled and active. */
  Enabled: 'ENABLED'
} as const;

export type CompanyContactStatusType = typeof CompanyContactStatusType[keyof typeof CompanyContactStatusType];
/** Represents a company's business location. */
export type CompanyLocation = HasMetafields & HasStoreCreditAccounts & Node & {
  __typename?: 'CompanyLocation';
  /** The list of all available payment methods that can be used for recurring and future payments. */
  availablePaymentMethods: Array<PaymentMethod>;
  /** The billing address of the company location. */
  billingAddress?: Maybe<CompanyAddress>;
  /** The configuration of the buyer's B2B checkout. */
  buyerExperienceConfiguration?: Maybe<BuyerExperienceConfiguration>;
  /** The list of contacts under a particular business location. */
  contacts: CompanyContactConnection;
  /** The credit card corresponding to the provided ID. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** The list of stored credit cards. */
  creditCards: CustomerCreditCardConnection;
  /** The list of company draft orders. */
  draftOrders: DraftOrderConnection;
  /** A unique externally-supplied ID for the location. */
  externalId?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /**
   * The market that includes the location's shipping address. If the shipping address is empty, the shop's primary market is returned.
   * @deprecated This `market` field will be removed in a future version of the API.
   */
  market: Market;
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
  /** The name of the company location. */
  name: Scalars['String']['output'];
  /** The list of customer orders under the company. */
  orders: OrderConnection;
  /** The payment instrument corresponding to the provided ID. */
  paymentInstrument?: Maybe<PaymentInstrument>;
  /** The list of stored payment instruments. */
  paymentInstruments: PaymentInstrumentConnection;
  /** The list of roles assigned to this location. */
  roleAssignments: CompanyContactRoleAssignmentConnection;
  /** The shipping address of the company location. */
  shippingAddress?: Maybe<CompanyAddress>;
  /** A list of the owner resource's store credit accounts. Store credit accounts are not shown for shops with store credit disabled at checkout. */
  storeCreditAccounts: StoreCreditAccountConnection;
  /** The list of tax exemptions applied to the location. */
  taxExemptions: Array<TaxExemption>;
  /** The list of tax exemptions applied to the location with additional details. */
  taxExemptionsDetails: Array<TaxExemptionDetails>;
  /** The tax id of the company location. */
  taxIdentifier?: Maybe<Scalars['String']['output']>;
};


/** Represents a company's business location. */
export type CompanyLocationContactsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<CompanyContactSortKeys>;
};


/** Represents a company's business location. */
export type CompanyLocationCreditCardArgs = {
  id: Scalars['ID']['input'];
};


/** Represents a company's business location. */
export type CompanyLocationCreditCardsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents a company's business location. */
export type CompanyLocationDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<DraftOrderByLocationSortKeys>;
};


/** Represents a company's business location. */
export type CompanyLocationMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** Represents a company's business location. */
export type CompanyLocationMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};


/** Represents a company's business location. */
export type CompanyLocationOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<OrderByLocationSortKeys>;
};


/** Represents a company's business location. */
export type CompanyLocationPaymentInstrumentArgs = {
  id: Scalars['ID']['input'];
};


/** Represents a company's business location. */
export type CompanyLocationPaymentInstrumentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents a company's business location. */
export type CompanyLocationRoleAssignmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<CompanyContactRoleAssignmentSortKeys>;
};


/** Represents a company's business location. */
export type CompanyLocationStoreCreditAccountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `companyLocationAssignAddress` mutation. */
export type CompanyLocationAssignAddressPayload = {
  __typename?: 'CompanyLocationAssignAddressPayload';
  /** The list of updated addresses on the company location. */
  addresses?: Maybe<Array<CompanyAddress>>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<BusinessCustomerUserError>;
};

/** An auto-generated type for paginating through multiple CompanyLocations. */
export type CompanyLocationConnection = {
  __typename?: 'CompanyLocationConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CompanyLocationEdge>;
  /** A list of nodes that are contained in CompanyLocationEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CompanyLocation>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CompanyLocation and a cursor during pagination. */
export type CompanyLocationEdge = {
  __typename?: 'CompanyLocationEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CompanyLocationEdge. */
  node: CompanyLocation;
};

/** The set of valid sort keys for the CompanyLocation query. */
export const CompanyLocationSortKeys = {
  /** Sort by the `company_and_location_name` value. */
  CompanyAndLocationName: 'COMPANY_AND_LOCATION_NAME',
  /** Sort by the `company_id` value. */
  CompanyId: 'COMPANY_ID',
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `name` value. */
  Name: 'NAME',
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   */
  Relevance: 'RELEVANCE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type CompanyLocationSortKeys = typeof CompanyLocationSortKeys[keyof typeof CompanyLocationSortKeys];
/** Defines the extent of locations for which a contact holds permissions on a resource. */
export const ContactPermissionLocationScopeType = {
  /** The contact has permission on all locations. */
  All: 'ALL',
  /** The contact has permission for at least one location. */
  Any: 'ANY',
  /** The contact has no permission on any location. */
  None: 'NONE',
  /** The contact has permission on only one location. */
  One: 'ONE'
} as const;

export type ContactPermissionLocationScopeType = typeof ContactPermissionLocationScopeType[keyof typeof ContactPermissionLocationScopeType];
/** A numeric count with precision information indicating whether the count is exact or an estimate. */
export type Count = {
  __typename?: 'Count';
  /** The count of elements. */
  count: Scalars['Int']['output'];
  /** The count's precision, or the exactness of the value. */
  precision: CountPrecision;
};

/** The precision of the value returned by a count field. */
export const CountPrecision = {
  /** The count is at least the value. A limit was imposed and reached. */
  AtLeast: 'AT_LEAST',
  /** The count is exactly the value. A write may not be reflected instantaneously. */
  Exact: 'EXACT'
} as const;

export type CountPrecision = typeof CountPrecision[keyof typeof CountPrecision];
/**
 * The code designating a country/region, which generally follows ISO 3166-1 alpha-2 guidelines.
 * If a territory doesn't have a country code value in the `CountryCode` enum, then it might be considered a subdivision
 * of another country. For example, the territories associated with Spain are represented by the country code `ES`,
 * and the territories associated with the United States of America are represented by the country code `US`.
 */
export const CountryCode = {
  /** Ascension Island. */
  Ac: 'AC',
  /** Andorra. */
  Ad: 'AD',
  /** United Arab Emirates. */
  Ae: 'AE',
  /** Afghanistan. */
  Af: 'AF',
  /** Antigua & Barbuda. */
  Ag: 'AG',
  /** Anguilla. */
  Ai: 'AI',
  /** Albania. */
  Al: 'AL',
  /** Armenia. */
  Am: 'AM',
  /** Netherlands Antilles. */
  An: 'AN',
  /** Angola. */
  Ao: 'AO',
  /** Argentina. */
  Ar: 'AR',
  /** Austria. */
  At: 'AT',
  /** Australia. */
  Au: 'AU',
  /** Aruba. */
  Aw: 'AW',
  /** Åland Islands. */
  Ax: 'AX',
  /** Azerbaijan. */
  Az: 'AZ',
  /** Bosnia & Herzegovina. */
  Ba: 'BA',
  /** Barbados. */
  Bb: 'BB',
  /** Bangladesh. */
  Bd: 'BD',
  /** Belgium. */
  Be: 'BE',
  /** Burkina Faso. */
  Bf: 'BF',
  /** Bulgaria. */
  Bg: 'BG',
  /** Bahrain. */
  Bh: 'BH',
  /** Burundi. */
  Bi: 'BI',
  /** Benin. */
  Bj: 'BJ',
  /** St. Barthélemy. */
  Bl: 'BL',
  /** Bermuda. */
  Bm: 'BM',
  /** Brunei. */
  Bn: 'BN',
  /** Bolivia. */
  Bo: 'BO',
  /** Caribbean Netherlands. */
  Bq: 'BQ',
  /** Brazil. */
  Br: 'BR',
  /** Bahamas. */
  Bs: 'BS',
  /** Bhutan. */
  Bt: 'BT',
  /** Bouvet Island. */
  Bv: 'BV',
  /** Botswana. */
  Bw: 'BW',
  /** Belarus. */
  By: 'BY',
  /** Belize. */
  Bz: 'BZ',
  /** Canada. */
  Ca: 'CA',
  /** Cocos (Keeling) Islands. */
  Cc: 'CC',
  /** Congo - Kinshasa. */
  Cd: 'CD',
  /** Central African Republic. */
  Cf: 'CF',
  /** Congo - Brazzaville. */
  Cg: 'CG',
  /** Switzerland. */
  Ch: 'CH',
  /** Côte d’Ivoire. */
  Ci: 'CI',
  /** Cook Islands. */
  Ck: 'CK',
  /** Chile. */
  Cl: 'CL',
  /** Cameroon. */
  Cm: 'CM',
  /** China. */
  Cn: 'CN',
  /** Colombia. */
  Co: 'CO',
  /** Costa Rica. */
  Cr: 'CR',
  /** Cuba. */
  Cu: 'CU',
  /** Cape Verde. */
  Cv: 'CV',
  /** Curaçao. */
  Cw: 'CW',
  /** Christmas Island. */
  Cx: 'CX',
  /** Cyprus. */
  Cy: 'CY',
  /** Czechia. */
  Cz: 'CZ',
  /** Germany. */
  De: 'DE',
  /** Djibouti. */
  Dj: 'DJ',
  /** Denmark. */
  Dk: 'DK',
  /** Dominica. */
  Dm: 'DM',
  /** Dominican Republic. */
  Do: 'DO',
  /** Algeria. */
  Dz: 'DZ',
  /** Ecuador. */
  Ec: 'EC',
  /** Estonia. */
  Ee: 'EE',
  /** Egypt. */
  Eg: 'EG',
  /** Western Sahara. */
  Eh: 'EH',
  /** Eritrea. */
  Er: 'ER',
  /** Spain. */
  Es: 'ES',
  /** Ethiopia. */
  Et: 'ET',
  /** Finland. */
  Fi: 'FI',
  /** Fiji. */
  Fj: 'FJ',
  /** Falkland Islands. */
  Fk: 'FK',
  /** Faroe Islands. */
  Fo: 'FO',
  /** France. */
  Fr: 'FR',
  /** Gabon. */
  Ga: 'GA',
  /** United Kingdom. */
  Gb: 'GB',
  /** Grenada. */
  Gd: 'GD',
  /** Georgia. */
  Ge: 'GE',
  /** French Guiana. */
  Gf: 'GF',
  /** Guernsey. */
  Gg: 'GG',
  /** Ghana. */
  Gh: 'GH',
  /** Gibraltar. */
  Gi: 'GI',
  /** Greenland. */
  Gl: 'GL',
  /** Gambia. */
  Gm: 'GM',
  /** Guinea. */
  Gn: 'GN',
  /** Guadeloupe. */
  Gp: 'GP',
  /** Equatorial Guinea. */
  Gq: 'GQ',
  /** Greece. */
  Gr: 'GR',
  /** South Georgia & South Sandwich Islands. */
  Gs: 'GS',
  /** Guatemala. */
  Gt: 'GT',
  /** Guinea-Bissau. */
  Gw: 'GW',
  /** Guyana. */
  Gy: 'GY',
  /** Hong Kong SAR. */
  Hk: 'HK',
  /** Heard & McDonald Islands. */
  Hm: 'HM',
  /** Honduras. */
  Hn: 'HN',
  /** Croatia. */
  Hr: 'HR',
  /** Haiti. */
  Ht: 'HT',
  /** Hungary. */
  Hu: 'HU',
  /** Indonesia. */
  Id: 'ID',
  /** Ireland. */
  Ie: 'IE',
  /** Israel. */
  Il: 'IL',
  /** Isle of Man. */
  Im: 'IM',
  /** India. */
  In: 'IN',
  /** British Indian Ocean Territory. */
  Io: 'IO',
  /** Iraq. */
  Iq: 'IQ',
  /** Iran. */
  Ir: 'IR',
  /** Iceland. */
  Is: 'IS',
  /** Italy. */
  It: 'IT',
  /** Jersey. */
  Je: 'JE',
  /** Jamaica. */
  Jm: 'JM',
  /** Jordan. */
  Jo: 'JO',
  /** Japan. */
  Jp: 'JP',
  /** Kenya. */
  Ke: 'KE',
  /** Kyrgyzstan. */
  Kg: 'KG',
  /** Cambodia. */
  Kh: 'KH',
  /** Kiribati. */
  Ki: 'KI',
  /** Comoros. */
  Km: 'KM',
  /** St. Kitts & Nevis. */
  Kn: 'KN',
  /** North Korea. */
  Kp: 'KP',
  /** South Korea. */
  Kr: 'KR',
  /** Kuwait. */
  Kw: 'KW',
  /** Cayman Islands. */
  Ky: 'KY',
  /** Kazakhstan. */
  Kz: 'KZ',
  /** Laos. */
  La: 'LA',
  /** Lebanon. */
  Lb: 'LB',
  /** St. Lucia. */
  Lc: 'LC',
  /** Liechtenstein. */
  Li: 'LI',
  /** Sri Lanka. */
  Lk: 'LK',
  /** Liberia. */
  Lr: 'LR',
  /** Lesotho. */
  Ls: 'LS',
  /** Lithuania. */
  Lt: 'LT',
  /** Luxembourg. */
  Lu: 'LU',
  /** Latvia. */
  Lv: 'LV',
  /** Libya. */
  Ly: 'LY',
  /** Morocco. */
  Ma: 'MA',
  /** Monaco. */
  Mc: 'MC',
  /** Moldova. */
  Md: 'MD',
  /** Montenegro. */
  Me: 'ME',
  /** St. Martin. */
  Mf: 'MF',
  /** Madagascar. */
  Mg: 'MG',
  /** North Macedonia. */
  Mk: 'MK',
  /** Mali. */
  Ml: 'ML',
  /** Myanmar (Burma). */
  Mm: 'MM',
  /** Mongolia. */
  Mn: 'MN',
  /** Macao SAR. */
  Mo: 'MO',
  /** Martinique. */
  Mq: 'MQ',
  /** Mauritania. */
  Mr: 'MR',
  /** Montserrat. */
  Ms: 'MS',
  /** Malta. */
  Mt: 'MT',
  /** Mauritius. */
  Mu: 'MU',
  /** Maldives. */
  Mv: 'MV',
  /** Malawi. */
  Mw: 'MW',
  /** Mexico. */
  Mx: 'MX',
  /** Malaysia. */
  My: 'MY',
  /** Mozambique. */
  Mz: 'MZ',
  /** Namibia. */
  Na: 'NA',
  /** New Caledonia. */
  Nc: 'NC',
  /** Niger. */
  Ne: 'NE',
  /** Norfolk Island. */
  Nf: 'NF',
  /** Nigeria. */
  Ng: 'NG',
  /** Nicaragua. */
  Ni: 'NI',
  /** Netherlands. */
  Nl: 'NL',
  /** Norway. */
  No: 'NO',
  /** Nepal. */
  Np: 'NP',
  /** Nauru. */
  Nr: 'NR',
  /** Niue. */
  Nu: 'NU',
  /** New Zealand. */
  Nz: 'NZ',
  /** Oman. */
  Om: 'OM',
  /** Panama. */
  Pa: 'PA',
  /** Peru. */
  Pe: 'PE',
  /** French Polynesia. */
  Pf: 'PF',
  /** Papua New Guinea. */
  Pg: 'PG',
  /** Philippines. */
  Ph: 'PH',
  /** Pakistan. */
  Pk: 'PK',
  /** Poland. */
  Pl: 'PL',
  /** St. Pierre & Miquelon. */
  Pm: 'PM',
  /** Pitcairn Islands. */
  Pn: 'PN',
  /** Palestinian Territories. */
  Ps: 'PS',
  /** Portugal. */
  Pt: 'PT',
  /** Paraguay. */
  Py: 'PY',
  /** Qatar. */
  Qa: 'QA',
  /** Réunion. */
  Re: 'RE',
  /** Romania. */
  Ro: 'RO',
  /** Serbia. */
  Rs: 'RS',
  /** Russia. */
  Ru: 'RU',
  /** Rwanda. */
  Rw: 'RW',
  /** Saudi Arabia. */
  Sa: 'SA',
  /** Solomon Islands. */
  Sb: 'SB',
  /** Seychelles. */
  Sc: 'SC',
  /** Sudan. */
  Sd: 'SD',
  /** Sweden. */
  Se: 'SE',
  /** Singapore. */
  Sg: 'SG',
  /** St. Helena. */
  Sh: 'SH',
  /** Slovenia. */
  Si: 'SI',
  /** Svalbard & Jan Mayen. */
  Sj: 'SJ',
  /** Slovakia. */
  Sk: 'SK',
  /** Sierra Leone. */
  Sl: 'SL',
  /** San Marino. */
  Sm: 'SM',
  /** Senegal. */
  Sn: 'SN',
  /** Somalia. */
  So: 'SO',
  /** Suriname. */
  Sr: 'SR',
  /** South Sudan. */
  Ss: 'SS',
  /** São Tomé & Príncipe. */
  St: 'ST',
  /** El Salvador. */
  Sv: 'SV',
  /** Sint Maarten. */
  Sx: 'SX',
  /** Syria. */
  Sy: 'SY',
  /** Eswatini. */
  Sz: 'SZ',
  /** Tristan da Cunha. */
  Ta: 'TA',
  /** Turks & Caicos Islands. */
  Tc: 'TC',
  /** Chad. */
  Td: 'TD',
  /** French Southern Territories. */
  Tf: 'TF',
  /** Togo. */
  Tg: 'TG',
  /** Thailand. */
  Th: 'TH',
  /** Tajikistan. */
  Tj: 'TJ',
  /** Tokelau. */
  Tk: 'TK',
  /** Timor-Leste. */
  Tl: 'TL',
  /** Turkmenistan. */
  Tm: 'TM',
  /** Tunisia. */
  Tn: 'TN',
  /** Tonga. */
  To: 'TO',
  /** Türkiye. */
  Tr: 'TR',
  /** Trinidad & Tobago. */
  Tt: 'TT',
  /** Tuvalu. */
  Tv: 'TV',
  /** Taiwan. */
  Tw: 'TW',
  /** Tanzania. */
  Tz: 'TZ',
  /** Ukraine. */
  Ua: 'UA',
  /** Uganda. */
  Ug: 'UG',
  /** U.S. Outlying Islands. */
  Um: 'UM',
  /** United States. */
  Us: 'US',
  /** Uruguay. */
  Uy: 'UY',
  /** Uzbekistan. */
  Uz: 'UZ',
  /** Vatican City. */
  Va: 'VA',
  /** St. Vincent & Grenadines. */
  Vc: 'VC',
  /** Venezuela. */
  Ve: 'VE',
  /** British Virgin Islands. */
  Vg: 'VG',
  /** Vietnam. */
  Vn: 'VN',
  /** Vanuatu. */
  Vu: 'VU',
  /** Wallis & Futuna. */
  Wf: 'WF',
  /** Samoa. */
  Ws: 'WS',
  /** Kosovo. */
  Xk: 'XK',
  /** Yemen. */
  Ye: 'YE',
  /** Mayotte. */
  Yt: 'YT',
  /** South Africa. */
  Za: 'ZA',
  /** Zambia. */
  Zm: 'ZM',
  /** Zimbabwe. */
  Zw: 'ZW',
  /** Unknown Region. */
  Zz: 'ZZ'
} as const;

export type CountryCode = typeof CountryCode[keyof typeof CountryCode];
/** Return type for `creditCardAdd` mutation. */
export type CreditCardAddPayload = {
  __typename?: 'CreditCardAddPayload';
  /** The newly added credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** The URL to which the customer should be redirected to complete the 3D Secure payment flow. */
  nextActionUrl?: Maybe<Scalars['URL']['output']>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `creditCardUpdate` mutation. */
export type CreditCardUpdatePayload = {
  __typename?: 'CreditCardUpdatePayload';
  /** The updated credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, `credit_card` will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** The part of the image that should remain after cropping. */
export const CropRegion = {
  /** Keep the bottom of the image. */
  Bottom: 'BOTTOM',
  /** Keep the center of the image. */
  Center: 'CENTER',
  /** Keep the left of the image. */
  Left: 'LEFT',
  /** Keep the right of the image. */
  Right: 'RIGHT',
  /** Keep the top of the image. */
  Top: 'TOP'
} as const;

export type CropRegion = typeof CropRegion[keyof typeof CropRegion];
/**
 * The currency codes that represent the world currencies throughout the Admin API. Currency codes include
 * [standard ISO 4217 codes](https://en.wikipedia.org/wiki/ISO_4217), legacy codes, non-standard codes,
 * digital currency codes.
 */
export const CurrencyCode = {
  /** United Arab Emirates Dirham (AED). */
  Aed: 'AED',
  /** Afghan Afghani (AFN). */
  Afn: 'AFN',
  /** Albanian Lek (ALL). */
  All: 'ALL',
  /** Armenian Dram (AMD). */
  Amd: 'AMD',
  /** Netherlands Antillean Guilder. */
  Ang: 'ANG',
  /** Angolan Kwanza (AOA). */
  Aoa: 'AOA',
  /** Argentine Pesos (ARS). */
  Ars: 'ARS',
  /** Australian Dollars (AUD). */
  Aud: 'AUD',
  /** Aruban Florin (AWG). */
  Awg: 'AWG',
  /** Azerbaijani Manat (AZN). */
  Azn: 'AZN',
  /** Bosnia and Herzegovina Convertible Mark (BAM). */
  Bam: 'BAM',
  /** Barbadian Dollar (BBD). */
  Bbd: 'BBD',
  /** Bangladesh Taka (BDT). */
  Bdt: 'BDT',
  /** Bulgarian Lev (BGN). */
  Bgn: 'BGN',
  /** Bahraini Dinar (BHD). */
  Bhd: 'BHD',
  /** Burundian Franc (BIF). */
  Bif: 'BIF',
  /** Bermudian Dollar (BMD). */
  Bmd: 'BMD',
  /** Brunei Dollar (BND). */
  Bnd: 'BND',
  /** Bolivian Boliviano (BOB). */
  Bob: 'BOB',
  /** Brazilian Real (BRL). */
  Brl: 'BRL',
  /** Bahamian Dollar (BSD). */
  Bsd: 'BSD',
  /** Bhutanese Ngultrum (BTN). */
  Btn: 'BTN',
  /** Botswana Pula (BWP). */
  Bwp: 'BWP',
  /** Belarusian Ruble (BYN). */
  Byn: 'BYN',
  /** Belarusian Ruble (BYR). */
  Byr: 'BYR',
  /** Belize Dollar (BZD). */
  Bzd: 'BZD',
  /** Canadian Dollars (CAD). */
  Cad: 'CAD',
  /** Congolese franc (CDF). */
  Cdf: 'CDF',
  /** Swiss Francs (CHF). */
  Chf: 'CHF',
  /** Chilean Peso (CLP). */
  Clp: 'CLP',
  /** Chinese Yuan Renminbi (CNY). */
  Cny: 'CNY',
  /** Colombian Peso (COP). */
  Cop: 'COP',
  /** Costa Rican Colones (CRC). */
  Crc: 'CRC',
  /** Cape Verdean escudo (CVE). */
  Cve: 'CVE',
  /** Czech Koruny (CZK). */
  Czk: 'CZK',
  /** Djiboutian Franc (DJF). */
  Djf: 'DJF',
  /** Danish Kroner (DKK). */
  Dkk: 'DKK',
  /** Dominican Peso (DOP). */
  Dop: 'DOP',
  /** Algerian Dinar (DZD). */
  Dzd: 'DZD',
  /** Egyptian Pound (EGP). */
  Egp: 'EGP',
  /** Eritrean Nakfa (ERN). */
  Ern: 'ERN',
  /** Ethiopian Birr (ETB). */
  Etb: 'ETB',
  /** Euro (EUR). */
  Eur: 'EUR',
  /** Fijian Dollars (FJD). */
  Fjd: 'FJD',
  /** Falkland Islands Pounds (FKP). */
  Fkp: 'FKP',
  /** United Kingdom Pounds (GBP). */
  Gbp: 'GBP',
  /** Georgian Lari (GEL). */
  Gel: 'GEL',
  /** Ghanaian Cedi (GHS). */
  Ghs: 'GHS',
  /** Gibraltar Pounds (GIP). */
  Gip: 'GIP',
  /** Gambian Dalasi (GMD). */
  Gmd: 'GMD',
  /** Guinean Franc (GNF). */
  Gnf: 'GNF',
  /** Guatemalan Quetzal (GTQ). */
  Gtq: 'GTQ',
  /** Guyanese Dollar (GYD). */
  Gyd: 'GYD',
  /** Hong Kong Dollars (HKD). */
  Hkd: 'HKD',
  /** Honduran Lempira (HNL). */
  Hnl: 'HNL',
  /** Croatian Kuna (HRK). */
  Hrk: 'HRK',
  /** Haitian Gourde (HTG). */
  Htg: 'HTG',
  /** Hungarian Forint (HUF). */
  Huf: 'HUF',
  /** Indonesian Rupiah (IDR). */
  Idr: 'IDR',
  /** Israeli New Shekel (NIS). */
  Ils: 'ILS',
  /** Indian Rupees (INR). */
  Inr: 'INR',
  /** Iraqi Dinar (IQD). */
  Iqd: 'IQD',
  /** Iranian Rial (IRR). */
  Irr: 'IRR',
  /** Icelandic Kronur (ISK). */
  Isk: 'ISK',
  /** Jersey Pound. */
  Jep: 'JEP',
  /** Jamaican Dollars (JMD). */
  Jmd: 'JMD',
  /** Jordanian Dinar (JOD). */
  Jod: 'JOD',
  /** Japanese Yen (JPY). */
  Jpy: 'JPY',
  /** Kenyan Shilling (KES). */
  Kes: 'KES',
  /** Kyrgyzstani Som (KGS). */
  Kgs: 'KGS',
  /** Cambodian Riel. */
  Khr: 'KHR',
  /** Kiribati Dollar (KID). */
  Kid: 'KID',
  /** Comorian Franc (KMF). */
  Kmf: 'KMF',
  /** South Korean Won (KRW). */
  Krw: 'KRW',
  /** Kuwaiti Dinar (KWD). */
  Kwd: 'KWD',
  /** Cayman Dollars (KYD). */
  Kyd: 'KYD',
  /** Kazakhstani Tenge (KZT). */
  Kzt: 'KZT',
  /** Laotian Kip (LAK). */
  Lak: 'LAK',
  /** Lebanese Pounds (LBP). */
  Lbp: 'LBP',
  /** Sri Lankan Rupees (LKR). */
  Lkr: 'LKR',
  /** Liberian Dollar (LRD). */
  Lrd: 'LRD',
  /** Lesotho Loti (LSL). */
  Lsl: 'LSL',
  /** Lithuanian Litai (LTL). */
  Ltl: 'LTL',
  /** Latvian Lati (LVL). */
  Lvl: 'LVL',
  /** Libyan Dinar (LYD). */
  Lyd: 'LYD',
  /** Moroccan Dirham. */
  Mad: 'MAD',
  /** Moldovan Leu (MDL). */
  Mdl: 'MDL',
  /** Malagasy Ariary (MGA). */
  Mga: 'MGA',
  /** Macedonia Denar (MKD). */
  Mkd: 'MKD',
  /** Burmese Kyat (MMK). */
  Mmk: 'MMK',
  /** Mongolian Tugrik. */
  Mnt: 'MNT',
  /** Macanese Pataca (MOP). */
  Mop: 'MOP',
  /** Mauritanian Ouguiya (MRU). */
  Mru: 'MRU',
  /** Mauritian Rupee (MUR). */
  Mur: 'MUR',
  /** Maldivian Rufiyaa (MVR). */
  Mvr: 'MVR',
  /** Malawian Kwacha (MWK). */
  Mwk: 'MWK',
  /** Mexican Pesos (MXN). */
  Mxn: 'MXN',
  /** Malaysian Ringgits (MYR). */
  Myr: 'MYR',
  /** Mozambican Metical. */
  Mzn: 'MZN',
  /** Namibian Dollar. */
  Nad: 'NAD',
  /** Nigerian Naira (NGN). */
  Ngn: 'NGN',
  /** Nicaraguan Córdoba (NIO). */
  Nio: 'NIO',
  /** Norwegian Kroner (NOK). */
  Nok: 'NOK',
  /** Nepalese Rupee (NPR). */
  Npr: 'NPR',
  /** New Zealand Dollars (NZD). */
  Nzd: 'NZD',
  /** Omani Rial (OMR). */
  Omr: 'OMR',
  /** Panamian Balboa (PAB). */
  Pab: 'PAB',
  /** Peruvian Nuevo Sol (PEN). */
  Pen: 'PEN',
  /** Papua New Guinean Kina (PGK). */
  Pgk: 'PGK',
  /** Philippine Peso (PHP). */
  Php: 'PHP',
  /** Pakistani Rupee (PKR). */
  Pkr: 'PKR',
  /** Polish Zlotych (PLN). */
  Pln: 'PLN',
  /** Paraguayan Guarani (PYG). */
  Pyg: 'PYG',
  /** Qatari Rial (QAR). */
  Qar: 'QAR',
  /** Romanian Lei (RON). */
  Ron: 'RON',
  /** Serbian dinar (RSD). */
  Rsd: 'RSD',
  /** Russian Rubles (RUB). */
  Rub: 'RUB',
  /** Rwandan Franc (RWF). */
  Rwf: 'RWF',
  /** Saudi Riyal (SAR). */
  Sar: 'SAR',
  /** Solomon Islands Dollar (SBD). */
  Sbd: 'SBD',
  /** Seychellois Rupee (SCR). */
  Scr: 'SCR',
  /** Sudanese Pound (SDG). */
  Sdg: 'SDG',
  /** Swedish Kronor (SEK). */
  Sek: 'SEK',
  /** Singapore Dollars (SGD). */
  Sgd: 'SGD',
  /** Saint Helena Pounds (SHP). */
  Shp: 'SHP',
  /** Sierra Leonean Leone (SLL). */
  Sll: 'SLL',
  /** Somali Shilling (SOS). */
  Sos: 'SOS',
  /** Surinamese Dollar (SRD). */
  Srd: 'SRD',
  /** South Sudanese Pound (SSP). */
  Ssp: 'SSP',
  /** Sao Tome And Principe Dobra (STD). */
  Std: 'STD',
  /** Sao Tome And Principe Dobra (STN). */
  Stn: 'STN',
  /** Syrian Pound (SYP). */
  Syp: 'SYP',
  /** Swazi Lilangeni (SZL). */
  Szl: 'SZL',
  /** Thai baht (THB). */
  Thb: 'THB',
  /** Tajikistani Somoni (TJS). */
  Tjs: 'TJS',
  /** Turkmenistani Manat (TMT). */
  Tmt: 'TMT',
  /** Tunisian Dinar (TND). */
  Tnd: 'TND',
  /** Tongan Pa'anga (TOP). */
  Top: 'TOP',
  /** Turkish Lira (TRY). */
  Try: 'TRY',
  /** Trinidad and Tobago Dollars (TTD). */
  Ttd: 'TTD',
  /** Taiwan Dollars (TWD). */
  Twd: 'TWD',
  /** Tanzanian Shilling (TZS). */
  Tzs: 'TZS',
  /** Ukrainian Hryvnia (UAH). */
  Uah: 'UAH',
  /** Ugandan Shilling (UGX). */
  Ugx: 'UGX',
  /** United States Dollars (USD). */
  Usd: 'USD',
  /** United States Dollars Coin (USDC). */
  Usdc: 'USDC',
  /** Uruguayan Pesos (UYU). */
  Uyu: 'UYU',
  /** Uzbekistan som (UZS). */
  Uzs: 'UZS',
  /** Venezuelan Bolivares (VED). */
  Ved: 'VED',
  /** Venezuelan Bolivares (VEF). */
  Vef: 'VEF',
  /** Venezuelan Bolivares Soberanos (VES). */
  Ves: 'VES',
  /** Vietnamese đồng (VND). */
  Vnd: 'VND',
  /** Vanuatu Vatu (VUV). */
  Vuv: 'VUV',
  /** Samoan Tala (WST). */
  Wst: 'WST',
  /** Central African CFA Franc (XAF). */
  Xaf: 'XAF',
  /** East Caribbean Dollar (XCD). */
  Xcd: 'XCD',
  /** West African CFA franc (XOF). */
  Xof: 'XOF',
  /** CFP Franc (XPF). */
  Xpf: 'XPF',
  /** Unrecognized currency. */
  Xxx: 'XXX',
  /** Yemeni Rial (YER). */
  Yer: 'YER',
  /** South African Rand (ZAR). */
  Zar: 'ZAR',
  /** Zambian Kwacha (ZMW). */
  Zmw: 'ZMW'
} as const;

export type CurrencyCode = typeof CurrencyCode[keyof typeof CurrencyCode];
/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type Customer = HasMetafields & HasStoreCreditAccounts & Node & {
  __typename?: 'Customer';
  /** The addresses associated with the customer. */
  addresses: CustomerAddressConnection;
  /** The list of all available payment methods that can be used for recurring and future payments. */
  availablePaymentMethods: Array<PaymentMethod>;
  /** The list of wallet payment configs for providers that the payment method accepts. */
  availableWalletPaymentConfigs: Array<WalletPaymentConfig>;
  /** The list of contacts the customer is associated with. */
  companyContacts: CompanyContactConnection;
  /** The date and time when the customer was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The date and time when the customer was created. */
  creationDate: Scalars['DateTime']['output'];
  /** A Credit Card resource identified by ID. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** The stored Credit Cards associated with the customer. */
  creditCards: CustomerCreditCardConnection;
  /** The default address of the customer. */
  defaultAddress?: Maybe<CustomerAddress>;
  /** The full name of the customer, based on the first_name and last_name values. If these aren't available, it falls back to the customer's email address, and if that isn't available, the customer's phone number. */
  displayName: Scalars['String']['output'];
  /** The Draft Orders associated with the customer. */
  draftOrders: DraftOrderConnection;
  /** The email address of the customer. */
  emailAddress?: Maybe<CustomerEmailAddress>;
  /** The first name of the customer. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The URL to the avatar image of the customer. */
  imageUrl: Scalars['URL']['output'];
  /** The customer's most recently updated, incomplete checkout. */
  lastIncompleteCheckout?: Maybe<Checkout>;
  /** The last name of the customer. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
  /** The orders associated with the customer. */
  orders: OrderConnection;
  /** The payment instrument corresponding to the provided ID. */
  paymentInstrument?: Maybe<PaymentInstrument>;
  /** The list of stored payment instruments. */
  paymentInstruments: PaymentInstrumentConnection;
  /** A PayPal Billing Agreement resource. */
  paypalBillingAgreement?: Maybe<PaypalBillingAgreement>;
  /** The phone number of the customer. */
  phoneNumber?: Maybe<CustomerPhoneNumber>;
  /** A Return identified by ID. */
  return?: Maybe<Return>;
  /** A list of the owner resource's store credit accounts. Store credit accounts are not shown for shops with store credit disabled at checkout. */
  storeCreditAccounts: StoreCreditAccountConnection;
  /** Returns a `SubscriptionContract` resource by ID. */
  subscriptionContract?: Maybe<SubscriptionContract>;
  /** The Subscription Contracts associated with the customer. */
  subscriptionContracts: SubscriptionContractConnection;
  /** A comma-separated list of tags that have been added to the customer. */
  tags: Array<Scalars['String']['output']>;
  /** The list of tax exemptions applied to the customer with additional details. */
  taxExemptionsDetails: Array<TaxExemptionDetails>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerAddressesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  skipDefault?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerCompanyContactsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerCreditCardArgs = {
  id: Scalars['ID']['input'];
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerCreditCardsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<DraftOrderSortKeys>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<OrderSortKeys>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerPaymentInstrumentArgs = {
  id: Scalars['ID']['input'];
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerPaymentInstrumentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerReturnArgs = {
  id: Scalars['ID']['input'];
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerStoreCreditAccountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerSubscriptionContractArgs = {
  id: Scalars['ID']['input'];
};


/** Represents the personal information of a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/**
 * Represents a customer's mailing address.
 * For example, a customer's default address and an order's billing address are both mailing addresses.
 * Apps using the Customer Account API must meet the
 * protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data).
 */
export type CustomerAddress = Node & {
  __typename?: 'CustomerAddress';
  /** The first line of the address. Typically the street address or PO Box number. */
  address1?: Maybe<Scalars['String']['output']>;
  /** The second line of the address. This is typically the apartment, suite, or unit number. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The name of the city, district, village, or town. */
  city?: Maybe<Scalars['String']['output']>;
  /** The name of the customer's company or organization. */
  company?: Maybe<Scalars['String']['output']>;
  /** The name of the country. */
  country?: Maybe<Scalars['String']['output']>;
  /** The first name of the customer. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** A formatted version of the address, customized by the provided arguments. */
  formatted: Array<Scalars['String']['output']>;
  /** A comma-separated list of the values for city, province, and country. */
  formattedArea?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last name of the customer. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The full name of the customer, based on firstName and lastName. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * The customer's unique phone number.
   *
   * Formatted using E.164 standard. For example, _+16135551111_.
   */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** The region of the address, such as the province, state, or district. */
  province?: Maybe<Scalars['String']['output']>;
  /**
   * The two-letter code for the country of the address.
   *
   * For example, US.
   */
  territoryCode?: Maybe<CountryCode>;
  /** The zip or postal code of the address. */
  zip?: Maybe<Scalars['String']['output']>;
  /**
   * The alphanumeric code for the region.
   *
   * For example, ON.
   */
  zoneCode?: Maybe<Scalars['String']['output']>;
};


/**
 * Represents a customer's mailing address.
 * For example, a customer's default address and an order's billing address are both mailing addresses.
 * Apps using the Customer Account API must meet the
 * protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data).
 */
export type CustomerAddressFormattedArgs = {
  withCompany?: InputMaybe<Scalars['Boolean']['input']>;
  withName?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An auto-generated type for paginating through multiple CustomerAddresses. */
export type CustomerAddressConnection = {
  __typename?: 'CustomerAddressConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CustomerAddressEdge>;
  /** A list of nodes that are contained in CustomerAddressEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CustomerAddress>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** Return type for `customerAddressCreate` mutation. */
export type CustomerAddressCreatePayload = {
  __typename?: 'CustomerAddressCreatePayload';
  /** The created customer address. */
  customerAddress?: Maybe<CustomerAddress>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerAddressUserErrors>;
};

/** Return type for `customerAddressDelete` mutation. */
export type CustomerAddressDeletePayload = {
  __typename?: 'CustomerAddressDeletePayload';
  /** The ID of the deleted address. */
  deletedAddressId?: Maybe<Scalars['ID']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerAddressUserErrors>;
};

/** An auto-generated type which holds one CustomerAddress and a cursor during pagination. */
export type CustomerAddressEdge = {
  __typename?: 'CustomerAddressEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CustomerAddressEdge. */
  node: CustomerAddress;
};

/** The input fields to create or update a mailing address. */
export type CustomerAddressInput = {
  /** The first line of the address. Typically the street address or PO Box number. */
  address1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the address. Typically the apartment, suite, or unit number. */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The name of the city, district, village, or town. */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The name of the customer's company or organization. */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The first name of the customer. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The last name of the customer. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The customer's unique phone number, formatted using E.164 standard. For example, _+16135551111_. */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /**
   * The country code, in ISO 3166-1 format. Accepts either a two-letter [alpha-2 code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2),
   * a three-letter [alpha-3 code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3), or a three-digit [numeric code](https://en.wikipedia.org/wiki/ISO_3166-1_numeric).
   * For example, `US`,  `USA`, or `840` represents the United States.
   */
  territoryCode?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code of the address. */
  zip?: InputMaybe<Scalars['String']['input']>;
  /**
   * The alphanumeric code for the region of the address, such as the province, state, or district.
   * For example, 'ON' for Ontario, Canada.
   */
  zoneCode?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `customerAddressUpdate` mutation. */
export type CustomerAddressUpdatePayload = {
  __typename?: 'CustomerAddressUpdatePayload';
  /** The updated address. */
  customerAddress?: Maybe<CustomerAddress>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerAddressUserErrors>;
};

/** The credit card payment instrument. */
export type CustomerCreditCard = Node & PaymentInstrument & {
  __typename?: 'CustomerCreditCard';
  /** The billing address associated with the credit card. */
  billingAddress?: Maybe<PaymentInstrumentBillingAddress>;
  /** The brand of the credit card. */
  brand: Scalars['String']['output'];
  /** Whether the credit card is the default payment method. */
  default: Scalars['Boolean']['output'];
  /** The list of open draft orders associated with this payment instrument. */
  draftOrders: DraftOrderConnection;
  /** Whether the credit card is about to expire. */
  expiresSoon: Scalars['Boolean']['output'];
  /** The expiry month of the credit card. */
  expiryMonth: Scalars['Int']['output'];
  /** The expiry year of the credit card. */
  expiryYear: Scalars['Int']['output'];
  /** The BIN number of the credit card. */
  firstDigits?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last 4 digits of the credit card. */
  lastDigits: Scalars['String']['output'];
  /** The masked credit card number, displaying only the last 4 digits. */
  maskedNumber: Scalars['String']['output'];
  /** The name of the card holder. */
  name: Scalars['String']['output'];
  /** The list of open draft orders of an associated credit card. */
  openDraftOrders: DraftOrderConnection;
  /** The list of pending orders associated with this payment instrument. */
  orders: OrderConnection;
  /** The list of pending orders associated with this credit card. */
  pendingOrders: OrderConnection;
  /** Whether this credit card has permission to be shown at checkout for future purchases. */
  permissionToShowAtCheckout: Scalars['Boolean']['output'];
  /** The list of subscription contracts charged against this credit card. */
  subscriptionContracts: SubscriptionContractConnection;
  /** The last 4 digits of the Device Account Number. */
  virtualLastDigits?: Maybe<Scalars['String']['output']>;
  /** The type of wallet, if the credit card is associated with a wallet. */
  walletType?: Maybe<PaymentInstrumentWalletType>;
};


/** The credit card payment instrument. */
export type CustomerCreditCardDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The credit card payment instrument. */
export type CustomerCreditCardOpenDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The credit card payment instrument. */
export type CustomerCreditCardOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The credit card payment instrument. */
export type CustomerCreditCardPendingOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The credit card payment instrument. */
export type CustomerCreditCardSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/** An auto-generated type for paginating through multiple CustomerCreditCards. */
export type CustomerCreditCardConnection = {
  __typename?: 'CustomerCreditCardConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<CustomerCreditCardEdge>;
  /** A list of nodes that are contained in CustomerCreditCardEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<CustomerCreditCard>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one CustomerCreditCard and a cursor during pagination. */
export type CustomerCreditCardEdge = {
  __typename?: 'CustomerCreditCardEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of CustomerCreditCardEdge. */
  node: CustomerCreditCard;
};

/** An email address associated with a customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerEmailAddress = {
  __typename?: 'CustomerEmailAddress';
  /** The email address of the customer. */
  emailAddress?: Maybe<Scalars['String']['output']>;
  /** The customer's subscription status for email marketing. */
  marketingState: EmailMarketingState;
};

/** Return type for `customerEmailMarketingOptIn` mutation. */
export type CustomerEmailMarketingOptInPayload = {
  __typename?: 'CustomerEmailMarketingOptInPayload';
  /** The customer who was force subscribed to email marketing. */
  customerEmailAddress?: Maybe<CustomerEmailAddress>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerEmailMarketingOptInUserErrors>;
};

/** Return type for `customerEmailMarketingSubscribe` mutation. */
export type CustomerEmailMarketingSubscribePayload = {
  __typename?: 'CustomerEmailMarketingSubscribePayload';
  /** The customer's email address that's subscribed to the email marketing. */
  emailAddress?: Maybe<CustomerEmailAddress>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerEmailMarketingUserErrors>;
};

/** Return type for `customerEmailMarketingUnsubscribe` mutation. */
export type CustomerEmailMarketingUnsubscribePayload = {
  __typename?: 'CustomerEmailMarketingUnsubscribePayload';
  /** The customer's email address that's unsubscribed from the email marketing. */
  emailAddress?: Maybe<CustomerEmailAddress>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerEmailMarketingUserErrors>;
};

/**
 * Represents a customer's mailing address.
 * For example, a customer's default address and an order's billing address are both mailing addresses.
 */
export type CustomerMailingAddress = Node & {
  __typename?: 'CustomerMailingAddress';
  /** The first line of the address. Typically the street address or PO Box number. */
  address1?: Maybe<Scalars['String']['output']>;
  /** The second line of the address. This is typically the apartment, suite, or unit number. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The name of the city, district, village, or town. */
  city?: Maybe<Scalars['String']['output']>;
  /** The name of the customer's company or organization. */
  company?: Maybe<Scalars['String']['output']>;
  /** The name of the country. */
  country?: Maybe<Scalars['String']['output']>;
  /**
   * The two-letter code for the country of the address.
   *
   * For example, US.
   */
  countryCode?: Maybe<Scalars['String']['output']>;
  /**
   * The two-letter code for the country of the address.
   *
   * For example, US.
   */
  countryCodeV2?: Maybe<CountryCode>;
  /** Indicates whether the address is the default address or not. */
  defaultAddress: Scalars['Boolean']['output'];
  /** The first name of the customer. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** A formatted version of the address, customized by the provided arguments. */
  formatted: Array<Scalars['String']['output']>;
  /** A comma-separated list of the values for city, province, and country. */
  formattedArea?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last name of the customer. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The latitude coordinate of the customer's address. */
  latitude?: Maybe<Scalars['Float']['output']>;
  /** The longitude coordinate of the customer's address. */
  longitude?: Maybe<Scalars['Float']['output']>;
  /** The full name of the customer, based on firstName and lastName. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * The customer's unique phone number.
   *
   * Formatted using E.164 standard. For example, _+16135551111_.
   */
  phone?: Maybe<Scalars['String']['output']>;
  /**
   * The customer's unique phone number.
   *
   * Formatted using E.164 standard. For example, _+16135551111_.
   */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** The region of the address, such as the province, state, or district. */
  province?: Maybe<Scalars['String']['output']>;
  /**
   * The alphanumeric code for the region.
   *
   * For example, ON.
   */
  provinceCode?: Maybe<Scalars['String']['output']>;
  /**
   * The two-letter code for the country of the address.
   *
   * For example, US.
   */
  territoryCode?: Maybe<CountryCode>;
  /** Indicates whether the address was geolocated and is a valid address. The field returns `false` if the verification failed, or if the job to verify this address was never started. */
  verified: Scalars['Boolean']['output'];
  /** The zip or postal code of the address. */
  zip?: Maybe<Scalars['String']['output']>;
  /**
   * The alphanumeric code for the region.
   *
   * For example, ON.
   */
  zoneCode?: Maybe<Scalars['String']['output']>;
};


/**
 * Represents a customer's mailing address.
 * For example, a customer's default address and an order's billing address are both mailing addresses.
 */
export type CustomerMailingAddressFormattedArgs = {
  withCompany?: InputMaybe<Scalars['Boolean']['input']>;
  withName?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The input fields to create or update a mailing address. */
export type CustomerMailingAddressInput = {
  /** The first line of the address. Typically the street address or PO Box number. */
  address1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the address. Typically the apartment, suite, or unit number. */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The name of the city, district, village, or town. */
  city?: InputMaybe<Scalars['String']['input']>;
  /** The name of the customer's company or organization. */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The two-letter code for the country of the address. */
  countryCode?: InputMaybe<CountryCode>;
  /** The first name of the customer. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The last name of the customer. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The customer's unique phone number, formatted using E.164 standard. For example, _+16135551111_. */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** The customer's unique phone number, formatted using E.164 standard. For example, _+16135551111_. */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code of the address. */
  zip?: InputMaybe<Scalars['String']['input']>;
  /**
   * The code for the region of the address, such as the province,
   * state, or district. For example, QC for Quebec, Canada.
   */
  zoneCode?: InputMaybe<Scalars['String']['input']>;
};

/** Defines the phone number of the customer. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type CustomerPhoneNumber = {
  __typename?: 'CustomerPhoneNumber';
  /** Indicates whether the customer has subscribed to SMS marketing material. */
  marketingState: SmsMarketingState;
  /** The customer's phone number. */
  phoneNumber: Scalars['String']['output'];
};

/** The input fields to update a customer's personal information. */
export type CustomerUpdateInput = {
  /** The customer's first name. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The customer's last name. */
  lastName?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `customerUpdate` mutation. */
export type CustomerUpdatePayload = {
  __typename?: 'CustomerUpdatePayload';
  /** The customer's personal information that has been updated. */
  customer?: Maybe<Customer>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsCustomerUserErrors>;
};

/** The different types of delivery option groups. */
export const DeliveryOptionGroupType = {
  /** A one-time purchase. */
  OneTimePurchase: 'ONE_TIME_PURCHASE',
  /** A subscription. */
  Subscription: 'SUBSCRIPTION'
} as const;

export type DeliveryOptionGroupType = typeof DeliveryOptionGroupType[keyof typeof DeliveryOptionGroupType];
/** Configuration of the deposit. */
export type DepositConfiguration = DepositPercentage;

/** A percentage deposit. */
export type DepositPercentage = {
  __typename?: 'DepositPercentage';
  /** The percentage value of the deposit. */
  percentage: Scalars['Float']['output'];
};

/** Represents an amount discounting the line that has been allocated by a discount. */
export type DiscountAllocation = {
  __typename?: 'DiscountAllocation';
  /** The amount of discount allocated. */
  allocatedAmount: MoneyV2;
  /** The discount from which this allocated amount originated. */
  discountApplication: DiscountApplication;
};

/** Captures the intentions of a discount source at the time of application. */
export type DiscountApplication = {
  /** The method by which the discount's value is allocated to its entitled items. */
  allocationMethod: DiscountApplicationAllocationMethod;
  /** The lines of targetType that the discount is allocated over. */
  targetSelection: DiscountApplicationTargetSelection;
  /** The type of line that the discount is applicable towards. */
  targetType: DiscountApplicationTargetType;
  /** The value of the discount application. */
  value: PricingValue;
};

/** The method by which the discount's value is allocated onto its entitled lines. */
export const DiscountApplicationAllocationMethod = {
  /** The value is spread across all entitled lines. */
  Across: 'ACROSS',
  /** The value is applied onto every entitled line. */
  Each: 'EACH',
  /** The value is specifically applied onto a particular line. */
  One: 'ONE'
} as const;

export type DiscountApplicationAllocationMethod = typeof DiscountApplicationAllocationMethod[keyof typeof DiscountApplicationAllocationMethod];
/** An auto-generated type for paginating through multiple DiscountApplications. */
export type DiscountApplicationConnection = {
  __typename?: 'DiscountApplicationConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<DiscountApplicationEdge>;
  /** A list of nodes that are contained in DiscountApplicationEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<DiscountApplication>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one DiscountApplication and a cursor during pagination. */
export type DiscountApplicationEdge = {
  __typename?: 'DiscountApplicationEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of DiscountApplicationEdge. */
  node: DiscountApplication;
};

/**
 * The lines on the order to which the discount is applied, of the type defined by
 * the discount application's `targetType`. For example, the value `ENTITLED`, combined with a `targetType` of
 * `LINE_ITEM`, applies the discount on all line items that are entitled to the discount.
 * The value `ALL`, combined with a `targetType` of `SHIPPING_LINE`, applies the discount on all shipping lines.
 */
export const DiscountApplicationTargetSelection = {
  /** The discount is allocated onto all the lines. */
  All: 'ALL',
  /** The discount is allocated onto only the lines that it's entitled for. */
  Entitled: 'ENTITLED',
  /** The discount is allocated onto explicitly chosen lines. */
  Explicit: 'EXPLICIT'
} as const;

export type DiscountApplicationTargetSelection = typeof DiscountApplicationTargetSelection[keyof typeof DiscountApplicationTargetSelection];
/** The type of line (i.e. line item or shipping line) on an order that the discount is applicable towards. */
export const DiscountApplicationTargetType = {
  /** The discount applies onto line items. */
  LineItem: 'LINE_ITEM',
  /** The discount applies onto shipping lines. */
  ShippingLine: 'SHIPPING_LINE'
} as const;

export type DiscountApplicationTargetType = typeof DiscountApplicationTargetType[keyof typeof DiscountApplicationTargetType];
/** The type of the discount application. */
export const DiscountApplicationType = {
  /** Automatic discount application type. */
  Automatic: 'AUTOMATIC',
  /** Discount code discount application type. */
  DiscountCode: 'DISCOUNT_CODE',
  /** Manual discount application type. */
  Manual: 'MANUAL',
  /** Script discount application type. */
  Script: 'SCRIPT'
} as const;

export type DiscountApplicationType = typeof DiscountApplicationType[keyof typeof DiscountApplicationType];
/** Captures the intentions of a discount code at the time that it is applied. */
export type DiscountCodeApplication = DiscountApplication & {
  __typename?: 'DiscountCodeApplication';
  /** The method by which the discount's value is allocated to its entitled items. */
  allocationMethod: DiscountApplicationAllocationMethod;
  /** The string identifying the discount code used at the time of application. */
  code: Scalars['String']['output'];
  /** The lines of targetType that the discount is allocated over. */
  targetSelection: DiscountApplicationTargetSelection;
  /** The type of line that the discount is applicable towards. */
  targetType: DiscountApplicationTargetType;
  /** The value of the discount application. */
  value: PricingValue;
};

/** The type of line (line item or shipping line) on an order that the subscription discount is applicable towards. */
export const DiscountTargetType = {
  /** The discount applies onto line items. */
  LineItem: 'LINE_ITEM',
  /** The discount applies onto shipping lines. */
  ShippingLine: 'SHIPPING_LINE'
} as const;

export type DiscountTargetType = typeof DiscountTargetType[keyof typeof DiscountTargetType];
/** The type of the subscription discount. */
export const DiscountType = {
  /** Automatic discount type. */
  AutomaticDiscount: 'AUTOMATIC_DISCOUNT',
  /** Code discount type. */
  CodeDiscount: 'CODE_DISCOUNT',
  /** Manual discount type. */
  Manual: 'MANUAL'
} as const;

export type DiscountType = typeof DiscountType[keyof typeof DiscountType];
/** Represents an error in the input of a mutation. */
export type DisplayableError = {
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** A unique string representing the address of a Shopify store on the Internet. */
export type Domain = Node & {
  __typename?: 'Domain';
  /** The host name of the domain (for example, `example.com`). */
  host: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The host of the primary domain that this domain redirects to (for example, `example.com`). */
  redirectHost?: Maybe<Scalars['String']['output']>;
  /** The URL of the domain (for example, `example.com`). */
  url: Scalars['URL']['output'];
};

/** A draft order for the customer. Any fields related to money are in the presentment currency. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type DraftOrder = Node & {
  __typename?: 'DraftOrder';
  /** The billing address of the customer. */
  billingAddress?: Maybe<CustomerAddress>;
  /** Whether the customer who made the draft order has an associated enabled contact. */
  contactExists: Scalars['Boolean']['output'];
  /** The date and time when the draft order was created in Shopify. */
  createdAt: Scalars['DateTime']['output'];
  /** The three-letter code for the currency of the store at the time that the invoice is sent. */
  currencyCode: CurrencyCode;
  /** The customer who placed the order. */
  customer?: Maybe<Customer>;
  /** List of discounts applied to the draft order. */
  discountApplications: DiscountApplicationConnection;
  /** The discount information for the draft order. */
  discountInformation: DraftOrderDiscountInformation;
  /** The email address of the customer, which is used to send notifications to. */
  email?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** Whether the draft order is created from the online store and is open. */
  inReview: Scalars['Boolean']['output'];
  /** The link to the checkout, which is sent to the customer in the invoice email. */
  invoiceUrl?: Maybe<Scalars['URL']['output']>;
  /** The merchandise lines marked as fees with total value, aggregated by title. */
  legacyAggregatedMerchandiseTermsAsFees: Array<LegacyAggregatedMerchandiseTermsAsFees>;
  /** Whether or not products marked as fees should be rendered as money lines. */
  legacyRepresentProductsAsFees: Scalars['Boolean']['output'];
  /** The subtotal of the line items (doesn't include shipping charges, shipping discounts, taxes, or fees). */
  legacySubtotalWithoutFees: MoneyV2;
  /** The list of the line items in the draft order. */
  lineItems: DraftOrderLineItemConnection;
  /** The summary of draft order line items quantity. */
  lineItemsSummary?: Maybe<DraftOrderLineItemsSummary>;
  /** The unique identifier for the draft order, which is unique within the store. For example, _#D1223_. */
  name: Scalars['String']['output'];
  /** The order that was created from this draft order. */
  order?: Maybe<Order>;
  /** The phone number assigned to the draft order. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The purchasing entity for the draft order. */
  purchasingEntity?: Maybe<PurchasingEntity>;
  /** Whether the draft order requires shipping or not. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The shipping address of the customer. */
  shippingAddress?: Maybe<CustomerAddress>;
  /** The status of the draft order. */
  status: DraftOrderStatus;
  /** The subtotal of the line items (doesn't include shipping charges, shipping discounts, or taxes). */
  subtotalPrice: MoneyV2;
  /** The subtotal of the line items (doesn't include shipping charges, taxes, or any discounts). */
  subtotalPriceBeforeDiscounts: MoneyV2;
  /** Indicates whether the draft order is tax exempt. */
  taxExempt: Scalars['Boolean']['output'];
  /** Whether the line item prices include taxes. */
  taxesIncluded: Scalars['Boolean']['output'];
  /** The total price of line items for this draft order. */
  totalLineItemsPrice: MoneyV2;
  /** The total amount of the draft order (includes taxes, shipping charges, and discounts). */
  totalPrice: MoneyV2;
  /** The total shipping charge for the draft order. */
  totalShippingPrice: MoneyV2;
  /** The total amount of taxes for the draft order. */
  totalTax: MoneyV2;
  /** The total weight (in grams) of the draft order. */
  totalWeight: Scalars['UnsignedInt64']['output'];
  /**
   * The date and time when the draft order was last changed.
   * The format is YYYY-MM-DD HH:mm:ss (for example, 2016-02-05 17:04:01).
   */
  updatedAt: Scalars['DateTime']['output'];
};


/** A draft order for the customer. Any fields related to money are in the presentment currency. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type DraftOrderDiscountApplicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A draft order for the customer. Any fields related to money are in the presentment currency. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type DraftOrderLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  flattenComponents?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The order-level discount applied to a draft order. */
export type DraftOrderAppliedDiscount = {
  __typename?: 'DraftOrderAppliedDiscount';
  /** The amount of money discounted. */
  discountValue: MoneyV2;
  /** The name of the order-level discount. */
  title?: Maybe<Scalars['String']['output']>;
};

/** The set of valid sort keys for the DraftOrderByCompany query. */
export const DraftOrderByCompanySortKeys = {
  /** Sort by the `customer_name` value. */
  CustomerName: 'CUSTOMER_NAME',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `number` value. */
  Number: 'NUMBER',
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   */
  Relevance: 'RELEVANCE',
  /** Sort by the `status` value. */
  Status: 'STATUS',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type DraftOrderByCompanySortKeys = typeof DraftOrderByCompanySortKeys[keyof typeof DraftOrderByCompanySortKeys];
/** The set of valid sort keys for the DraftOrderByLocation query. */
export const DraftOrderByLocationSortKeys = {
  /** Sort by the `customer_name` value. */
  CustomerName: 'CUSTOMER_NAME',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `number` value. */
  Number: 'NUMBER',
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   */
  Relevance: 'RELEVANCE',
  /** Sort by the `status` value. */
  Status: 'STATUS',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type DraftOrderByLocationSortKeys = typeof DraftOrderByLocationSortKeys[keyof typeof DraftOrderByLocationSortKeys];
/** An auto-generated type for paginating through multiple DraftOrders. */
export type DraftOrderConnection = {
  __typename?: 'DraftOrderConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<DraftOrderEdge>;
  /** A list of nodes that are contained in DraftOrderEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<DraftOrder>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The discount information associated with a draft order. */
export type DraftOrderDiscountInformation = {
  __typename?: 'DraftOrderDiscountInformation';
  /** The discount information for the draft order, including line_level discount applications. */
  allAppliedDiscounts: Array<OrderAllDiscounts>;
  /** The order level discount information for the draft order. */
  allOrderLevelAppliedDiscounts: Array<OrderAllDiscounts>;
  /** The order-level discount applied to the draft order. */
  appliedDiscount?: Maybe<DraftOrderAppliedDiscount>;
  /** The total discounts applied to the draft order. */
  totalDiscounts: MoneyV2;
};

/** An auto-generated type which holds one DraftOrder and a cursor during pagination. */
export type DraftOrderEdge = {
  __typename?: 'DraftOrderEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of DraftOrderEdge. */
  node: DraftOrder;
};

/** A line item included in a draft order. */
export type DraftOrderLineItem = Node & {
  __typename?: 'DraftOrderLineItem';
  /** The discounted total divided by the quantity, resulting in an average per-unit price reduction. */
  approximateDiscountedUnitPrice: MoneyV2;
  /** The list of components for this draft order line item. */
  components: Array<DraftOrderLineItem>;
  /** List of discounts allocated to the draft order line item. */
  discountAllocations: Array<DiscountAllocation>;
  /** The discount information for the draft order line item. */
  discountInformation: DraftOrderLineItemDiscountInformation;
  /** The total price of the line item after discounts have been applied. */
  discountedTotal: MoneyV2;
  /** The discounted total divided by the quantity, resulting in the value of the discount per unit. */
  discountedUnitPrice: MoneyV2;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The image associated with the line item. */
  image?: Maybe<Image>;
  /** Whether this is line item is marked as a fee. */
  legacyFee: Scalars['Boolean']['output'];
  /** The fee's description, if this line item has been marked as a fee. */
  legacyFeeDescription?: Maybe<Scalars['String']['output']>;
  /** The fee's title, if this line item has been marked as a fee. */
  legacyFeeTitle?: Maybe<Scalars['String']['output']>;
  /** The name of the product. */
  name: Scalars['String']['output'];
  /** The total price of the line item, based on the original unit price of the variant multiplied by the quantity. This total doesn't include any discounts. */
  originalTotal: MoneyV2;
  /** The price of the variant without any discounts applied. */
  originalUnitPrice: MoneyV2;
  /** The quantity of this variant item in the draft order. */
  quantity: Scalars['Int']['output'];
  /** Whether the variant requires physical shipping. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The SKU number of the variant. */
  sku?: Maybe<Scalars['String']['output']>;
  /** Whether the variant is taxable. */
  taxable: Scalars['Boolean']['output'];
  /** The title of the product or variant. This only applies to custom line items. */
  title: Scalars['String']['output'];
  /** The name of the product variant. */
  variantTitle?: Maybe<Scalars['String']['output']>;
  /** The name of the vendor of the variant. */
  vendor?: Maybe<Scalars['String']['output']>;
  /** The weight of the line item, including the unit and value. */
  weight?: Maybe<Weight>;
};

/** An auto-generated type for paginating through multiple DraftOrderLineItems. */
export type DraftOrderLineItemConnection = {
  __typename?: 'DraftOrderLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<DraftOrderLineItemEdge>;
  /** A list of nodes that are contained in DraftOrderLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<DraftOrderLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The discount information for the draft order line item. */
export type DraftOrderLineItemDiscountInformation = {
  __typename?: 'DraftOrderLineItemDiscountInformation';
  /** The discount's name that displays to merchants in the Shopify admin and to customers. */
  title?: Maybe<Scalars['String']['output']>;
  /** The total discount applied to the line item. */
  totalDiscount: MoneyV2;
};

/** An auto-generated type which holds one DraftOrderLineItem and a cursor during pagination. */
export type DraftOrderLineItemEdge = {
  __typename?: 'DraftOrderLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of DraftOrderLineItemEdge. */
  node: DraftOrderLineItem;
};

/** The quantitative summary of the line items in a specific draft order. */
export type DraftOrderLineItemsSummary = {
  __typename?: 'DraftOrderLineItemsSummary';
  /** The total number of line items in the draft order. */
  lineItemCount: Scalars['Int']['output'];
  /** The total quantity of all legacy fee line items in the draft order. */
  totalQuantityOfLegacyFeeLineItems: Scalars['Int']['output'];
  /** The total quantity of all line items in the draft order. */
  totalQuantityOfLineItems: Scalars['Int']['output'];
};

/** The set of valid sort keys for the DraftOrder query. */
export const DraftOrderSortKeys = {
  /** Sort by the `customer_name` value. */
  CustomerName: 'CUSTOMER_NAME',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `number` value. */
  Number: 'NUMBER',
  /**
   * Sort by relevance to the search terms when the `query` parameter is specified on the connection.
   * Don't use this sort key when no search query is specified.
   */
  Relevance: 'RELEVANCE',
  /** Sort by the `status` value. */
  Status: 'STATUS',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type DraftOrderSortKeys = typeof DraftOrderSortKeys[keyof typeof DraftOrderSortKeys];
/** The valid statuses for a draft order. */
export const DraftOrderStatus = {
  /** The draft order has been paid. */
  Completed: 'COMPLETED',
  /** An invoice for the draft order has been sent to the customer. */
  InvoiceSent: 'INVOICE_SENT',
  /** The draft order is open. It has not been paid, and an invoice hasn't been sent. */
  Open: 'OPEN'
} as const;

export type DraftOrderStatus = typeof DraftOrderStatus[keyof typeof DraftOrderStatus];
/** A sale that includes a duty charge. */
export type DutySale = Node & Sale & {
  __typename?: 'DutySale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** Represents the possible email marketing states for a customer. */
export const EmailMarketingState = {
  /** The customer’s email marketing state is invalid. */
  Invalid: 'INVALID',
  /** The customer isn't subscribed to email marketing. */
  NotSubscribed: 'NOT_SUBSCRIBED',
  /** The customer is in the process of subscribing to email marketing. */
  Pending: 'PENDING',
  /** The customer's personal data has been erased. This value is internally-set and read-only. */
  Redacted: 'REDACTED',
  /** The customer is subscribed to email marketing. */
  Subscribed: 'SUBSCRIBED',
  /** The customer is not currently subscribed to email marketing but was previously subscribed. */
  Unsubscribed: 'UNSUBSCRIBED'
} as const;

export type EmailMarketingState = typeof EmailMarketingState[keyof typeof EmailMarketingState];
/** An item for exchange. */
export type ExchangeLineItem = Node & {
  __typename?: 'ExchangeLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The image associated to the line item's variant. */
  image?: Maybe<Image>;
  /** Whether the product has only a single variant with the default option and value. */
  productHasOnlyDefaultVariant?: Maybe<Scalars['Boolean']['output']>;
  /** The ID of the product at time of refund creation. */
  productId?: Maybe<Scalars['ID']['output']>;
  /** The number of variant items ordered. */
  quantity: Scalars['Int']['output'];
  /** The title of the product at time of order creation. */
  title?: Maybe<Scalars['String']['output']>;
  /** The ID of the variant at time of refund creation. */
  variantId?: Maybe<Scalars['ID']['output']>;
  /** The variant SKU number. */
  variantSku?: Maybe<Scalars['String']['output']>;
  /** The title of the variant at time of refund creation. */
  variantTitle?: Maybe<Scalars['String']['output']>;
};

/** An auto-generated type for paginating through multiple ExchangeLineItems. */
export type ExchangeLineItemConnection = {
  __typename?: 'ExchangeLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ExchangeLineItemEdge>;
  /** A list of nodes that are contained in ExchangeLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<ExchangeLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one ExchangeLineItem and a cursor during pagination. */
export type ExchangeLineItemEdge = {
  __typename?: 'ExchangeLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ExchangeLineItemEdge. */
  node: ExchangeLineItem;
};

/** Tokens used by ui extensions to query various APIs. */
export type ExtensionApiTokens = {
  __typename?: 'ExtensionApiTokens';
  /** The token for querying the storefront API. */
  storefrontApi?: Maybe<ExtensionStorefrontApiToken>;
};

/** Ephemeral token used by ui extensions to query the storefront API. */
export type ExtensionStorefrontApiToken = {
  __typename?: 'ExtensionStorefrontApiToken';
  /** The expiration time of the token. */
  expiresAt: Scalars['ISO8601DateTime']['output'];
  /** The ephemeral token used for querying the storefront API. */
  token: Scalars['String']['output'];
};

/** A sale associated with a fee. */
export type FeeSale = Node & Sale & {
  __typename?: 'FeeSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** Represents a single fulfillment in an order. */
export type Fulfillment = Node & {
  __typename?: 'Fulfillment';
  /** The date and time when the fulfillment was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The estimated delivery time of this fulfillment. */
  estimatedDeliveryAt?: Maybe<Scalars['DateTime']['output']>;
  /** A collection of fulfillment events. */
  events: FulfillmentEventConnection;
  /** The line items in the fulfillment. */
  fulfillmentLineItems: FulfillmentLineItemConnection;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** Whether the fulfillment is picked up locally. */
  isPickedUp: Scalars['Boolean']['output'];
  /** The latest shipment status for the fulfillment. */
  latestShipmentStatus?: Maybe<FulfillmentEventStatus>;
  /** The pickup address for the fulfillment. */
  pickupAddress?: Maybe<PickupAddress>;
  /** Whether any line items in the fulfillment require shipping. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The status of the fulfillment. */
  status?: Maybe<FulfillmentStatus>;
  /** The tracking information associated with the fulfillment. */
  trackingInformation: Array<TrackingInformation>;
  /** The date and time when the fulfillment was updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** Represents a single fulfillment in an order. */
export type FulfillmentEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<FulfillmentEventSortKeys>;
};


/** Represents a single fulfillment in an order. */
export type FulfillmentFulfillmentLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An auto-generated type for paginating through multiple Fulfillments. */
export type FulfillmentConnection = {
  __typename?: 'FulfillmentConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<FulfillmentEdge>;
  /** A list of nodes that are contained in FulfillmentEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<Fulfillment>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one Fulfillment and a cursor during pagination. */
export type FulfillmentEdge = {
  __typename?: 'FulfillmentEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of FulfillmentEdge. */
  node: Fulfillment;
};

/** An event that occurred for a fulfillment. */
export type FulfillmentEvent = Node & {
  __typename?: 'FulfillmentEvent';
  /** The time when this fulfillment event occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The status of the fulfillment event. */
  status: FulfillmentEventStatus;
};

/** An auto-generated type for paginating through multiple FulfillmentEvents. */
export type FulfillmentEventConnection = {
  __typename?: 'FulfillmentEventConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<FulfillmentEventEdge>;
  /** A list of nodes that are contained in FulfillmentEventEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<FulfillmentEvent>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one FulfillmentEvent and a cursor during pagination. */
export type FulfillmentEventEdge = {
  __typename?: 'FulfillmentEventEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of FulfillmentEventEdge. */
  node: FulfillmentEvent;
};

/** The set of valid sort keys for the FulfillmentEvent query. */
export const FulfillmentEventSortKeys = {
  /** Sort by the `happened_at` value. */
  HappenedAt: 'HAPPENED_AT',
  /** Sort by the `id` value. */
  Id: 'ID'
} as const;

export type FulfillmentEventSortKeys = typeof FulfillmentEventSortKeys[keyof typeof FulfillmentEventSortKeys];
/** The status of a fulfillment event. */
export const FulfillmentEventStatus = {
  /** A delivery was attempted. */
  AttemptedDelivery: 'ATTEMPTED_DELIVERY',
  /** The fulfillment has been picked up by the carrier. */
  CarrierPickedUp: 'CARRIER_PICKED_UP',
  /** The fulfillment is confirmed. */
  Confirmed: 'CONFIRMED',
  /** The fulfillment is delayed. */
  Delayed: 'DELAYED',
  /** The fulfillment was successfully delivered. */
  Delivered: 'DELIVERED',
  /** The fulfillment request failed. */
  Failure: 'FAILURE',
  /** The fulfillment is in transit. */
  InTransit: 'IN_TRANSIT',
  /** A purchased shipping label has been printed. */
  LabelPrinted: 'LABEL_PRINTED',
  /** A shipping label has been purchased. */
  LabelPurchased: 'LABEL_PURCHASED',
  /** The fulfillment is out for delivery. */
  OutForDelivery: 'OUT_FOR_DELIVERY',
  /** The fulfillment was successfully picked up. */
  PickedUp: 'PICKED_UP',
  /** The fulfillment is ready to be picked up. */
  ReadyForPickup: 'READY_FOR_PICKUP'
} as const;

export type FulfillmentEventStatus = typeof FulfillmentEventStatus[keyof typeof FulfillmentEventStatus];
/** Represents a line item from an order that's included in a fulfillment. */
export type FulfillmentLineItem = Node & {
  __typename?: 'FulfillmentLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The line item associated with the order. */
  lineItem: LineItem;
  /** The number of line items in the fulfillment. */
  quantity?: Maybe<Scalars['Int']['output']>;
};

/** An auto-generated type for paginating through multiple FulfillmentLineItems. */
export type FulfillmentLineItemConnection = {
  __typename?: 'FulfillmentLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<FulfillmentLineItemEdge>;
  /** A list of nodes that are contained in FulfillmentLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<FulfillmentLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one FulfillmentLineItem and a cursor during pagination. */
export type FulfillmentLineItemEdge = {
  __typename?: 'FulfillmentLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of FulfillmentLineItemEdge. */
  node: FulfillmentLineItem;
};

/** The set of valid sort keys for the Fulfillment query. */
export const FulfillmentSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID'
} as const;

export type FulfillmentSortKeys = typeof FulfillmentSortKeys[keyof typeof FulfillmentSortKeys];
/** The status of a fulfillment. */
export const FulfillmentStatus = {
  /** The fulfillment was canceled. */
  Cancelled: 'CANCELLED',
  /** There was an error with the fulfillment request. */
  Error: 'ERROR',
  /** The fulfillment request failed. */
  Failure: 'FAILURE',
  /** The third-party fulfillment service has acknowledged the fulfillment and is processing it. */
  Open: 'OPEN',
  /** Shopify has created the fulfillment and is waiting for the third-party fulfillment service to transition it to `open` or `success`. */
  Pending: 'PENDING',
  /** The fulfillment was completed successfully. */
  Success: 'SUCCESS'
} as const;

export type FulfillmentStatus = typeof FulfillmentStatus[keyof typeof FulfillmentStatus];
/** The generic file resource lets you manage files in a merchant's store. Generic files include any file that doesn't fit into a designated type such as image or video. Example: PDF, JSON. */
export type GenericFile = Media & {
  __typename?: 'GenericFile';
  /** A word or phrase to indicate the contents of a file. */
  alt?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The media content type. */
  mediaContentType: MediaContentType;
  /** The MIME type of the file. */
  mimeType?: Maybe<Scalars['String']['output']>;
  /** The size of the original file in bytes. */
  originalFileSize?: Maybe<Scalars['Int']['output']>;
  /** The preview image for the media. */
  previewImage?: Maybe<Image>;
  /** The URL of the file. */
  url?: Maybe<Scalars['URL']['output']>;
};

/** The gift card payment details related to a transaction. */
export type GiftCardDetails = {
  __typename?: 'GiftCardDetails';
  /** The balance of the gift card in shop and presentment currencies. */
  balance: MoneyV2;
  /** The last characters of the gift card. */
  last4: Scalars['String']['output'];
};

/** A sale associated with a gift card. */
export type GiftCardSale = Node & Sale & {
  __typename?: 'GiftCardSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The line item associated with the sale. */
  lineItem: LineItem;
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** The input fields for the billing address received from Google Pay. */
export type GooglePayBillingAddressInput = {
  /** The first line of the address, typically the street address or PO Box number. */
  address1?: InputMaybe<Scalars['String']['input']>;
  /** The second line of the address, typically the apartment, suite, or unit number. */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The region of the address, such as the province, state, or district. */
  administrativeArea?: InputMaybe<Scalars['String']['input']>;
  /** The two-letter code for the country of the address. */
  countryCode?: InputMaybe<CountryCode>;
  /** The name of the city, district, village, or town. */
  locality?: InputMaybe<Scalars['String']['input']>;
  /** The name of the customer. */
  name?: InputMaybe<Scalars['String']['input']>;
  /** The telephone number of the customer. */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /** The zip or postal code of the address. */
  postalCode?: InputMaybe<Scalars['String']['input']>;
};

/** Return type for `googlePayCreditCardAdd` mutation. */
export type GooglePayCreditCardAddPayload = {
  __typename?: 'GooglePayCreditCardAddPayload';
  /** The updated credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `googlePayCreditCardUpdate` mutation. */
export type GooglePayCreditCardUpdatePayload = {
  __typename?: 'GooglePayCreditCardUpdatePayload';
  /** The updated credit card. */
  creditCard?: Maybe<CustomerCreditCard>;
  /** If the card verification result is processing. When this is true, credit_card will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** The configuration settings for the Google Pay wallet. */
export type GooglePayWalletConfig = {
  __typename?: 'GooglePayWalletConfig';
  /** The authentication methods allowed by Google Pay. */
  allowedAuthMethods: Array<Scalars['String']['output']>;
  /** The card networks accepted by Google Pay. */
  allowedCardNetworks: Array<Scalars['String']['output']>;
  /** The Auth JWT used for Google Pay requests. */
  authJwt: Scalars['String']['output'];
  /** The current operating environment (TEST or PRODUCTION). */
  environment: Scalars['String']['output'];
  /** The gateway name for Google Pay. */
  gateway: Scalars['String']['output'];
  /** The gateway merchant ID for Google Pay. */
  gatewayMerchantId: Scalars['String']['output'];
  /** The merchant ID for Google Pay. */
  merchantId: Scalars['String']['output'];
  /** The merchant name for Google Pay. */
  merchantName: Scalars['String']['output'];
  /** The merchant origin for Google Pay. */
  merchantOrigin: Scalars['String']['output'];
};

/**
 * Represents a summary of the current version of data in a resource.
 *
 * The `compare_digest` field can be used as input for mutations that implement a compare-and-swap mechanism.
 */
export type HasCompareDigest = {
  /** The data stored in the resource, represented as a digest. */
  compareDigest: Scalars['String']['output'];
};

/** The information about the metafields associated with the specified resource. */
export type HasMetafields = {
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
};


/** The information about the metafields associated with the specified resource. */
export type HasMetafieldsMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** The information about the metafields associated with the specified resource. */
export type HasMetafieldsMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};

/** The input fields to identify a metafield on an owner resource by namespace and key. */
export type HasMetafieldsIdentifier = {
  /** The identifier for the metafield. */
  key: Scalars['String']['input'];
  /** A container for a set of metafields. */
  namespace: Scalars['String']['input'];
};

/** Represents information about the store credit accounts associated to the specified owner. */
export type HasStoreCreditAccounts = {
  /** A list of the owner resource's store credit accounts. Store credit accounts are not shown for shops with store credit disabled at checkout. */
  storeCreditAccounts: StoreCreditAccountConnection;
};


/** Represents information about the store credit accounts associated to the specified owner. */
export type HasStoreCreditAccountsStoreCreditAccountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};

/** Represents an image resource. */
export type Image = {
  __typename?: 'Image';
  /** A word or phrase to share the nature or contents of an image. */
  altText?: Maybe<Scalars['String']['output']>;
  /** The original height of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
  height?: Maybe<Scalars['Int']['output']>;
  /** A unique ID for the image. */
  id?: Maybe<Scalars['ID']['output']>;
  /**
   * The location of the original image as a URL.
   *
   * If there are any existing transformations in the original source URL, they will remain and not be stripped.
   * @deprecated Use `url` instead.
   */
  originalSrc: Scalars['URL']['output'];
  /**
   * The location of the image as a URL.
   * @deprecated Use `url` instead.
   */
  src: Scalars['URL']['output'];
  /**
   * The ThumbHash of the image.
   *
   * Useful to display placeholder images while the original image is loading.
   */
  thumbhash?: Maybe<Scalars['String']['output']>;
  /**
   * The location of the transformed image as a URL.
   *
   * All transformation arguments are considered "best-effort". If they can be applied to an image, they will be.
   * Otherwise any transformations which an image type doesn't support will be ignored.
   * @deprecated Use `url(transform:)` instead
   */
  transformedSrc: Scalars['URL']['output'];
  /**
   * The location of the image as a URL.
   *
   * If no transform options are specified, then the original image will be preserved including any pre-applied transforms.
   *
   * All transformation options are considered "best-effort". Any transformation that the original image type doesn't support will be ignored.
   *
   * If you need multiple variations of the same image, then you can use [GraphQL aliases](https://graphql.org/learn/queries/#aliases).
   */
  url: Scalars['URL']['output'];
  /** The original width of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
  width?: Maybe<Scalars['Int']['output']>;
};


/** Represents an image resource. */
export type ImageTransformedSrcArgs = {
  crop?: InputMaybe<CropRegion>;
  maxHeight?: InputMaybe<Scalars['Int']['input']>;
  maxWidth?: InputMaybe<Scalars['Int']['input']>;
  preferredContentType?: InputMaybe<ImageContentType>;
  scale?: InputMaybe<Scalars['Int']['input']>;
};


/** Represents an image resource. */
export type ImageUrlArgs = {
  transform?: InputMaybe<ImageTransformInput>;
};

/** List of supported image content types. */
export const ImageContentType = {
  /** A BMP image. */
  Bmp: 'BMP',
  /** A JPG image. */
  Jpg: 'JPG',
  /** A PNG image. */
  Png: 'PNG',
  /** A WEBP image. */
  Webp: 'WEBP'
} as const;

export type ImageContentType = typeof ImageContentType[keyof typeof ImageContentType];
/**
 * The available options for transforming an image.
 *
 * All transformation options are considered best effort. Any transformation that the original image type doesn't support will be ignored.
 */
export type ImageTransformInput = {
  /**
   * The region of the image to remain after cropping.
   * Must be used in conjunction with the `maxWidth` and/or `maxHeight` fields, where the `maxWidth` and `maxHeight` aren't equal.
   * The `crop` argument should coincide with the smaller value. A smaller `maxWidth` indicates a `LEFT` or `RIGHT` crop, while
   * a smaller `maxHeight` indicates a `TOP` or `BOTTOM` crop. For example, `{ maxWidth: 5, maxHeight: 10, crop: LEFT }` will result
   * in an image with a width of 5 and height of 10, where the right side of the image is removed.
   */
  crop?: InputMaybe<CropRegion>;
  /** Image height in pixels between 1 and 5760. */
  maxHeight?: InputMaybe<Scalars['Int']['input']>;
  /** Image width in pixels between 1 and 5760. */
  maxWidth?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Convert the source image into the preferred content type.
   * Supported conversions: `.svg` to `.png`, any file type to `.jpg`, and any file type to `.webp`.
   */
  preferredContentType?: InputMaybe<ImageContentType>;
  /** Image size multiplier for high-resolution retina displays. Must be within 1..3. */
  scale?: InputMaybe<Scalars['Int']['input']>;
};

/** Language codes supported by Shopify. */
export const LanguageCode = {
  /** Afrikaans. */
  Af: 'AF',
  /** Akan. */
  Ak: 'AK',
  /** Amharic. */
  Am: 'AM',
  /** Arabic. */
  Ar: 'AR',
  /** Assamese. */
  As: 'AS',
  /** Azerbaijani. */
  Az: 'AZ',
  /** Belarusian. */
  Be: 'BE',
  /** Bulgarian. */
  Bg: 'BG',
  /** Bambara. */
  Bm: 'BM',
  /** Bangla. */
  Bn: 'BN',
  /** Tibetan. */
  Bo: 'BO',
  /** Breton. */
  Br: 'BR',
  /** Bosnian. */
  Bs: 'BS',
  /** Catalan. */
  Ca: 'CA',
  /** Chechen. */
  Ce: 'CE',
  /** Central Kurdish. */
  Ckb: 'CKB',
  /** Czech. */
  Cs: 'CS',
  /** Church Slavic. */
  Cu: 'CU',
  /** Welsh. */
  Cy: 'CY',
  /** Danish. */
  Da: 'DA',
  /** German. */
  De: 'DE',
  /** Dzongkha. */
  Dz: 'DZ',
  /** Ewe. */
  Ee: 'EE',
  /** Greek. */
  El: 'EL',
  /** English. */
  En: 'EN',
  /** Esperanto. */
  Eo: 'EO',
  /** Spanish. */
  Es: 'ES',
  /** Estonian. */
  Et: 'ET',
  /** Basque. */
  Eu: 'EU',
  /** Persian. */
  Fa: 'FA',
  /** Fulah. */
  Ff: 'FF',
  /** Finnish. */
  Fi: 'FI',
  /** Filipino. */
  Fil: 'FIL',
  /** Faroese. */
  Fo: 'FO',
  /** French. */
  Fr: 'FR',
  /** Western Frisian. */
  Fy: 'FY',
  /** Irish. */
  Ga: 'GA',
  /** Scottish Gaelic. */
  Gd: 'GD',
  /** Galician. */
  Gl: 'GL',
  /** Gujarati. */
  Gu: 'GU',
  /** Manx. */
  Gv: 'GV',
  /** Hausa. */
  Ha: 'HA',
  /** Hebrew. */
  He: 'HE',
  /** Hindi. */
  Hi: 'HI',
  /** Croatian. */
  Hr: 'HR',
  /** Hungarian. */
  Hu: 'HU',
  /** Armenian. */
  Hy: 'HY',
  /** Interlingua. */
  Ia: 'IA',
  /** Indonesian. */
  Id: 'ID',
  /** Igbo. */
  Ig: 'IG',
  /** Sichuan Yi. */
  Ii: 'II',
  /** Icelandic. */
  Is: 'IS',
  /** Italian. */
  It: 'IT',
  /** Japanese. */
  Ja: 'JA',
  /** Javanese. */
  Jv: 'JV',
  /** Georgian. */
  Ka: 'KA',
  /** Kikuyu. */
  Ki: 'KI',
  /** Kazakh. */
  Kk: 'KK',
  /** Kalaallisut. */
  Kl: 'KL',
  /** Khmer. */
  Km: 'KM',
  /** Kannada. */
  Kn: 'KN',
  /** Korean. */
  Ko: 'KO',
  /** Kashmiri. */
  Ks: 'KS',
  /** Kurdish. */
  Ku: 'KU',
  /** Cornish. */
  Kw: 'KW',
  /** Kyrgyz. */
  Ky: 'KY',
  /** Luxembourgish. */
  Lb: 'LB',
  /** Ganda. */
  Lg: 'LG',
  /** Lingala. */
  Ln: 'LN',
  /** Lao. */
  Lo: 'LO',
  /** Lithuanian. */
  Lt: 'LT',
  /** Luba-Katanga. */
  Lu: 'LU',
  /** Latvian. */
  Lv: 'LV',
  /** Malagasy. */
  Mg: 'MG',
  /** Māori. */
  Mi: 'MI',
  /** Macedonian. */
  Mk: 'MK',
  /** Malayalam. */
  Ml: 'ML',
  /** Mongolian. */
  Mn: 'MN',
  /** Marathi. */
  Mr: 'MR',
  /** Malay. */
  Ms: 'MS',
  /** Maltese. */
  Mt: 'MT',
  /** Burmese. */
  My: 'MY',
  /** Norwegian (Bokmål). */
  Nb: 'NB',
  /** North Ndebele. */
  Nd: 'ND',
  /** Nepali. */
  Ne: 'NE',
  /** Dutch. */
  Nl: 'NL',
  /** Norwegian Nynorsk. */
  Nn: 'NN',
  /** Norwegian. */
  No: 'NO',
  /** Oromo. */
  Om: 'OM',
  /** Odia. */
  Or: 'OR',
  /** Ossetic. */
  Os: 'OS',
  /** Punjabi. */
  Pa: 'PA',
  /** Polish. */
  Pl: 'PL',
  /** Pashto. */
  Ps: 'PS',
  /** Portuguese. */
  Pt: 'PT',
  /** Portuguese (Brazil). */
  PtBr: 'PT_BR',
  /** Portuguese (Portugal). */
  PtPt: 'PT_PT',
  /** Quechua. */
  Qu: 'QU',
  /** Romansh. */
  Rm: 'RM',
  /** Rundi. */
  Rn: 'RN',
  /** Romanian. */
  Ro: 'RO',
  /** Russian. */
  Ru: 'RU',
  /** Kinyarwanda. */
  Rw: 'RW',
  /** Sanskrit. */
  Sa: 'SA',
  /** Sardinian. */
  Sc: 'SC',
  /** Sindhi. */
  Sd: 'SD',
  /** Northern Sami. */
  Se: 'SE',
  /** Sango. */
  Sg: 'SG',
  /** Sinhala. */
  Si: 'SI',
  /** Slovak. */
  Sk: 'SK',
  /** Slovenian. */
  Sl: 'SL',
  /** Shona. */
  Sn: 'SN',
  /** Somali. */
  So: 'SO',
  /** Albanian. */
  Sq: 'SQ',
  /** Serbian. */
  Sr: 'SR',
  /** Sundanese. */
  Su: 'SU',
  /** Swedish. */
  Sv: 'SV',
  /** Swahili. */
  Sw: 'SW',
  /** Tamil. */
  Ta: 'TA',
  /** Telugu. */
  Te: 'TE',
  /** Tajik. */
  Tg: 'TG',
  /** Thai. */
  Th: 'TH',
  /** Tigrinya. */
  Ti: 'TI',
  /** Turkmen. */
  Tk: 'TK',
  /** Tongan. */
  To: 'TO',
  /** Turkish. */
  Tr: 'TR',
  /** Tatar. */
  Tt: 'TT',
  /** Uyghur. */
  Ug: 'UG',
  /** Ukrainian. */
  Uk: 'UK',
  /** Urdu. */
  Ur: 'UR',
  /** Uzbek. */
  Uz: 'UZ',
  /** Vietnamese. */
  Vi: 'VI',
  /** Volapük. */
  Vo: 'VO',
  /** Wolof. */
  Wo: 'WO',
  /** Xhosa. */
  Xh: 'XH',
  /** Yiddish. */
  Yi: 'YI',
  /** Yoruba. */
  Yo: 'YO',
  /** Chinese. */
  Zh: 'ZH',
  /** Chinese (Simplified). */
  ZhCn: 'ZH_CN',
  /** Chinese (Traditional). */
  ZhTw: 'ZH_TW',
  /** Zulu. */
  Zu: 'ZU'
} as const;

export type LanguageCode = typeof LanguageCode[keyof typeof LanguageCode];
/** An object representing a product marked as a fee, aggregated by title. */
export type LegacyAggregatedMerchandiseTermsAsFees = Node & {
  __typename?: 'LegacyAggregatedMerchandiseTermsAsFees';
  /** The description of the fee line, as provided by the _legacy_product_as_fee_description line item property. */
  description?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The title of the fee line, as provided by the _legacy_product_as_fee_title line item property. */
  title: Scalars['String']['output'];
  /** The total value of all the products with the same title. */
  total: MoneyV2;
};

/** A single line item in an order. */
export type LineItem = Node & {
  __typename?: 'LineItem';
  /** The total price of the line item, calculated by multiplying the current unit price of the variant by the quantity, expressed in presentment currencies. */
  currentTotalPrice?: Maybe<MoneyV2>;
  /** The list of custom attributes associated with the line item. */
  customAttributes: Array<Attribute>;
  /** The discounts that have been allocated onto the line item by discount applications. */
  discountAllocations: Array<DiscountAllocation>;
  /** The discount information for the line item. */
  discountInformation: Array<LineItemDiscountInformation>;
  /** Whether the line item represents the purchase of a gift card. */
  giftCard: Scalars['Boolean']['output'];
  /** The line item group associated to the line item. */
  group?: Maybe<LineItemGroup>;
  /** The title of the line item group associated with the line item. */
  groupTitle?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The image object associated with the line item. */
  image?: Maybe<Image>;
  /** Whether this is line item is marked as a fee. */
  legacyFee: Scalars['Boolean']['output'];
  /** The fee's description, if this line item has been marked as a fee. */
  legacyFeeDescription?: Maybe<Scalars['String']['output']>;
  /** The fee's title, if this line item has been marked as a fee. */
  legacyFeeTitle?: Maybe<Scalars['String']['output']>;
  /** The name of the product. */
  name: Scalars['String']['output'];
  /** The title of the line item variant. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The product variant price without any discounts applied, in presentment currencies. */
  price?: Maybe<MoneyV2>;
  /** The product's ID. */
  productId?: Maybe<Scalars['ID']['output']>;
  /** The product's type. */
  productType?: Maybe<Scalars['String']['output']>;
  /** The number of variant items ordered. */
  quantity: Scalars['Int']['output'];
  /** The quantity of the line item, minus the refunded quantity. */
  refundableQuantity: Scalars['Int']['output'];
  /** Whether physical shipping is required for the variant. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The selling plan details associated with the line item. */
  sellingPlan?: Maybe<LineItemSellingPlan>;
  /** The SKU number of the variant. */
  sku?: Maybe<Scalars['String']['output']>;
  /** The discounts that have been allocated onto the line item, ignoring returns. */
  soldDiscountInformation: Array<LineItemDiscountInformation>;
  /** The total price of the line item, ignoring returns, with discounts included. */
  soldDiscountedTotalPrice?: Maybe<MoneyV2>;
  /** The quantity of sold line item, ignoring returns. */
  soldQuantity?: Maybe<Scalars['Int']['output']>;
  /** The total price of the line item, ignoring returns, before discounts. */
  soldTotalPrice?: Maybe<MoneyV2>;
  /** Return reasons suggested based on the line item's product category in Shopify's product taxonomy. These are a curated subset of the full library of available reasons via the [`returnReasonDefinitions`](https://shopify.dev/docs/api/admin-graphql/latest/queries/returnReasonDefinitions) query. */
  suggestedReturnReasonDefinitions?: Maybe<ReturnReasonDefinitionConnection>;
  /**
   * The reasons that the customer can return this line item.
   * @deprecated Use `suggestedReturnReasonDefinitions` instead.
   */
  supportedReturnReasons: Array<ReturnSupportedReason>;
  /** The title of the product or variant. This field only applies to custom line items. */
  title: Scalars['String']['output'];
  /** The total of the discount allocations on this line item, resulting from discounts applied specifically to this line item. */
  totalDiscount: MoneyV2;
  /** The total price of the line item, calculated by multiplying the current unit price of the variant by the quantity, expressed in presentment currencies. */
  totalPrice?: Maybe<MoneyV2>;
  /** The total price of the line item, calculated by multiplying the unit price of the variant (before any discounts) by the quantity, expressed in presentment currencies. */
  totalPriceBeforeDiscounts?: Maybe<MoneyV2>;
  /** The total price of the line item, calculated by multiplying the unit price of the variant (after line item discounts) by the quantity, expressed in presentment currencies. */
  totalPriceWithDiscounts?: Maybe<MoneyV2>;
  /** The unit price of the line item in presentment currencies. */
  unitPrice?: Maybe<UnitPrice>;
  /** The ID of the variant. */
  variantId?: Maybe<Scalars['ID']['output']>;
  /** The options of the product variant. */
  variantOptions?: Maybe<Array<LineItemVariantOption>>;
  /** The name of the variant. */
  variantTitle?: Maybe<Scalars['String']['output']>;
  /** The product's vendor. */
  vendor?: Maybe<Scalars['String']['output']>;
};


/** A single line item in an order. */
export type LineItemSuggestedReturnReasonDefinitionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An auto-generated type for paginating through multiple LineItems. */
export type LineItemConnection = {
  __typename?: 'LineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<LineItemEdge>;
  /** A list of nodes that are contained in LineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<LineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The information about the line item category for the order. */
export type LineItemContainer = RemainingLineItemContainer | UnfulfilledDigitalLineItemContainer | UnfulfilledGiftCardLineItemContainer | UnfulfilledLineItemContainer | UnfulfilledPhysicalLineItemContainer;

/** The information about the line item in the line item container. */
export type LineItemContainerLineItem = Node & {
  __typename?: 'LineItemContainerLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The line item associated with the container. */
  lineItem: LineItem;
  /** The number of units yet to be fulfilled. */
  remainingQuantity: Scalars['Int']['output'];
  /** The total number of units in this fulfillment. */
  totalQuantity: Scalars['Int']['output'];
};

/** An auto-generated type for paginating through multiple LineItemContainerLineItems. */
export type LineItemContainerLineItemConnection = {
  __typename?: 'LineItemContainerLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<LineItemContainerLineItemEdge>;
  /** A list of nodes that are contained in LineItemContainerLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<LineItemContainerLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one LineItemContainerLineItem and a cursor during pagination. */
export type LineItemContainerLineItemEdge = {
  __typename?: 'LineItemContainerLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of LineItemContainerLineItemEdge. */
  node: LineItemContainerLineItem;
};

/** The discount information for a specific line item. */
export type LineItemDiscountInformation = {
  __typename?: 'LineItemDiscountInformation';
  /** The value of the applied discount. */
  discountValue: MoneyV2;
  /** The discount's name that displays to merchants in the Shopify admin and to customers. */
  title?: Maybe<Scalars['String']['output']>;
};

/** An auto-generated type which holds one LineItem and a cursor during pagination. */
export type LineItemEdge = {
  __typename?: 'LineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of LineItemEdge. */
  node: LineItem;
};

/** A line item group to which a line item belongs to. */
export type LineItemGroup = Node & {
  __typename?: 'LineItemGroup';
  /** The total price of the line item group, calculated by aggregating the current total price of its line item components. */
  currentTotalPrice?: Maybe<MoneyV2>;
  /**
   * Whether the group merchandise is itself deliverable.
   * @deprecated Use `is_concrete` instead.
   */
  deliverable?: Maybe<Scalars['Boolean']['output']>;
  /** The discount information for the line item group. */
  discountInformation?: Maybe<Array<LineItemDiscountInformation>>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The image of the line item group variant or the product image if the variant has no image. */
  image?: Maybe<Image>;
  /** Whether the group represents concrete merchandise (as opposed to virtual merchandise). */
  isConcrete?: Maybe<Scalars['Boolean']['output']>;
  /** ID of the parent line item. */
  parentLineItemId?: Maybe<Scalars['ID']['output']>;
  /** The title of the parent variant. */
  parentVariantTitle?: Maybe<Scalars['String']['output']>;
  /** The number of line item groups ordered. */
  quantity: Scalars['Int']['output'];
  /** The title of the line item group. */
  title: Scalars['String']['output'];
  /** The total price of the line item group, calculated by aggregating the total price before discounts of its line item components. */
  totalPriceBeforeDiscounts?: Maybe<MoneyV2>;
};

/** The selling plan for a line item. */
export type LineItemSellingPlan = {
  __typename?: 'LineItemSellingPlan';
  /** The name of the selling plan for display purposes. */
  name: Scalars['String']['output'];
  /** The ID of the selling plan associated with the line item. */
  sellingPlanId?: Maybe<Scalars['ID']['output']>;
};

/** The line item's variant option. */
export type LineItemVariantOption = {
  __typename?: 'LineItemVariantOption';
  /** The name of the option. */
  name: Scalars['String']['output'];
  /** The value of the option. */
  value: Scalars['String']['output'];
};

/** Captures the intentions of a discount that was manually created. */
export type ManualDiscountApplication = DiscountApplication & {
  __typename?: 'ManualDiscountApplication';
  /** The method by which the discount's value is allocated to its entitled items. */
  allocationMethod: DiscountApplicationAllocationMethod;
  /** The description of the application. */
  description?: Maybe<Scalars['String']['output']>;
  /** The lines of targetType that the discount is allocated over. */
  targetSelection: DiscountApplicationTargetSelection;
  /** The type of line that the discount is applicable towards. */
  targetType: DiscountApplicationTargetType;
  /** The title of the application. */
  title: Scalars['String']['output'];
  /** The value of the discount application. */
  value: PricingValue;
};

/**
 * A market, which is a group of one or more regions targeted for international sales.
 * A market allows configuration of a distinct, localized shopping experience for customers from a specific area of the world.
 */
export type Market = Node & {
  __typename?: 'Market';
  /** The short, human-readable unique identifier for the market. */
  handle: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /**
   * The web presence of the market, defining its SEO strategy. This can be a different domain,
   * subdomain, or subfolders of the primary domain. Each web presence comprises one or more
   * language variants. If a market doesn't have its own web presence, an inherited web presence will be returned.
   */
  webPresence?: Maybe<MarketWebPresence>;
};

/**
 * The web presence of the market, defining its SEO strategy. This can be a different domain
 * (e.g. `example.ca`), subdomain (e.g. `ca.example.com`), or subfolders of the primary
 * domain (e.g. `example.com/en-ca`). Each web presence comprises one or more language
 * variants. If a market does not have its own web presence, it is accessible on the shop’s
 * primary domain via [country
 * selectors](https://shopify.dev/themes/internationalization/multiple-currencies-languages#the-country-selector).
 *
 * Note: while the domain/subfolders defined by a market’s web presence are not applicable to
 * custom storefronts, which must manage their own domains and routing, the languages chosen
 * here do govern [the languages available on the Storefront
 * API](https://shopify.dev/custom-storefronts/internationalization/multiple-languages) for the countries in
 * this market.
 */
export type MarketWebPresence = Node & {
  __typename?: 'MarketWebPresence';
  /**
   * The domain of the web presence.
   * This field will be null if `subfolderSuffix` isn't null.
   */
  domain?: Maybe<Domain>;
  /** A globally-unique identifier. */
  id: Scalars['ID']['output'];
  /** The list of root URLs for each of the web presence’s locales. */
  rootUrls: Array<MarketWebPresenceRootUrl>;
  /** The market-specific suffix of the subfolders defined by the web presence. Example: in `/en-us` the subfolder suffix is `us`. This field will be null if `domain` isn't null. */
  subfolderSuffix?: Maybe<Scalars['String']['output']>;
};

/** The URL for the homepage of the online store in the context of a particular market and a particular locale. */
export type MarketWebPresenceRootUrl = {
  __typename?: 'MarketWebPresenceRootUrl';
  /** The locale in which the storefront loads. */
  locale: Scalars['String']['output'];
  /** The URL of the homepage. */
  url: Scalars['URL']['output'];
};

/** Represents a media interface. */
export type Media = {
  /** A word or phrase to share the nature or contents of a media. */
  alt?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The media content type. */
  mediaContentType: MediaContentType;
  /** The preview image for the media. */
  previewImage?: Maybe<Image>;
};

/** The content types that a media can have. */
export const MediaContentType = {
  /** A Shopify hosted generic file. */
  GenericFile: 'GENERIC_FILE',
  /** A Shopify hosted image. */
  Image: 'IMAGE',
  /** A Shopify hosted 3D model. */
  Model_3D: 'MODEL_3D',
  /** A Shopify hosted video. */
  Video: 'VIDEO'
} as const;

export type MediaContentType = typeof MediaContentType[keyof typeof MediaContentType];
/** Represents a Shopify hosted image. */
export type MediaImage = Media & {
  __typename?: 'MediaImage';
  /** A word or phrase to share the nature or contents of a media. */
  alt?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The image for the media. */
  image?: Maybe<Image>;
  /** The media content type. */
  mediaContentType: MediaContentType;
  /** The preview image for the media. */
  previewImage?: Maybe<Image>;
};

/**
 * The custom metadata attached to a resource. Metafields can be sorted into namespaces and are
 * comprised of keys, values, and value types.
 */
export type Metafield = HasCompareDigest & Node & {
  __typename?: 'Metafield';
  /** The data stored in the resource, represented as a digest. */
  compareDigest: Scalars['String']['output'];
  /** The date and time when the metafield was created. */
  createdAt: Scalars['DateTime']['output'];
  /**
   * The description of a metafield.
   * @deprecated This field will be removed in a future release. Use the `description` on the metafield definition instead.
   *
   */
  description?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The data stored in the metafield in JSON format. */
  jsonValue: Scalars['JSON']['output'];
  /** The key name for a metafield. */
  key: Scalars['String']['output'];
  /** The namespace for a metafield. */
  namespace: Scalars['String']['output'];
  /** Returns a reference object if the metafield's type is a resource reference. */
  reference?: Maybe<MetafieldReference>;
  /** A list of reference objects if the metafield's type is a resource reference list. */
  references?: Maybe<MetafieldReferenceConnection>;
  /**
   * The type name of the metafield.
   * See the list of [supported types](https://shopify.dev/apps/metafields/definitions/types).
   */
  type: Scalars['String']['output'];
  /** The date and time when the metafield was updated. */
  updatedAt: Scalars['DateTime']['output'];
  /** The value of a metafield. */
  value: Scalars['String']['output'];
};


/**
 * The custom metadata attached to a resource. Metafields can be sorted into namespaces and are
 * comprised of keys, values, and value types.
 */
export type MetafieldReferencesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};

/** Identifies a metafield by its owner resource, namespace, and key. */
export type MetafieldIdentifier = {
  __typename?: 'MetafieldIdentifier';
  /** The key of the metafield. */
  key: Scalars['String']['output'];
  /** The namespace of the metafield. */
  namespace: Scalars['String']['output'];
  /** GID of the owner resource that the metafield belongs to. */
  ownerId: Scalars['ID']['output'];
};

/** The input fields that identify metafields. */
export type MetafieldIdentifierInput = {
  /** The key of the metafield. */
  key: Scalars['String']['input'];
  /** The namespace of the metafield. */
  namespace: Scalars['String']['input'];
  /** The unique ID of the resource that the metafield is attached to. */
  ownerId: Scalars['ID']['input'];
};

/** Returns the resource which is being referred to by a metafield. */
export type MetafieldReference = GenericFile | MediaImage | Metaobject | Model3d | Video;

/** An auto-generated type for paginating through multiple MetafieldReferences. */
export type MetafieldReferenceConnection = {
  __typename?: 'MetafieldReferenceConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<MetafieldReferenceEdge>;
  /** A list of nodes that are contained in MetafieldReferenceEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<MetafieldReference>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one MetafieldReference and a cursor during pagination. */
export type MetafieldReferenceEdge = {
  __typename?: 'MetafieldReferenceEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of MetafieldReferenceEdge. */
  node: MetafieldReference;
};

/** Value type to describe the Metafield value. */
export const MetafieldValueType = {
  /** A boolean metafield. */
  Boolean: 'BOOLEAN',
  /** A float. */
  Float: 'FLOAT',
  /** An integer. */
  Integer: 'INTEGER',
  /** A JSON string. */
  JsonString: 'JSON_STRING',
  /** A string. */
  String: 'STRING'
} as const;

export type MetafieldValueType = typeof MetafieldValueType[keyof typeof MetafieldValueType];
/** Return type for `metafieldsDelete` mutation. */
export type MetafieldsDeletePayload = {
  __typename?: 'MetafieldsDeletePayload';
  /** List of metafield identifiers that were deleted, null if the corresponding metafield isn't found. */
  deletedMetafields?: Maybe<Array<Maybe<MetafieldIdentifier>>>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<MetafieldsDeleteUserError>;
};

/** An error that occurs during the execution of `MetafieldsDelete`. */
export type MetafieldsDeleteUserError = DisplayableError & {
  __typename?: 'MetafieldsDeleteUserError';
  /** The error code. */
  code?: Maybe<MetafieldsDeleteUserErrorCode>;
  /** The index of the array element that's causing the error. */
  elementIndex?: Maybe<Scalars['Int']['output']>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `MetafieldsDeleteUserError`. */
export const MetafieldsDeleteUserErrorCode = {
  /** The input value is blank. */
  Blank: 'BLANK',
  /** Owner type can't be used in this mutation. */
  DisallowedOwnerType: 'DISALLOWED_OWNER_TYPE',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** The metafield delete operation failed. */
  MetafieldDeleteFailed: 'METAFIELD_DELETE_FAILED',
  /** The record with the ID used as the input value couldn't be found. */
  NotFound: 'NOT_FOUND'
} as const;

export type MetafieldsDeleteUserErrorCode = typeof MetafieldsDeleteUserErrorCode[keyof typeof MetafieldsDeleteUserErrorCode];
/** The input fields for a metafield value to set. */
export type MetafieldsSetInput = {
  /** The `compareDigest` value obtained from a previous query. Provide this with updates to ensure the metafield is modified safely. */
  compareDigest?: InputMaybe<Scalars['String']['input']>;
  /**
   * The unique identifier for a metafield within its namespace.
   * Must be 2-64 characters long and can contain alphanumeric, hyphen, and underscore characters.
   */
  key: Scalars['String']['input'];
  /**
   * The container for a group of metafields that the metafield is or will be associated with. Used in tandem
   * with `key` to lookup a metafield on a resource, preventing conflicts with other metafields with the
   * same `key`.
   * Must be 3-255 characters long and can contain alphanumeric, hyphen, and underscore characters.
   */
  namespace: Scalars['String']['input'];
  /** The unique ID of the resource that the metafield is attached to. */
  ownerId: Scalars['ID']['input'];
  /**
   * The type of data that is stored in the metafield.
   * The type must be one of the [supported types](https://shopify.dev/apps/metafields/types).
   * Required when there is no corresponding definition for the given `namespace`, `key`, and
   * owner resource type (derived from `ownerId`).
   */
  type?: InputMaybe<Scalars['String']['input']>;
  /** The data stored in the metafield. Always stored as a string, regardless of the metafield's type. */
  value: Scalars['String']['input'];
};

/** Return type for `metafieldsSet` mutation. */
export type MetafieldsSetPayload = {
  __typename?: 'MetafieldsSetPayload';
  /** The list of metafields that were set. */
  metafields?: Maybe<Array<Metafield>>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<MetafieldsSetUserError>;
};

/** An error that occurs during the execution of `MetafieldsSet`. */
export type MetafieldsSetUserError = DisplayableError & {
  __typename?: 'MetafieldsSetUserError';
  /** The error code. */
  code?: Maybe<MetafieldsSetUserErrorCode>;
  /** The index of the array element that's causing the error. */
  elementIndex?: Maybe<Scalars['Int']['output']>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `MetafieldsSetUserError`. */
export const MetafieldsSetUserErrorCode = {
  /** ApiPermission metafields can only be created or updated by the app owner. */
  AppNotAuthorized: 'APP_NOT_AUTHORIZED',
  /** The input value is blank. */
  Blank: 'BLANK',
  /** Owner type can't be used in this mutation. */
  DisallowedOwnerType: 'DISALLOWED_OWNER_TYPE',
  /** The input value isn't included in the list. */
  Inclusion: 'INCLUSION',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** The compareDigest is invalid. */
  InvalidCompareDigest: 'INVALID_COMPARE_DIGEST',
  /** The type is invalid. */
  InvalidType: 'INVALID_TYPE',
  /** The value is invalid for metafield type or for definition options. */
  InvalidValue: 'INVALID_VALUE',
  /** The input value should be less than or equal to the maximum value allowed. */
  LessThanOrEqualTo: 'LESS_THAN_OR_EQUAL_TO',
  /** The input value needs to be blank. */
  Present: 'PRESENT',
  /** The metafield has been modified since it was loaded. */
  StaleObject: 'STALE_OBJECT',
  /** The input value is already taken. */
  Taken: 'TAKEN',
  /** The input value is too long. */
  TooLong: 'TOO_LONG',
  /** The input value is too short. */
  TooShort: 'TOO_SHORT'
} as const;

export type MetafieldsSetUserErrorCode = typeof MetafieldsSetUserErrorCode[keyof typeof MetafieldsSetUserErrorCode];
/** An instance of a user-defined model based on a MetaobjectDefinition. */
export type Metaobject = Node & {
  __typename?: 'Metaobject';
  /** Accesses a field of the object by key. */
  field?: Maybe<MetaobjectField>;
  /**
   * All object fields with defined values.
   * Omitted object keys can be assumed null, and no guarantees are made about field order.
   */
  fields: Array<MetaobjectField>;
  /** The unique handle of the metaobject. Useful as a custom ID. */
  handle: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The type of the metaobject. */
  type: Scalars['String']['output'];
  /** The date and time when the metaobject was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** An instance of a user-defined model based on a MetaobjectDefinition. */
export type MetaobjectFieldArgs = {
  key: Scalars['String']['input'];
};

/** Provides the value of a Metaobject field. */
export type MetaobjectField = {
  __typename?: 'MetaobjectField';
  /** The field key. */
  key: Scalars['String']['output'];
  /** A referenced object if the field type is a resource reference. */
  reference?: Maybe<MetafieldReference>;
  /**
   * The type name of the field.
   * See the list of [supported types](https://shopify.dev/apps/metafields/definitions/types).
   */
  type: Scalars['String']['output'];
  /** The field value. */
  value?: Maybe<Scalars['String']['output']>;
};

/** Represents a Shopify hosted 3D model. */
export type Model3d = Media & {
  __typename?: 'Model3d';
  /** A word or phrase to share the nature or contents of a media. */
  alt?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The media content type. */
  mediaContentType: MediaContentType;
  /** The preview image for the media. */
  previewImage?: Maybe<Image>;
  /** The sources for a 3d model. */
  sources: Array<Model3dSource>;
};

/** Represents a source for a Shopify hosted 3d model. */
export type Model3dSource = {
  __typename?: 'Model3dSource';
  /** The filesize of the 3d model. */
  filesize: Scalars['Int']['output'];
  /** The format of the 3d model. */
  format: Scalars['String']['output'];
  /** The MIME type of the 3d model. */
  mimeType: Scalars['String']['output'];
  /** The URL of the 3d model. */
  url: Scalars['String']['output'];
};

/** A collection of monetary values in their respective currencies. Used throughout the API for multi-currency pricing and transactions, when an amount in the shop's currency is converted to the customer's currency of choice. The `presentmentMoney` field contains the amount in the customer's selected currency. The `shopMoney` field contains the equivalent in the shop's base currency. */
export type MoneyBag = {
  __typename?: 'MoneyBag';
  /** Amount in presentment currency. */
  presentmentMoney: MoneyV2;
  /** Amount in shop currency. */
  shopMoney: MoneyV2;
};

/** A precise monetary value and its associated currency. Combines a decimal amount with a three-letter currency code to express prices, costs, and other financial values throughout the API. For example, 12.99 USD. */
export type MoneyV2 = {
  __typename?: 'MoneyV2';
  /**
   * A monetary value in decimal format, allowing for precise representation of cents or fractional
   * currency. For example, 12.99.
   */
  amount: Scalars['Decimal']['output'];
  /**
   * The three-letter currency code that represents a world currency used in a store. Currency codes
   * include standard [standard ISO 4217 codes](https://en.wikipedia.org/wiki/ISO_4217), legacy codes,
   * and non-standard codes. For example, USD.
   */
  currencyCode: CurrencyCode;
};

/** This is the schema's entry point for all mutation operations. */
export type Mutation = {
  __typename?: 'Mutation';
  /** Adds a new credit card using Apple Pay. */
  applePayCreditCardAdd?: Maybe<ApplePayCreditCardAddPayload>;
  /** Updates a credit card using Apple Pay. */
  applePayCreditCardUpdate?: Maybe<ApplePayCreditCardUpdatePayload>;
  /** Creates a new Apple Pay session. */
  applePaySessionCreate?: Maybe<ApplePaySessionCreatePayload>;
  /** Updates the information for a business contact. */
  businessContactUpdate?: Maybe<BusinessContactUpdatePayload>;
  /** Adds a new credit card to the available payment methods of a customer. */
  businessLocationCreditCardAdd?: Maybe<BusinessLocationCreditCardAddPayload>;
  /** Updates the details of a credit card for a customer. */
  businessLocationCreditCardUpdate?: Maybe<BusinessLocationCreditCardUpdatePayload>;
  /** Removes a payment instrument from a customer. */
  businessLocationPaymentInstrumentRemove?: Maybe<BusinessLocationPaymentInstrumentRemovePayload>;
  /** Updates an address on a company location. */
  companyLocationAssignAddress?: Maybe<CompanyLocationAssignAddressPayload>;
  /** Adds a new credit card to a customer's list of available payment methods. */
  creditCardAdd?: Maybe<CreditCardAddPayload>;
  /** Updates the details of a customer's credit card. */
  creditCardUpdate?: Maybe<CreditCardUpdatePayload>;
  /** Creates a new address for a customer. */
  customerAddressCreate?: Maybe<CustomerAddressCreatePayload>;
  /** Deletes a specific address for a customer. */
  customerAddressDelete?: Maybe<CustomerAddressDeletePayload>;
  /** Updates a specific address for a customer. */
  customerAddressUpdate?: Maybe<CustomerAddressUpdatePayload>;
  /** Subscribes the customer's email to marketing. */
  customerEmailMarketingOptIn?: Maybe<CustomerEmailMarketingOptInPayload>;
  /** Subscribes the customer to email marketing. */
  customerEmailMarketingSubscribe?: Maybe<CustomerEmailMarketingSubscribePayload>;
  /** Unsubscribes the customer from email marketing. */
  customerEmailMarketingUnsubscribe?: Maybe<CustomerEmailMarketingUnsubscribePayload>;
  /** Updates the customer's personal information. */
  customerUpdate?: Maybe<CustomerUpdatePayload>;
  /** Adds a new credit card by using Google Pay. */
  googlePayCreditCardAdd?: Maybe<GooglePayCreditCardAddPayload>;
  /** Updates a credit card using Google Pay. */
  googlePayCreditCardUpdate?: Maybe<GooglePayCreditCardUpdatePayload>;
  /** Deletes multiple metafields in bulk. */
  metafieldsDelete?: Maybe<MetafieldsDeletePayload>;
  /**
   * Sets metafield values. Metafield values will be set regardless if they were previously created or not.
   *
   * Allows a maximum of 25 metafields to be set at a time.
   *
   * This operation is atomic, meaning no changes are persisted if an error is encountered.
   *
   * As of `2024-07`, this operation supports compare-and-set functionality to better handle concurrent requests.
   * If `compareDigest` is set for any metafield, the mutation will only set that metafield if the persisted metafield value matches the digest used on `compareDigest`.
   * If the metafield doesn't exist yet, but you want to guarantee that the operation will run in a safe manner, set `compareDigest` to `null`.
   * The `compareDigest` value can be acquired by querying the metafield object and selecting `compareDigest` as a field.
   * If the `compareDigest` value does not match the digest for the persisted value, the mutation will return an error.
   * You can opt out of write guarantees by not sending `compareDigest` in the request.
   */
  metafieldsSet?: Maybe<MetafieldsSetPayload>;
  /** Request a new return on behalf of a customer. */
  orderRequestReturn?: Maybe<OrderRequestReturnPayload>;
  /** Adds a new payment instrument and associates mandates. Returns the created instrument on success. */
  paymentInstrumentAdd?: Maybe<PaymentInstrumentAddPayload>;
  /** Removes a payment instrument from a customer's account. */
  paymentInstrumentRemove?: Maybe<PaymentInstrumentRemovePayload>;
  /** Replace existing payment mandates with a new (or existing) instrument. Subscriptions require special treatment. */
  paymentInstrumentReplace?: Maybe<PaymentInstrumentReplacePayload>;
  /** Updates a customer's default payment instrument. */
  paymentInstrumentUpdateDefault?: Maybe<PaymentInstrumentUpdateDefaultPayload>;
  /** Connects a customer's PayPal account for use as a payment method. */
  paypalAccountEnable?: Maybe<PaypalAccountEnablePayload>;
  /** Creates a PayPal Express token. */
  paypalTokenCreate?: Maybe<PaypalTokenCreatePayload>;
  /** Resends a gift card to the customer. */
  resendGiftCard?: Maybe<ResendGiftCardPayload>;
  /** Provides a URL that enables the customer to update a Shop Pay credit card. */
  shopPayCreditCardGetUpdateUrl?: Maybe<ShopPayCreditCardGetUpdateUrlPayload>;
  /**
   * Exchanges the Customer Access Token, provided in the Authorization header, into a Storefront Customer Access Token.
   * Renew this token each time you update the Customer Access Token found in the Authorization header.
   * @deprecated The `storefrontCustomerAccessTokenCreate` is deprecated and will be removed in a future version. Please see [the changelog](https://shopify.dev/changelog/deprecation-of-storefrontcustomeraccesstokencreate-mutation) for more information.
   */
  storefrontCustomerAccessTokenCreate?: Maybe<StorefrontCustomerAccessTokenCreatePayload>;
  /** Initiates a new Stripe Financial Connections session. */
  stripeFinancialConnectionsSessionInitiate?: Maybe<StripeFinancialConnectionsSessionInitiatePayload>;
  /** Skips a Subscription Billing Cycle. */
  subscriptionBillingCycleSkip?: Maybe<SubscriptionBillingCycleSkipPayload>;
  /** Unskips a Subscription Billing Cycle. */
  subscriptionBillingCycleUnskip?: Maybe<SubscriptionBillingCycleUnskipPayload>;
  /** Activates a Subscription Contract. Contract status must be either active, paused, or failed. */
  subscriptionContractActivate?: Maybe<SubscriptionContractActivatePayload>;
  /** Cancels a Subscription Contract. */
  subscriptionContractCancel?: Maybe<SubscriptionContractCancelPayload>;
  /** Changes the payment instrument used for future billing cycles of a Subscription Contract. */
  subscriptionContractChangePaymentInstrument?: Maybe<SubscriptionContractChangePaymentInstrumentPayload>;
  /** Fetches the available delivery options for a Subscription Contract. */
  subscriptionContractFetchDeliveryOptions?: Maybe<SubscriptionContractFetchDeliveryOptionsPayload>;
  /** Pauses a Subscription Contract. */
  subscriptionContractPause?: Maybe<SubscriptionContractPausePayload>;
  /** Selects an option from a delivery options result and updates the delivery method on a Subscription Contract. */
  subscriptionContractSelectDeliveryMethod?: Maybe<SubscriptionContractSelectDeliveryMethodPayload>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationApplePayCreditCardAddArgs = {
  applePayTokenizedCard: Scalars['String']['input'];
  billingAddress: ApplePayBillingAddressInput;
  displayLastDigits?: InputMaybe<Scalars['String']['input']>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationApplePayCreditCardUpdateArgs = {
  applePayTokenizedCard: Scalars['String']['input'];
  billingAddress: ApplePayBillingAddressInput;
  displayLastDigits?: InputMaybe<Scalars['String']['input']>;
  paymentMethodId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationApplePaySessionCreateArgs = {
  resourceId: Scalars['String']['input'];
  validationUrl: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationBusinessContactUpdateArgs = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  input: BusinessContactUpdateInput;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationBusinessLocationCreditCardAddArgs = {
  billingAddress: CustomerMailingAddressInput;
  companyLocationId: Scalars['ID']['input'];
  sessionId: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationBusinessLocationCreditCardUpdateArgs = {
  billingAddress: CustomerMailingAddressInput;
  companyLocationId: Scalars['ID']['input'];
  paymentMethodId: Scalars['ID']['input'];
  sessionId: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationBusinessLocationPaymentInstrumentRemoveArgs = {
  companyLocationId: Scalars['ID']['input'];
  paymentInstrumentId: Scalars['ID']['input'];
  replacementPaymentInstrumentId?: InputMaybe<Scalars['ID']['input']>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCompanyLocationAssignAddressArgs = {
  address: CompanyAddressInput;
  addressTypes: Array<CompanyAddressType>;
  locationId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCreditCardAddArgs = {
  billingAddress: CustomerMailingAddressInput;
  default?: InputMaybe<Scalars['Boolean']['input']>;
  sessionId: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCreditCardUpdateArgs = {
  billingAddress: CustomerMailingAddressInput;
  paymentMethodId: Scalars['ID']['input'];
  sessionId: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCustomerAddressCreateArgs = {
  address: CustomerAddressInput;
  defaultAddress?: InputMaybe<Scalars['Boolean']['input']>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCustomerAddressDeleteArgs = {
  addressId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCustomerAddressUpdateArgs = {
  address?: InputMaybe<CustomerAddressInput>;
  addressId: Scalars['ID']['input'];
  defaultAddress?: InputMaybe<Scalars['Boolean']['input']>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationCustomerUpdateArgs = {
  input: CustomerUpdateInput;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationGooglePayCreditCardAddArgs = {
  billingAddress: GooglePayBillingAddressInput;
  googlePayTokenizedCard: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationGooglePayCreditCardUpdateArgs = {
  billingAddress: GooglePayBillingAddressInput;
  googlePayTokenizedCard: Scalars['String']['input'];
  paymentMethodId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationMetafieldsDeleteArgs = {
  metafields: Array<MetafieldIdentifierInput>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationMetafieldsSetArgs = {
  metafields: Array<MetafieldsSetInput>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationOrderRequestReturnArgs = {
  orderId: Scalars['ID']['input'];
  requestedLineItems: Array<RequestedLineItemInput>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationPaymentInstrumentAddArgs = {
  idempotencyKey: Scalars['String']['input'];
  instrument: PaymentInstrumentInput;
  mandates: Array<PaymentMandateInput>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationPaymentInstrumentRemoveArgs = {
  paymentInstrumentId: Scalars['ID']['input'];
  replacementPaymentInstrumentId?: InputMaybe<Scalars['ID']['input']>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationPaymentInstrumentReplaceArgs = {
  id: Scalars['ID']['input'];
  idempotencyKey: Scalars['String']['input'];
  instrument: PaymentInstrumentInput;
  mandates?: InputMaybe<Array<PaymentMandateInput>>;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationPaymentInstrumentUpdateDefaultArgs = {
  default: Scalars['Boolean']['input'];
  paymentInstrumentId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationPaypalAccountEnableArgs = {
  paypalPayerId: Scalars['String']['input'];
  paypalToken: Scalars['String']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationResendGiftCardArgs = {
  orderId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationShopPayCreditCardGetUpdateUrlArgs = {
  paymentMethodId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionBillingCycleSkipArgs = {
  billingCycleInput: SubscriptionBillingCycleInput;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionBillingCycleUnskipArgs = {
  billingCycleInput: SubscriptionBillingCycleInput;
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractActivateArgs = {
  subscriptionContractId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractCancelArgs = {
  subscriptionContractId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractChangePaymentInstrumentArgs = {
  paymentInstrumentId: Scalars['ID']['input'];
  subscriptionContractId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractFetchDeliveryOptionsArgs = {
  address?: InputMaybe<CustomerAddressInput>;
  deliveryAddress?: InputMaybe<CustomerMailingAddressInput>;
  subscriptionContractId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractPauseArgs = {
  subscriptionContractId: Scalars['ID']['input'];
};


/** This is the schema's entry point for all mutation operations. */
export type MutationSubscriptionContractSelectDeliveryMethodArgs = {
  deliveryMethodInput: SubscriptionDeliveryMethodInput;
  subscriptionContractId: Scalars['ID']['input'];
  subscriptionDeliveryOptionsResultToken: Scalars['String']['input'];
};

/**
 * An object with an ID field to support global identification, in accordance with the
 * [Relay specification](https://relay.dev/graphql/objectidentification.htm#sec-Node-Interface).
 * This interface is used by the [node](https://shopify.dev/api/admin-graphql/unstable/queries/node)
 * and [nodes](https://shopify.dev/api/admin-graphql/unstable/queries/nodes) queries.
 */
export type Node = {
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
};

/** A line item with at least one unit that is not eligible for return. */
export type NonReturnableLineItem = {
  __typename?: 'NonReturnableLineItem';
  /** The line item associated with the non-returnable units. */
  lineItem: LineItem;
  /** The number of units that aren't eligible for return. */
  quantity: Scalars['Int']['output'];
  /** Details about non-returnable quantities, including the number of units that can't be returned and the reasons they can't be returned, grouped by reason (e.g., already returned, not yet fulfilled). */
  quantityDetails: Array<NonReturnableQuantityDetail>;
};

/** An auto-generated type for paginating through multiple NonReturnableLineItems. */
export type NonReturnableLineItemConnection = {
  __typename?: 'NonReturnableLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<NonReturnableLineItemEdge>;
  /** A list of nodes that are contained in NonReturnableLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<NonReturnableLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one NonReturnableLineItem and a cursor during pagination. */
export type NonReturnableLineItemEdge = {
  __typename?: 'NonReturnableLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of NonReturnableLineItemEdge. */
  node: NonReturnableLineItem;
};

/**
 * Details about non-returnable quantities, including the number of units that can't be returned
 * and the reasons for non-returnability, grouped by reason (e.g., already returned, not yet fulfilled).
 */
export type NonReturnableQuantityDetail = {
  __typename?: 'NonReturnableQuantityDetail';
  /** The number of units that aren't eligible for return. */
  quantity: Scalars['Int']['output'];
  /** The reason why this quantity isn't eligible for return. */
  reasonCode: NonReturnableReason;
};

/** The reason why a line item quantity can't be returned. */
export const NonReturnableReason = {
  /** The line item quantity is final sale. This is only applicable if return rules were in place at the time an order was placed. */
  FinalSale: 'FINAL_SALE',
  /** The line item quantity is ineligible for return for a reason that has not been predefined. */
  Other: 'OTHER',
  /** The line item quantity has already been returned. */
  Returned: 'RETURNED',
  /** The return window for this line item quantity has expired. This is only applicable if return rules were in place at the time an order was placed. */
  ReturnWindowExpired: 'RETURN_WINDOW_EXPIRED',
  /** The line item quantity has not been fulfilled by the merchant. */
  Unfulfilled: 'UNFULFILLED'
} as const;

export type NonReturnableReason = typeof NonReturnableReason[keyof typeof NonReturnableReason];
/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type Order = HasMetafields & Node & {
  __typename?: 'Order';
  /** A list of sales agreements associated with the order. */
  agreements: SalesAgreementConnection;
  /** The mailing address provided by the customer. Not all orders have a mailing address. */
  billingAddress?: Maybe<CustomerAddress>;
  /** The reason for the cancellation of the order. Returns `null` if the order wasn't canceled. */
  cancelReason?: Maybe<OrderCancelReason>;
  /**
   * The date and time when the order was canceled.
   * Returns `null` if the order wasn't canceled.
   */
  cancelledAt?: Maybe<Scalars['DateTime']['output']>;
  /** The checkout token associated with this order. */
  checkoutToken?: Maybe<Scalars['String']['output']>;
  /**
   * A randomly generated alpha-numeric identifier for the order that may be shown to the customer
   * instead of the sequential order name. For example, "XPAV284CT", "R50KELTJP" or "35PKUN0UJ".
   * This value isn't guaranteed to be unique.
   */
  confirmationNumber?: Maybe<Scalars['String']['output']>;
  /** The date and time when the order was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The shop currency when the order was placed. */
  currencyCode: CurrencyCode;
  /** The list of custom attributes associated with the order. */
  customAttributes: Array<Attribute>;
  /** The customer who placed the order. */
  customer?: Maybe<Customer>;
  /** The locale code representing the region where this specific order was placed. */
  customerLocale?: Maybe<Scalars['String']['output']>;
  /** The discounts that have been applied to the order. */
  discountApplications: DiscountApplicationConnection;
  /** The discount information for the order, including line-level discount applications. */
  discountInformation: OrderDiscountInformation;
  /** The draft order associated with the order. */
  draftOrder?: Maybe<DraftOrder>;
  /** The name of the associated draft order. */
  draftOrderName?: Maybe<Scalars['String']['output']>;
  /** The edit summary of the order. */
  editSummary?: Maybe<OrderEditSummary>;
  /** Whether the order has been edited or not. */
  edited: Scalars['Boolean']['output'];
  /** The email address of the customer. */
  email?: Maybe<Scalars['String']['output']>;
  /** The financial status of the order. */
  financialStatus?: Maybe<OrderFinancialStatus>;
  /** The fulfillment status of the order. */
  fulfillmentStatus: OrderFulfillmentStatus;
  /** The fulfillments associated with the order. */
  fulfillments: FulfillmentConnection;
  /** Whether the customer has an email address. */
  hasEmail: Scalars['Boolean']['output'];
  /** Whether the order has multiple fulfillments. */
  hasMultipleFulfillments: Scalars['Boolean']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The delivery or estimated delivery date of the latest fulfillment. */
  latestFulfillmentDeliveryDate?: Maybe<Scalars['DateTime']['output']>;
  /** The merchandise lines marked as fees with total value, aggregated by title. */
  legacyAggregatedMerchandiseTermsAsFees: Array<LegacyAggregatedMerchandiseTermsAsFees>;
  /** Whether or not products marked as fees should be rendered as money lines. */
  legacyRepresentProductsAsFees: Scalars['Boolean']['output'];
  /** The price of the order before duties, shipping, taxes, and fees. */
  legacySubtotalWithoutFees?: Maybe<MoneyV2>;
  /** The list of the order's line item containers (e.g., Unfulfilled). */
  lineItemContainers: Array<LineItemContainer>;
  /** The list of line items of the order. */
  lineItems: LineItemConnection;
  /** The summary of the quantity of line items for the order. */
  lineItemsSummary?: Maybe<OrderLineItemsSummary>;
  /** The name of the fulfillment location assigned at the time of order creation. */
  locationName?: Maybe<Scalars['String']['output']>;
  /**
   * The market that includes the order's shipping address. Or the shop's primary market if the shipping address is empty.
   * @deprecated This `market` field will be removed in a future version of the API.
   */
  market: Market;
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
  /**
   * The identifier for the order that appears on the order.
   * For example, _#1000_ or _Store1001.
   */
  name: Scalars['String']['output'];
  /** The order's notes. */
  note?: Maybe<Scalars['String']['output']>;
  /** A unique numeric identifier for the order, used by both the shop owner and customer. */
  number: Scalars['Int']['output'];
  /** The list of metafields associated with the order receipt. */
  orderReceiptMetafields: Array<Metafield>;
  /** The payment information for the order. */
  paymentInformation?: Maybe<OrderPaymentInformation>;
  /** Represents the merchant configured payment terms. */
  paymentTermsTemplate?: Maybe<PaymentTermsTemplate>;
  /** The phone number of the customer for SMS notifications. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The pickup information for the order. */
  pickupInformation?: Maybe<OrderPickupInformation>;
  /** The purchase order number of the order. */
  poNumber?: Maybe<Scalars['String']['output']>;
  /**
   * The date and time when the order was processed.
   * This value can be set to dates in the past when importing from other systems.
   * If no value is provided, it will be auto-generated based on current date and time.
   */
  processedAt: Scalars['DateTime']['output'];
  /** The purchasing entity for the order. */
  purchasingEntity?: Maybe<PurchasingEntity>;
  /** A list of refunds associated with the order. */
  refunds: Array<Refund>;
  /** The path to recreate the order in the cart and redirect to checkout. Will return nil if the line item count exceeds 100. */
  reorderPath?: Maybe<Scalars['String']['output']>;
  /** Whether the order requires shipping. */
  requiresShipping: Scalars['Boolean']['output'];
  /** A Return identified by ID. */
  return?: Maybe<Return>;
  /** The return information for the order. */
  returnInformation: OrderReturnInformation;
  /** The list of returns for the order with pagination. */
  returns: ReturnConnection;
  /** The mailing address to which the order items are shipped. */
  shippingAddress?: Maybe<CustomerAddress>;
  /** The discounts that have been allocated onto the shipping line by discount applications. */
  shippingDiscountAllocations: Array<DiscountAllocation>;
  /** A summary of all shipping costs on the order. */
  shippingLine?: Maybe<ShippingLine>;
  /** The list of shipping line groups for the order. */
  shippingLineGroups: Array<OrderShippingLineGroup>;
  /** A summary of the shipping titles for the order. */
  shippingTitle?: Maybe<Scalars['String']['output']>;
  /** The various fields for subscribing to order updates via Shop Pay. */
  shopAppLinksAndResources?: Maybe<ShopAppLinksAndResources>;
  /** The totals and quantities for the order, ignoring returns. */
  soldInformation: OrderSoldInformation;
  /** The unique URL for the status page of the order. */
  statusPageUrl: Scalars['URL']['output'];
  /** The customer Subscription Contracts associated with the order. */
  subscriptionContracts?: Maybe<SubscriptionContractConnection>;
  /** The price of the order before duties, shipping, and taxes. */
  subtotal?: Maybe<MoneyV2>;
  /** The price of the order before order-level discounts, duties, shipping. It includes taxes in  tax-inclusive orders. */
  subtotalBeforeDiscounts?: Maybe<MoneyV2>;
  /** A list of tax invoices associated with the order. */
  taxInvoices: Array<TaxInvoice>;
  /** The total cost of shipping after discounts. */
  totalDiscountedShipping: MoneyV2;
  /** The total amount of duties after returns. */
  totalDuties?: Maybe<MoneyV2>;
  /** The total duties and duties status. */
  totalDutiesSummary?: Maybe<OrderDutiesSummary>;
  /** The total amount of the order (including taxes and discounts) minus the amounts for line items that have been returned. */
  totalPrice: MoneyV2;
  /** The total amount refunded. */
  totalRefunded: MoneyV2;
  /** The total cost of shipping. */
  totalShipping: MoneyV2;
  /** The total cost of taxes. */
  totalTax?: Maybe<MoneyV2>;
  /** The total value of tips. */
  totalTip?: Maybe<MoneyV2>;
  /** A list of transactions associated with the order. */
  transactions: Array<OrderTransaction>;
  /** The date and time when the order was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderAgreementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderDiscountApplicationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderFulfillmentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<FulfillmentSortKeys>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderReturnArgs = {
  id: Scalars['ID']['input'];
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderReturnsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<ReturnSortKeys>;
};


/** A customer’s completed request to purchase one or more products from a shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
export type OrderSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/**
 * The possible order action types for a
 * [sales agreement](https://shopify.dev/api/admin-graphql/latest/interfaces/salesagreement).
 */
export const OrderActionType = {
  /** An order with a purchase or charge. */
  Order: 'ORDER',
  /** An edit to the order. */
  OrderEdit: 'ORDER_EDIT',
  /** A refund on the order. */
  Refund: 'REFUND',
  /** A return on the order. */
  Return: 'RETURN',
  /** An unknown agreement action. Represents new actions that may be added in future versions. */
  Unknown: 'UNKNOWN'
} as const;

export type OrderActionType = typeof OrderActionType[keyof typeof OrderActionType];
/** An agreement associated with an order placement. */
export type OrderAgreement = Node & SalesAgreement & {
  __typename?: 'OrderAgreement';
  /** The date and time when the agreement occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the agreement. */
  id: Scalars['ID']['output'];
  /** The order associated with the agreement. */
  order: Order;
  /** The reason the agreement was created. */
  reason: OrderActionType;
  /** The sales associated with the agreement. */
  sales: SaleConnection;
};


/** An agreement associated with an order placement. */
export type OrderAgreementSalesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about all discounts applied to a specific order. */
export type OrderAllDiscounts = {
  __typename?: 'OrderAllDiscounts';
  /** The type of the discount application. */
  discountApplicationType: DiscountApplicationType;
  /** The value of the applied discount. */
  discountValue: MoneyV2;
  /** The type of line to which the discount applies. */
  targetType: DiscountApplicationTargetType;
  /** The discount's name that displays to merchants in the Shopify admin and to customers. */
  title?: Maybe<Scalars['String']['output']>;
};

/** The set of valid sort keys for the OrderByCompany query. */
export const OrderByCompanySortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `order_number` value. */
  OrderNumber: 'ORDER_NUMBER',
  /** Sort by the `processed_at` value. */
  ProcessedAt: 'PROCESSED_AT',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type OrderByCompanySortKeys = typeof OrderByCompanySortKeys[keyof typeof OrderByCompanySortKeys];
/** The set of valid sort keys for the OrderByContact query. */
export const OrderByContactSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `order_number` value. */
  OrderNumber: 'ORDER_NUMBER',
  /** Sort by the `processed_at` value. */
  ProcessedAt: 'PROCESSED_AT',
  /** Sort by the `purchasing_company_location_name` value. */
  PurchasingCompanyLocationName: 'PURCHASING_COMPANY_LOCATION_NAME',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type OrderByContactSortKeys = typeof OrderByContactSortKeys[keyof typeof OrderByContactSortKeys];
/** The set of valid sort keys for the OrderByLocation query. */
export const OrderByLocationSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `order_number` value. */
  OrderNumber: 'ORDER_NUMBER',
  /** Sort by the `processed_at` value. */
  ProcessedAt: 'PROCESSED_AT',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type OrderByLocationSortKeys = typeof OrderByLocationSortKeys[keyof typeof OrderByLocationSortKeys];
/** The reason for the cancellation of the order. */
export const OrderCancelReason = {
  /** The customer wanted to cancel the order. */
  Customer: 'CUSTOMER',
  /** Payment was declined. */
  Declined: 'DECLINED',
  /** The order was fraudulent. */
  Fraud: 'FRAUD',
  /** There was insufficient inventory. */
  Inventory: 'INVENTORY',
  /** The order was canceled for an unlisted reason. */
  Other: 'OTHER',
  /** Staff made an error. */
  Staff: 'STAFF'
} as const;

export type OrderCancelReason = typeof OrderCancelReason[keyof typeof OrderCancelReason];
/** An auto-generated type for paginating through multiple Orders. */
export type OrderConnection = {
  __typename?: 'OrderConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<OrderEdge>;
  /** A list of nodes that are contained in OrderEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<Order>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The disount information for a specific order. */
export type OrderDiscountInformation = {
  __typename?: 'OrderDiscountInformation';
  /** The discount information for the order, including line_level discount applications. */
  allAppliedDiscounts: Array<OrderAllDiscounts>;
  /** The order level discount information for the order. */
  allOrderLevelAppliedDiscounts: Array<OrderAllDiscounts>;
  /** The order level discount information for the order. */
  allOrderLevelAppliedDiscountsOnSoldItems: Array<OrderAllDiscounts>;
  /** Total discounts for the order. */
  totalDiscounts: MoneyV2;
  /** The current order-level discount amount after all order updates. */
  totalOrderLevelAppliedDiscounts: MoneyV2;
};

/** The status of duties for the order. */
export const OrderDutiesStatusType = {
  /** The order is being shipped from another country, so duties and taxes may be charged on delivery. */
  DutiesError: 'DUTIES_ERROR',
  /** The order is being shipped from another country, so duties have been added to the order total. */
  DutiesOk: 'DUTIES_OK',
  /** The order is being shipped from another country. Duties are not charged on orders of this value. */
  DutiesZero: 'DUTIES_ZERO'
} as const;

export type OrderDutiesStatusType = typeof OrderDutiesStatusType[keyof typeof OrderDutiesStatusType];
/** The summary of duties associated with an order. */
export type OrderDutiesSummary = {
  __typename?: 'OrderDutiesSummary';
  /** The total amount of duties for the order. */
  totalDuties?: Maybe<MoneyV2>;
  /** The status of duties for the order. */
  totalDutiesStatus?: Maybe<OrderDutiesStatusType>;
};

/** An auto-generated type which holds one Order and a cursor during pagination. */
export type OrderEdge = {
  __typename?: 'OrderEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of OrderEdge. */
  node: Order;
};

/** An agreement related to an edit of the order. */
export type OrderEditAgreement = Node & SalesAgreement & {
  __typename?: 'OrderEditAgreement';
  /** The date and time when the agreement occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the agreement. */
  id: Scalars['ID']['output'];
  /** The reason the agreement was created. */
  reason: OrderActionType;
  /** The sales associated with the agreement. */
  sales: SaleConnection;
};


/** An agreement related to an edit of the order. */
export type OrderEditAgreementSalesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The edit summary associated with an order. */
export type OrderEditSummary = {
  __typename?: 'OrderEditSummary';
  /** The edit changes of the order. */
  changes: Array<OrderEditSummaryChange>;
  /** The date and time of the latest edit. */
  latestHappenedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** A change in the edit summary of an order. */
export type OrderEditSummaryChange = Node & {
  __typename?: 'OrderEditSummaryChange';
  /** The quantity delta of the change. */
  delta: Scalars['Int']['output'];
  /** The handle that describes the change type. */
  handle?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The line item associated with the change. */
  lineItem: LineItem;
};

/** Represents the order's current financial status. */
export const OrderFinancialStatus = {
  /** Displayed as **Authorized**. */
  Authorized: 'AUTHORIZED',
  /** Displayed as **Expired**. */
  Expired: 'EXPIRED',
  /** Displayed as **Paid**. */
  Paid: 'PAID',
  /** Displayed as **Partially paid**. */
  PartiallyPaid: 'PARTIALLY_PAID',
  /** Displayed as **Partially refunded**. */
  PartiallyRefunded: 'PARTIALLY_REFUNDED',
  /** Displayed as **Pending**. */
  Pending: 'PENDING',
  /** Displayed as **Refunded**. */
  Refunded: 'REFUNDED',
  /** Displayed as **Voided**. */
  Voided: 'VOIDED'
} as const;

export type OrderFinancialStatus = typeof OrderFinancialStatus[keyof typeof OrderFinancialStatus];
/** Represents the order's aggregated fulfillment status for display purposes. */
export const OrderFulfillmentStatus = {
  /** Displayed as **Fulfilled**. All of the items in the order have been fulfilled. */
  Fulfilled: 'FULFILLED',
  /** Displayed as **In progress**. All of the items in the order have had a request for fulfillment sent to the fulfillment service or all of the items have been marked as in progress. */
  InProgress: 'IN_PROGRESS',
  /** Displayed as **On hold**. All of the unfulfilled items in this order are on hold. */
  OnHold: 'ON_HOLD',
  /** Displayed as **Open**. None of the items in the order have been fulfilled. Replaced by "UNFULFILLED" status. */
  Open: 'OPEN',
  /** Displayed as **Partially fulfilled**. Some of the items in the order have been fulfilled. */
  PartiallyFulfilled: 'PARTIALLY_FULFILLED',
  /** Displayed as **Pending fulfillment**. A request for fulfillment of some items awaits a response from the fulfillment service. Replaced by "IN_PROGRESS" status. */
  PendingFulfillment: 'PENDING_FULFILLMENT',
  /** Displayed as **Ready for delivery**. */
  ReadyForDelivery: 'READY_FOR_DELIVERY',
  /** Displayed as **Ready for pickup**. */
  ReadyForPickup: 'READY_FOR_PICKUP',
  /** Displayed as **Restocked**. All of the items in the order have been restocked. Replaced by "UNFULFILLED" status. */
  Restocked: 'RESTOCKED',
  /** Displayed as **Scheduled**. All of the unfulfilled items in this order are scheduled for fulfillment at later time. */
  Scheduled: 'SCHEDULED',
  /** Displayed as **Unfulfilled**. None of the items in the order have been fulfilled. */
  Unfulfilled: 'UNFULFILLED'
} as const;

export type OrderFulfillmentStatus = typeof OrderFulfillmentStatus[keyof typeof OrderFulfillmentStatus];
/** The quantitative information about the line items of a specific order. */
export type OrderLineItemsSummary = {
  __typename?: 'OrderLineItemsSummary';
  /** The number of line items in the order. */
  lineItemCount: Scalars['Int']['output'];
  /** The total quantity of all legacy fees in the order. */
  totalQuantityOfLegacyFeesLineItems: Scalars['Int']['output'];
  /** The total quantity of all line items in the order. */
  totalQuantityOfLineItems: Scalars['Int']['output'];
  /** The total quantity of all tips in the order. */
  totalQuantityOfTipLineItems: Scalars['Int']['output'];
};

/** The summary of reasons why the order is ineligible for return. */
export type OrderNonReturnableSummary = {
  __typename?: 'OrderNonReturnableSummary';
  /** Distinct reasons why line items in the order are ineligible for return. */
  nonReturnableReasons: Array<NonReturnableReason>;
  /** A message displayed to the customer summarizing why the order is ineligible for return. */
  summaryMessage?: Maybe<Scalars['String']['output']>;
};

/** The summary of payment status information for the order. */
export type OrderPaymentInformation = {
  __typename?: 'OrderPaymentInformation';
  /** The URL for collecting a payment on the order. */
  paymentCollectionUrl?: Maybe<Scalars['URL']['output']>;
  /** The financial status of the order. */
  paymentStatus?: Maybe<OrderPaymentStatus>;
  /** The payment terms linked with the order. */
  paymentTerms?: Maybe<PaymentTerms>;
  /** The total amount that's yet to be transacted for the order. */
  totalOutstandingAmount: MoneyV2;
  /** The total amount that has been paid for the order before any refund. */
  totalPaidAmount: MoneyV2;
};

/** The current payment status of the order. */
export const OrderPaymentStatus = {
  /** The payment has been authorized. */
  Authorized: 'AUTHORIZED',
  /** The payment has expired. */
  Expired: 'EXPIRED',
  /** The payment has been paid. */
  Paid: 'PAID',
  /** The payment has been partially paid. */
  PartiallyPaid: 'PARTIALLY_PAID',
  /** The payment has been partially refunded. */
  PartiallyRefunded: 'PARTIALLY_REFUNDED',
  /** The payment is pending. */
  Pending: 'PENDING',
  /** The payment has been refunded. */
  Refunded: 'REFUNDED',
  /** The payment has been voided. */
  Voided: 'VOIDED'
} as const;

export type OrderPaymentStatus = typeof OrderPaymentStatus[keyof typeof OrderPaymentStatus];
/** The pickup information associated with an order. */
export type OrderPickupInformation = {
  __typename?: 'OrderPickupInformation';
  /** The pickup address for the order. */
  address?: Maybe<PickupAddress>;
  /** The date and time when the pickup order was created. */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** The pickup status for the order. */
  status?: Maybe<PickupStatus>;
  /** The date and time when the pickup order was updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

/** Return type for `orderRequestReturn` mutation. */
export type OrderRequestReturnPayload = {
  __typename?: 'OrderRequestReturnPayload';
  /** The return request that has been made. */
  return?: Maybe<Return>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<ReturnUserError>;
};

/** The return information for a specific order. */
export type OrderReturnInformation = {
  __typename?: 'OrderReturnInformation';
  /** Whether the order has one or more restocking fees associated with its returnable line items. */
  hasRestockingFee: Scalars['Boolean']['output'];
  /** Whether the order has one or more return promises associated with any of its line items. */
  hasReturnPromise: Scalars['Boolean']['output'];
  /** Whether the order has one or more return shipping fees associated with its returnable line items. */
  hasReturnShippingFee: Scalars['Boolean']['output'];
  /** The line items that are not eligible for return. */
  nonReturnableLineItems: NonReturnableLineItemConnection;
  /** The summary of reasons why the order is ineligible for return. */
  nonReturnableSummary?: Maybe<OrderNonReturnableSummary>;
  /** The subtotal of all fees associated with return processing that have been applied to the order (e.g. return shipping fees or restocking fees), aggregated by fee type. */
  returnFees: Array<ReturnFee>;
  /**
   * Note for the buyer about the return shipping method. Possible values are: "merchant_provided_label",
   * "no_shipping_required", or a localized message that the buyer is responsible for return shipping.
   */
  returnShippingMethodNote?: Maybe<Scalars['String']['output']>;
  /** A set of return shipping methods associated with the order's returnable line items. Return shipping methods are defined by the return rules at the time the order is placed. */
  returnShippingMethods: Array<ReturnShippingMethod>;
  /** The line items that are eligible for return. */
  returnableLineItems: ReturnableLineItemConnection;
};


/** The return information for a specific order. */
export type OrderReturnInformationNonReturnableLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The return information for a specific order. */
export type OrderReturnInformationReturnableLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The group including the shipping lines of the order. */
export type OrderShippingLineGroup = {
  __typename?: 'OrderShippingLineGroup';
  /** The type of the shipping group. */
  groupType: DeliveryOptionGroupType;
  /** The price of the shipping method after discounts. */
  lineAmountAfterDiscounts: MoneyV2;
};

/** A summary that regroups totals for an order, including the line items that have been returned. */
export type OrderSoldInformation = {
  __typename?: 'OrderSoldInformation';
  /** The total quantity of line items in the order, including the quantities for line items that have been returned. */
  quantity: Scalars['Int']['output'];
  /** The total quantity of line items in the order that were refunded, even if the totalRefunded amount was zero. */
  refundedQuantity: Scalars['Int']['output'];
  /** The total amount of the order (before shipping and discounts), including the amounts for line items that have been returned. */
  subtotal?: Maybe<MoneyV2>;
  /** The total amount of the order (including taxes and discounts), including the amounts for line items that have been returned. */
  total?: Maybe<MoneyV2>;
  /** The total discount amount for the order, including the amounts for line items that have been returned. */
  totalDiscount?: Maybe<MoneyV2>;
  /** The total tax amount of the order, including the amounts for line items that have been returned. */
  totalTaxes?: Maybe<MoneyV2>;
};

/** The set of valid sort keys for the Order query. */
export const OrderSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `order_number` value. */
  OrderNumber: 'ORDER_NUMBER',
  /** Sort by the `processed_at` value. */
  ProcessedAt: 'PROCESSED_AT',
  /** Sort by the `total_price` value. */
  TotalPrice: 'TOTAL_PRICE',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type OrderSortKeys = typeof OrderSortKeys[keyof typeof OrderSortKeys];
/** A payment transaction within an order context. */
export type OrderTransaction = Node & PaymentIcon & {
  __typename?: 'OrderTransaction';
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The gift card details for the transaction. */
  giftCardDetails?: Maybe<GiftCardDetails>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The kind of the transaction. */
  kind?: Maybe<OrderTransactionKind>;
  /** The associated order for the transaction. */
  order?: Maybe<Order>;
  /** The payment details for the transaction. */
  paymentDetails?: Maybe<PaymentDetails>;
  /** The payment icon to display for the transaction. */
  paymentIcon?: Maybe<PaymentIconImage>;
  /** The date and time when the transaction was processed. */
  processedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The status of the transaction. */
  status?: Maybe<OrderTransactionStatus>;
  /** The amount and currency of the transaction in shop and presentment currencies. */
  transactionAmount: MoneyBag;
  /** The ID of the parent transaction. */
  transactionParentId?: Maybe<Scalars['String']['output']>;
  /** The type of the transaction. */
  type: OrderTransactionType;
  /** The details of the transaction type. */
  typeDetails?: Maybe<TransactionTypeDetails>;
};

/** The kind of order transaction. */
export const OrderTransactionKind = {
  /** An authorization transaction. */
  Authorization: 'AUTHORIZATION',
  /** A capture transaction. */
  Capture: 'CAPTURE',
  /** A card approval transaction. */
  CardApproval: 'CARD_APPROVAL',
  /** A card decline transaction. */
  CardDecline: 'CARD_DECLINE',
  /** A change transaction. */
  Change: 'CHANGE',
  /** An EMV authorization transaction. */
  EmvAuthorization: 'EMV_AUTHORIZATION',
  /** A refund transaction. */
  Refund: 'REFUND',
  /** A refund EMV initiate transaction. */
  RefundEmvInitiate: 'REFUND_EMV_INITIATE',
  /** A sale transaction. */
  Sale: 'SALE',
  /** A suggested refund transaction. */
  SuggestedRefund: 'SUGGESTED_REFUND',
  /** A void transaction. */
  Void: 'VOID'
} as const;

export type OrderTransactionKind = typeof OrderTransactionKind[keyof typeof OrderTransactionKind];
/** Represents the status of an order transaction. */
export const OrderTransactionStatus = {
  /** The transaction has an error. */
  Error: 'ERROR',
  /** The transaction has failed. */
  Failure: 'FAILURE',
  /** The transaction is pending. */
  Pending: 'PENDING',
  /** The transaction is pending authentication. */
  PendingAuthentication: 'PENDING_AUTHENTICATION',
  /** The transaction is successful. */
  Success: 'SUCCESS'
} as const;

export type OrderTransactionStatus = typeof OrderTransactionStatus[keyof typeof OrderTransactionStatus];
/** The type of order transaction. */
export const OrderTransactionType = {
  /** An ACH bank account transaction. */
  Ach: 'ACH',
  /** A bank deposit transaction. */
  BankDeposit: 'BANK_DEPOSIT',
  /** A card transaction. */
  Card: 'CARD',
  /** A cash on delivery transaction. */
  CashOnDelivery: 'CASH_ON_DELIVERY',
  /** A custom payment transaction. */
  Custom: 'CUSTOM',
  /** A gift card transaction. */
  GiftCard: 'GIFT_CARD',
  /** A generic manual transaction. */
  Manual: 'MANUAL',
  /** A money order transaction. */
  MoneyOrder: 'MONEY_ORDER',
  /** A Shopify installments transaction. */
  ShopifyInstallments: 'SHOPIFY_INSTALLMENTS',
  /** A store credit transaction. */
  StoreCredit: 'STORE_CREDIT'
} as const;

export type OrderTransactionType = typeof OrderTransactionType[keyof typeof OrderTransactionType];
/**
 * Returns information about pagination in a connection, in accordance with the
 * [Relay specification](https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo).
 * For more information, please read our [GraphQL Pagination Usage Guide](https://shopify.dev/api/usage/pagination-graphql).
 */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** The cursor corresponding to the last node in edges. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** Whether there are more pages to fetch following the current page. */
  hasNextPage: Scalars['Boolean']['output'];
  /** Whether there are any pages prior to the current page. */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** The cursor corresponding to the first node in edges. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** The input fields for a single remote-token credential. */
export type PaymentCredentialRemoteTokenInput = {
  /** Internal provider identifier. */
  providerId?: InputMaybe<Scalars['Int']['input']>;
  /** Opaque credential token. */
  token: Scalars['String']['input'];
  /** Credential type. */
  type: Scalars['String']['input'];
};

/** Payment details related to a transaction. */
export type PaymentDetails = AchPaymentDetails | CardPaymentDetails;

/** The payment icon to display for the transaction. */
export type PaymentIcon = {
  /** The payment icon to display for the transaction. */
  paymentIcon?: Maybe<PaymentIconImage>;
};

/** Represents an image resource. */
export type PaymentIconImage = Node & {
  __typename?: 'PaymentIconImage';
  /** A word or phrase to share the nature or contents of an image. */
  altText?: Maybe<Scalars['String']['output']>;
  /** The original height of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
  height?: Maybe<Scalars['Int']['output']>;
  /** A unique non-nullable ID for the image. */
  id: Scalars['ID']['output'];
  /**
   * The location of the original image as a URL.
   *
   * If there are any existing transformations in the original source URL, they will remain and not be stripped.
   * @deprecated Use `url` instead.
   */
  originalSrc: Scalars['URL']['output'];
  /**
   * The location of the image as a URL.
   * @deprecated Use `url` instead.
   */
  src: Scalars['URL']['output'];
  /**
   * The ThumbHash of the image.
   *
   * Useful to display placeholder images while the original image is loading.
   */
  thumbhash?: Maybe<Scalars['String']['output']>;
  /**
   * The location of the transformed image as a URL.
   *
   * All transformation arguments are considered "best-effort". If they can be applied to an image, they will be.
   * Otherwise any transformations which an image type doesn't support will be ignored.
   * @deprecated Use `url(transform:)` instead
   */
  transformedSrc: Scalars['URL']['output'];
  /**
   * The location of the image as a URL.
   *
   * If no transform options are specified, then the original image will be preserved including any pre-applied transforms.
   *
   * All transformation options are considered "best-effort". Any transformation that the original image type doesn't support will be ignored.
   *
   * If you need multiple variations of the same image, then you can use [GraphQL aliases](https://graphql.org/learn/queries/#aliases).
   */
  url: Scalars['URL']['output'];
  /** The original width of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
  width?: Maybe<Scalars['Int']['output']>;
};


/** Represents an image resource. */
export type PaymentIconImageTransformedSrcArgs = {
  crop?: InputMaybe<CropRegion>;
  maxHeight?: InputMaybe<Scalars['Int']['input']>;
  maxWidth?: InputMaybe<Scalars['Int']['input']>;
  preferredContentType?: InputMaybe<ImageContentType>;
  scale?: InputMaybe<Scalars['Int']['input']>;
};


/** Represents an image resource. */
export type PaymentIconImageUrlArgs = {
  transform?: InputMaybe<ImageTransformInput>;
};

/** A payment instrument. */
export type PaymentInstrument = {
  /** The list of open draft orders associated with this payment instrument. */
  draftOrders: DraftOrderConnection;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The list of pending orders associated with this payment instrument. */
  orders: OrderConnection;
  /** The list of subscription contracts charged using this payment instrument. */
  subscriptionContracts: SubscriptionContractConnection;
};


/** A payment instrument. */
export type PaymentInstrumentDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A payment instrument. */
export type PaymentInstrumentOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A payment instrument. */
export type PaymentInstrumentSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/** Return type for `paymentInstrumentAdd` mutation. */
export type PaymentInstrumentAddPayload = {
  __typename?: 'PaymentInstrumentAddPayload';
  /** The URL to which the customer should be redirected to complete the 3D Secure payment flow. */
  nextActionUrl?: Maybe<Scalars['URL']['output']>;
  /** The newly added payment instrument. */
  paymentInstrument?: Maybe<PaymentInstrument>;
  /** If the payment verification result is processing. When this is true, payment_instrument will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** The billing address associated with a credit card payment instrument. */
export type PaymentInstrumentBillingAddress = {
  __typename?: 'PaymentInstrumentBillingAddress';
  /** The first line of the address, typically the street address or PO Box number. */
  address1?: Maybe<Scalars['String']['output']>;
  /** The second line of the address, typically the apartment, suite, or unit number. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The name of the city, district, village, or town. */
  city?: Maybe<Scalars['String']['output']>;
  /** The name of the country. */
  country?: Maybe<Scalars['String']['output']>;
  /** The two-letter code for the country of the address, for example, US. */
  countryCode?: Maybe<CountryCode>;
  /** The first name in the address. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The last name in the address. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The region of the address, such as the province, state, or district. */
  province?: Maybe<Scalars['String']['output']>;
  /** The alphanumeric code for the region, for example, ON. */
  provinceCode?: Maybe<Scalars['String']['output']>;
  /** The zip or postal code of the address. */
  zip?: Maybe<Scalars['String']['output']>;
};

/** An auto-generated type for paginating through multiple PaymentInstruments. */
export type PaymentInstrumentConnection = {
  __typename?: 'PaymentInstrumentConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<PaymentInstrumentEdge>;
  /** A list of nodes that are contained in PaymentInstrumentEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<PaymentInstrument>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one PaymentInstrument and a cursor during pagination. */
export type PaymentInstrumentEdge = {
  __typename?: 'PaymentInstrumentEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of PaymentInstrumentEdge. */
  node: PaymentInstrument;
};

/** The input fields for a payment instrument. */
export type PaymentInstrumentInput = {
  /** The remote-token based instrument (e.g., credit card session, PayPal token). */
  remoteToken?: InputMaybe<RemoteTokenPaymentInstrumentInput>;
};

/** Return type for `paymentInstrumentRemove` mutation. */
export type PaymentInstrumentRemovePayload = {
  __typename?: 'PaymentInstrumentRemovePayload';
  /** The ID of the deleted payment instrument. */
  deletedPaymentInstrumentId?: Maybe<Scalars['ID']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `paymentInstrumentReplace` mutation. */
export type PaymentInstrumentReplacePayload = {
  __typename?: 'PaymentInstrumentReplacePayload';
  /** The URL to which the customer should be redirected to complete the 3D Secure payment flow. */
  nextActionUrl?: Maybe<Scalars['URL']['output']>;
  /** The replacement payment instrument. */
  paymentInstrument?: Maybe<PaymentInstrument>;
  /** If the payment verification result is processing. When this is true, payment_instrument will be null. */
  processing?: Maybe<Scalars['Boolean']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** Return type for `paymentInstrumentUpdateDefault` mutation. */
export type PaymentInstrumentUpdateDefaultPayload = {
  __typename?: 'PaymentInstrumentUpdateDefaultPayload';
  /** The ID of the updated payment instrument. */
  updatedPaymentInstrumentId?: Maybe<Scalars['ID']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** The types of credit card wallets. */
export const PaymentInstrumentWalletType = {
  /** The credit card is an Apple Pay wallet. */
  ApplePay: 'APPLE_PAY',
  /** The credit card is a Google Pay wallet. */
  GooglePay: 'GOOGLE_PAY',
  /** The credit card is a Shop Pay wallet. */
  ShopPay: 'SHOP_PAY'
} as const;

export type PaymentInstrumentWalletType = typeof PaymentInstrumentWalletType[keyof typeof PaymentInstrumentWalletType];
/** The input fields for a mandate association for a payment instrument. */
export type PaymentMandateInput = {
  resourceId?: InputMaybe<Scalars['Int']['input']>;
  resourceType: PaymentMandateResourceType;
};

/** Resources a mandate can be associated with. */
export const PaymentMandateResourceType = {
  Any: 'ANY',
  Checkout: 'CHECKOUT',
  Draftorder: 'DRAFTORDER',
  Order: 'ORDER',
  Receipt: 'RECEIPT',
  Subscriptions: 'SUBSCRIPTIONS'
} as const;

export type PaymentMandateResourceType = typeof PaymentMandateResourceType[keyof typeof PaymentMandateResourceType];
/** A payment method that customers can use to pay. */
export type PaymentMethod = BankPaymentMethod;

/** Represents a payment provider client credentials. */
export type PaymentProviderClientCredentials = {
  __typename?: 'PaymentProviderClientCredentials';
  /** The API client key for the payment provider client. */
  apiClientKey?: Maybe<Scalars['String']['output']>;
  /** The merchant's payment provider account id. */
  merchantAccountId?: Maybe<Scalars['String']['output']>;
};

/** A single payment schedule defined in the payment terms. */
export type PaymentSchedule = Node & {
  __typename?: 'PaymentSchedule';
  /**
   * The amount owed for this payment schedule.
   * @deprecated Use `totalBalance` instead.
   */
  amount: MoneyV2;
  /** Whether the payment has been completed. */
  completed: Scalars['Boolean']['output'];
  /** The date and time when the payment schedule was paid or fulfilled. */
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The date and time when the payment schedule is due. */
  dueAt?: Maybe<Scalars['DateTime']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** Remaining balance to be paid or authorized by the customer for this payment schedule. */
  totalBalance: MoneyV2;
};

/** An auto-generated type for paginating through multiple PaymentSchedules. */
export type PaymentScheduleConnection = {
  __typename?: 'PaymentScheduleConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<PaymentScheduleEdge>;
  /** A list of nodes that are contained in PaymentScheduleEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<PaymentSchedule>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one PaymentSchedule and a cursor during pagination. */
export type PaymentScheduleEdge = {
  __typename?: 'PaymentScheduleEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of PaymentScheduleEdge. */
  node: PaymentSchedule;
};

/** The payment terms associated with an order or draft order. */
export type PaymentTerms = Node & {
  __typename?: 'PaymentTerms';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The next due date if this is the NET or FIXED type of payment terms. */
  nextDueAt?: Maybe<Scalars['DateTime']['output']>;
  /** Whether the payment terms have overdue payment schedules. */
  overdue: Scalars['Boolean']['output'];
  /** The list of schedules associated with the payment terms. */
  paymentSchedules: PaymentScheduleConnection;
  /** The name of the payment terms template that was used to create the payment terms. */
  paymentTermsName: Scalars['String']['output'];
  /** The type of the payment terms template that was used to create the payment terms. */
  paymentTermsType: PaymentTermsType;
};


/** The payment terms associated with an order or draft order. */
export type PaymentTermsPaymentSchedulesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The template for payment terms. */
export type PaymentTermsTemplate = Node & {
  __typename?: 'PaymentTermsTemplate';
  /** The description of the payment terms template. */
  description: Scalars['String']['output'];
  /** The number of days between the issue date and due date for net-type payment terms. */
  dueInDays?: Maybe<Scalars['Int']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The name of the payment terms template. */
  name: Scalars['String']['output'];
  /** The type of the payment terms template. */
  paymentTermsType: PaymentTermsType;
  /** The translated name of the payment terms template. */
  translatedName: Scalars['String']['output'];
};

/** The type of a payment terms or a payment terms template. */
export const PaymentTermsType = {
  /** The payment terms or payment terms template is fixed type (due on a specified date). */
  Fixed: 'FIXED',
  /** The payment terms or payment terms template is due upon fulfillment. */
  Fulfillment: 'FULFILLMENT',
  /** The payment terms or payment terms template is net type (due a number of days after issue). */
  Net: 'NET',
  /** The payment terms or payment terms template is due upon receipt. */
  Receipt: 'RECEIPT',
  /** The type of the payment terms or payment terms template is unknown. */
  Unknown: 'UNKNOWN'
} as const;

export type PaymentTermsType = typeof PaymentTermsType[keyof typeof PaymentTermsType];
/** Return type for `paypalAccountEnable` mutation. */
export type PaypalAccountEnablePayload = {
  __typename?: 'PaypalAccountEnablePayload';
  /** The newly established PayPal billing agreement. */
  paypalBillingAgreement?: Maybe<PaypalBillingAgreement>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaypalTokenUserErrors>;
};

/** A payment method using a PayPal billing agreement. */
export type PaypalBillingAgreement = Node & PaymentInstrument & {
  __typename?: 'PaypalBillingAgreement';
  /** The billing address associated with the payment method. */
  billingAddress?: Maybe<PaymentInstrumentBillingAddress>;
  /** The list of open draft orders associated with this payment instrument. */
  draftOrders: DraftOrderConnection;
  /** The globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The list of pending orders associated with this payment instrument. */
  orders: OrderConnection;
  /** The email address associated with the PayPal account. */
  paypalAccountEmail?: Maybe<Scalars['String']['output']>;
  /** The list of pending orders associated with this PayPal billing agreement. */
  pendingOrders: OrderConnection;
  /** The list of subscription contracts charged using this PayPal billing agreement. */
  subscriptionContracts: SubscriptionContractConnection;
};


/** A payment method using a PayPal billing agreement. */
export type PaypalBillingAgreementDraftOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A payment method using a PayPal billing agreement. */
export type PaypalBillingAgreementOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A payment method using a PayPal billing agreement. */
export type PaypalBillingAgreementPendingOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A payment method using a PayPal billing agreement. */
export type PaypalBillingAgreementSubscriptionContractsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionContractsSortKeys>;
};

/** Return type for `paypalTokenCreate` mutation. */
export type PaypalTokenCreatePayload = {
  __typename?: 'PaypalTokenCreatePayload';
  /** The created PayPal Express token. */
  token?: Maybe<Scalars['String']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaypalTokenUserErrors>;
};

/** The operations that can be performed on a B2B resource. */
export const PermittedOperation = {
  /** The permission to add a resource. */
  Add: 'ADD',
  /** All permissions for a resource. */
  All: 'ALL',
  /** The permission to delete a resource. */
  Delete: 'DELETE',
  /** The permission to edit a resource. */
  Edit: 'EDIT',
  /** The permission to use a resource. */
  Use: 'USE',
  /** The permission to view a resource. */
  View: 'VIEW'
} as const;

export type PermittedOperation = typeof PermittedOperation[keyof typeof PermittedOperation];
/** The address of a pickup location. */
export type PickupAddress = {
  __typename?: 'PickupAddress';
  /** The street address for the pickup location. */
  address1: Scalars['String']['output'];
  /** Any additional address information for the pickup location. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The city of the pickup location. */
  city: Scalars['String']['output'];
  /** The country code for the pickup location. */
  countryCode: CountryCode;
  /** The phone number for the pickup location. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The ZIP code for the pickup location. */
  zip?: Maybe<Scalars['String']['output']>;
  /** The province code for the pickup location. */
  zoneCode?: Maybe<Scalars['String']['output']>;
};

/** The status of the order's pickup. */
export const PickupStatus = {
  /** The pickup of the order has been confirmed. */
  Closed: 'CLOSED',
  /** The order has been picked up. */
  InProgress: 'IN_PROGRESS',
  /** The order is ready for pick up. */
  Open: 'OPEN'
} as const;

export type PickupStatus = typeof PickupStatus[keyof typeof PickupStatus];
/** Represents the value of the percentage pricing object. */
export type PricingPercentageValue = {
  __typename?: 'PricingPercentageValue';
  /** The percentage value of the object. */
  percentage: Scalars['Float']['output'];
};

/** The price value (fixed or percentage) for a discount application. */
export type PricingValue = MoneyV2 | PricingPercentageValue;

/** A sale associated with a product. */
export type ProductSale = Node & Sale & {
  __typename?: 'ProductSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The line item for the associated sale. */
  lineItem: LineItem;
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** The information of the purchasing company for an order or draft order. */
export type PurchasingCompany = {
  __typename?: 'PurchasingCompany';
  /** The company associated with the order or draft order. */
  company: Company;
  /** The company contact associated with the order or draft order. */
  contact?: Maybe<CompanyContact>;
  /** The company location associated with the order or draft order. */
  location: CompanyLocation;
};

/** Represents information about the purchasing entity for the order or draft order. */
export type PurchasingEntity = Customer | PurchasingCompany;

/** This acts as the public, top-level API from which all queries start. */
export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** The information of the customer's company. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  company?: Maybe<Company>;
  /** The Location corresponding to the provided ID. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  companyLocation?: Maybe<CompanyLocation>;
  /** Returns the Customer resource. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  customer: Customer;
  /** Returns a draft order resource by ID. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  draftOrder?: Maybe<DraftOrder>;
  /** The API tokens for UI extensions. */
  extensionApiTokens?: Maybe<ExtensionApiTokens>;
  /** Returns an Order resource by ID. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  order?: Maybe<Order>;
  /** Returns a Return resource by ID. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  return?: Maybe<Return>;
  /** The calculated monetary value of the return. */
  returnCalculate?: Maybe<CalculatedReturn>;
  /** Returns the information about the shop. Apps using the Customer Account API must meet the protected customer data [requirements](https://shopify.dev/docs/apps/launch/protected-customer-data). */
  shop: Shop;
  /**
   * Public metafields for Shop, Order, Customer, Company, CompanyLocation, Product, and ProductVariant
   * for given extension ids. Shop metafields are always fetched if there is a match for the given namespace and key pairs.
   * Product and ProductVariant are only fetched if resource_ids are provided and there is a match for the
   * namespace and key. This is restricted to development shops for local UI extension development purposes only.
   */
  uiExtensionMetafields: Array<UiExtensionMetafield>;
  /** A session token for an UI extension. */
  uiExtensionSessionToken?: Maybe<UiExtensionSessionToken>;
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootCompanyArgs = {
  id: Scalars['ID']['input'];
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootCompanyLocationArgs = {
  id: Scalars['ID']['input'];
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootDraftOrderArgs = {
  id: Scalars['ID']['input'];
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootExtensionApiTokensArgs = {
  appId: Scalars['ID']['input'];
  extensionType?: InputMaybe<Scalars['String']['input']>;
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootOrderArgs = {
  id: Scalars['ID']['input'];
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootReturnArgs = {
  id: Scalars['ID']['input'];
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootReturnCalculateArgs = {
  input: CalculateReturnInput;
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootUiExtensionMetafieldsArgs = {
  orderId?: InputMaybe<Scalars['ID']['input']>;
  resourceIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};


/** This acts as the public, top-level API from which all queries start. */
export type QueryRootUiExtensionSessionTokenArgs = {
  appId?: InputMaybe<Scalars['ID']['input']>;
  extensionActivationId?: InputMaybe<Scalars['ID']['input']>;
};

/** The record of refunds issued to a customer. */
export type Refund = Node & {
  __typename?: 'Refund';
  /** The date and time when the refund was created. */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The name of the return, if the refund was issued from a return. */
  returnName?: Maybe<Scalars['String']['output']>;
  /** The total amount refunded across all transactions, in presentment currencies. */
  totalRefunded: MoneyV2;
  /** The date and time when the refund was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

/** An agreement for refunding all or a portion of the order between the merchant and the customer. */
export type RefundAgreement = Node & SalesAgreement & {
  __typename?: 'RefundAgreement';
  /** The date and time when the agreement occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the agreement. */
  id: Scalars['ID']['output'];
  /** The reason the agreement was created. */
  reason: OrderActionType;
  /** The refund that's associated with the agreement. */
  refund: Refund;
  /** The sales associated with the agreement. */
  sales: SaleConnection;
};


/** An agreement for refunding all or a portion of the order between the merchant and the customer. */
export type RefundAgreementSalesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about the line items container for items that have not been refunded or removed. */
export type RemainingLineItemContainer = {
  __typename?: 'RemainingLineItemContainer';
  /** A unique ID for the container. */
  id: Scalars['ID']['output'];
  /** The line items contained within this container. */
  lineItems: RemainingLineItemContainerLineItemConnection;
};


/** The information about the line items container for items that have not been refunded or removed. */
export type RemainingLineItemContainerLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about the line item in the line item container. */
export type RemainingLineItemContainerLineItem = Node & {
  __typename?: 'RemainingLineItemContainerLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The line item associated with the container. */
  lineItem: LineItem;
};

/** An auto-generated type for paginating through multiple RemainingLineItemContainerLineItems. */
export type RemainingLineItemContainerLineItemConnection = {
  __typename?: 'RemainingLineItemContainerLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<RemainingLineItemContainerLineItemEdge>;
  /** A list of nodes that are contained in RemainingLineItemContainerLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<RemainingLineItemContainerLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one RemainingLineItemContainerLineItem and a cursor during pagination. */
export type RemainingLineItemContainerLineItemEdge = {
  __typename?: 'RemainingLineItemContainerLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of RemainingLineItemContainerLineItemEdge. */
  node: RemainingLineItemContainerLineItem;
};

/** The input fields for a remote-token instrument. */
export type RemoteTokenPaymentInstrumentInput = {
  /** The billing address associated with the payment instrument. */
  billingAddress?: InputMaybe<CustomerAddressInput>;
  /** Credentials for the remote token instrument. Multiple entries may be required for some instrument types. */
  credentials: Array<PaymentCredentialRemoteTokenInput>;
  /** The owner ID to associate with this instrument. */
  ownerId: Scalars['ID']['input'];
};

/** The input fields for a line item requested for return. */
export type RequestedLineItemInput = {
  /**
   * A note from the customer explaining the item to be returned.
   * For instance, the note can detail issues with the item for the merchant's information.
   * Maximum length: 300 characters.
   */
  customerNote?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the line item that the customer wants to return. */
  lineItemId: Scalars['ID']['input'];
  /** The quantity of the line item that the customer wants to return. */
  quantity: Scalars['Int']['input'];
  /** The ID of a [`ReturnReasonDefinition`](https://shopify.dev/docs/api/customer/latest/objects/ReturnReasonDefinition). Use [`LineItem.suggestedReturnReasonDefinitions`](https://shopify.dev/docs/api/customer/latest/objects/LineItem#field-LineItem.fields.suggestedReturnReasonDefinitions) to get reasons tailored to the product's category. */
  returnReasonDefinitionId?: InputMaybe<Scalars['ID']['input']>;
};

/** Return type for `resendGiftCard` mutation. */
export type ResendGiftCardPayload = {
  __typename?: 'ResendGiftCardPayload';
  /** The ID of the order that resends the gift cards. */
  orderId?: Maybe<Scalars['ID']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsResendGiftCardErrors>;
};

/** Represents permissions on resources. */
export type ResourcePermission = {
  __typename?: 'ResourcePermission';
  /** The operations permitted on the resource. */
  permittedOperations: Array<PermittedOperation>;
  /** The name of the resource. */
  resource: ResourceType;
};

/** The B2B resource types. */
export const ResourceType = {
  /** The Business Profile resource type. */
  BusinessProfile: 'BUSINESS_PROFILE',
  /** The Company resource type. */
  Company: 'COMPANY',
  /** The Company Contact resource type. */
  CompanyContact: 'COMPANY_CONTACT',
  /** The Company Contact Role resource type. */
  CompanyContactRole: 'COMPANY_CONTACT_ROLE',
  /** The Company Location resource type. */
  CompanyLocation: 'COMPANY_LOCATION',
  /** The Company Location Billing Address resource type. */
  CompanyLocationBillingAddress: 'COMPANY_LOCATION_BILLING_ADDRESS',
  /** The Company Location Shipping Address resource type. */
  CompanyLocationShippingAddress: 'COMPANY_LOCATION_SHIPPING_ADDRESS',
  /** The Company Tax Exemption resource type. */
  CompanyTaxExemption: 'COMPANY_TAX_EXEMPTION',
  /** The Draft Order resource type. */
  DraftOrder: 'DRAFT_ORDER',
  /** The Order resource type. */
  Order: 'ORDER',
  /** The Payment Method resource type. */
  PaymentMethod: 'PAYMENT_METHOD'
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];
/** A product return. */
export type Return = Node & {
  __typename?: 'Return';
  /** The date when the return was closed. */
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  /** The date when the return was created. */
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** The additional details about why the merchant declined the return request. */
  decline?: Maybe<ReturnDecline>;
  /** The exchange line items attached to the return. */
  exchangeLineItems: ExchangeLineItemConnection;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The name assigned to the return. */
  name: Scalars['String']['output'];
  /** The line items associated with the return. */
  returnLineItems: ReturnLineItemTypeConnection;
  /** The number of line items associated with the return. */
  returnLineItemsCount?: Maybe<Count>;
  /** The list of reverse deliveries associated with the return. */
  reverseDeliveries: ReverseDeliveryConnection;
  /** The current status of the `Return`. */
  status: ReturnStatus;
  /** The timeline events related to the return. */
  timelineEvents: Array<TimelineEvent>;
  /** The number of line items associated with the return. */
  tmpReturnLineItemsCount: Scalars['Int']['output'];
  /** The date when the return was last updated. */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};


/** A product return. */
export type ReturnExchangeLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  includeRemovedItems?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A product return. */
export type ReturnReturnLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A product return. */
export type ReturnReverseDeliveriesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An agreement between the merchant and customer for a return. */
export type ReturnAgreement = Node & SalesAgreement & {
  __typename?: 'ReturnAgreement';
  /** The date and time when the agreement occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the agreement. */
  id: Scalars['ID']['output'];
  /** The reason the agreement was created. */
  reason: OrderActionType;
  /** The return associated with the agreement. */
  return: Return;
  /** The sales associated with the agreement. */
  sales: SaleConnection;
};


/** An agreement between the merchant and customer for a return. */
export type ReturnAgreementSalesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An auto-generated type for paginating through multiple Returns. */
export type ReturnConnection = {
  __typename?: 'ReturnConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ReturnEdge>;
  /** A list of nodes that are contained in ReturnEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<Return>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The merchant's reason for declining the customer's return request. */
export type ReturnDecline = {
  __typename?: 'ReturnDecline';
  /** The merchant's message to the customer explaining why their return request was declined. */
  note?: Maybe<Scalars['String']['output']>;
  /** The reason the return request was declined. */
  reason: ReturnDeclineReason;
};

/** The specific reason for the merchant declining a customer's return request. */
export const ReturnDeclineReason = {
  /** The return request was declined because it contains items from a final sale. */
  FinalSale: 'FINAL_SALE',
  /** The return request was declined due to another reason. */
  Other: 'OTHER',
  /** The return request was declined because the return period has ended. */
  ReturnPeriodEnded: 'RETURN_PERIOD_ENDED'
} as const;

export type ReturnDeclineReason = typeof ReturnDeclineReason[keyof typeof ReturnDeclineReason];
/** An auto-generated type which holds one Return and a cursor during pagination. */
export type ReturnEdge = {
  __typename?: 'ReturnEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ReturnEdge. */
  node: Return;
};

/** Possible error codes that can be returned by `ReturnUserError`. */
export const ReturnErrorCode = {
  /** The requested resource already exists. */
  AlreadyExists: 'ALREADY_EXISTS',
  /** The input value is blank. */
  Blank: 'BLANK',
  /** A requested resource could not be created. */
  CreationFailed: 'CREATION_FAILED',
  /** The input value should be equal to the value allowed. */
  EqualTo: 'EQUAL_TO',
  /** A required feature is not enabled. */
  FeatureNotEnabled: 'FEATURE_NOT_ENABLED',
  /** The input value should be greater than the minimum allowed value. */
  GreaterThan: 'GREATER_THAN',
  /** The input value should be greater than or equal to the minimum value allowed. */
  GreaterThanOrEqualTo: 'GREATER_THAN_OR_EQUAL_TO',
  /** The input value isn't included in the list. */
  Inclusion: 'INCLUSION',
  /** Unexpected internal error happened. */
  InternalError: 'INTERNAL_ERROR',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** A resource was not in the correct state for the operation to succeed. */
  InvalidState: 'INVALID_STATE',
  /** The input value should be less than the maximum value allowed. */
  LessThan: 'LESS_THAN',
  /** The input value should be less than or equal to the maximum value allowed. */
  LessThanOrEqualTo: 'LESS_THAN_OR_EQUAL_TO',
  /** A requested notification could not be sent. */
  NotificationFailed: 'NOTIFICATION_FAILED',
  /** A request is not authorized. */
  NotAuthorized: 'NOT_AUTHORIZED',
  /** The input value is not a number. */
  NotANumber: 'NOT_A_NUMBER',
  /** A requested item is not editable. */
  NotEditable: 'NOT_EDITABLE',
  /** A requested item could not be found. */
  NotFound: 'NOT_FOUND',
  /** The input value needs to be blank. */
  Present: 'PRESENT',
  /** The input value is already taken. */
  Taken: 'TAKEN',
  /** The input value is too big. */
  TooBig: 'TOO_BIG',
  /** The input value is too long. */
  TooLong: 'TOO_LONG',
  /** Too many arguments provided. */
  TooManyArguments: 'TOO_MANY_ARGUMENTS',
  /** The input value is too short. */
  TooShort: 'TOO_SHORT',
  /** The input value is the wrong length. */
  WrongLength: 'WRONG_LENGTH'
} as const;

export type ReturnErrorCode = typeof ReturnErrorCode[keyof typeof ReturnErrorCode];
/** A fee associated with the processing of a return. */
export type ReturnFee = {
  /** The total monetary value of the fee in shop and presentment currencies. */
  amountSet: MoneyBag;
  /** Human-readable name of the fee. */
  title: Scalars['String']['output'];
};

/** The financial breakdown of the return. */
export type ReturnFinancialSummary = {
  __typename?: 'ReturnFinancialSummary';
  /** The subtotal of all return line items restocking fees. */
  restockingFeeSubtotalSet: MoneyBag;
  /** The sum of all order level discounts that are target_all?. */
  returnOrderLevelDiscountSubtotalSet: MoneyBag;
  /** The subtotal of all return line items shipping fees. */
  returnShippingFeeSubtotalSet: MoneyBag;
  /** The subtotal of all return line items excluding target_all discounts. */
  returnSubtotalBeforeTargetAllDiscountsSet: MoneyBag;
  /** The subtotal of all return line items. */
  returnSubtotalSet: MoneyBag;
  /** The subtotal of all return line items with order level discounts applied. */
  returnSubtotalWithCartDiscountSet: MoneyBag;
  /** The total sum of all return line items, including return line item subtotals, fees and taxes. */
  returnTotalSet: MoneyBag;
  /** The total tax sum of all return line items. */
  returnTotalTaxSet: MoneyBag;
};

/** A line item that has been returned. */
export type ReturnLineItem = Node & ReturnLineItemType & {
  __typename?: 'ReturnLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The related line item that has been returned. */
  lineItem: LineItem;
  /** The line item quantity that has been returned. */
  quantity: Scalars['Int']['output'];
  /** The reason the line item quantity was returned. */
  returnReason: ReturnReason;
  /** The standardized reason for why the item is being returned. */
  returnReasonDefinition?: Maybe<ReturnReasonDefinition>;
};

/** A line item that has been returned. */
export type ReturnLineItemType = {
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The specific line item that's being returned. */
  lineItem: LineItem;
  /** The quantity of the line item that's been returned. */
  quantity: Scalars['Int']['output'];
  /**
   * The reason for returning the line item.
   * @deprecated Use `returnReasonDefinition` instead. This field will be removed in the future.
   */
  returnReason: ReturnReason;
  /** The standardized reason for why the item is being returned. */
  returnReasonDefinition?: Maybe<ReturnReasonDefinition>;
};

/** An auto-generated type for paginating through multiple ReturnLineItemTypes. */
export type ReturnLineItemTypeConnection = {
  __typename?: 'ReturnLineItemTypeConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ReturnLineItemTypeEdge>;
  /** A list of nodes that are contained in ReturnLineItemTypeEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<ReturnLineItemType>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one ReturnLineItemType and a cursor during pagination. */
export type ReturnLineItemTypeEdge = {
  __typename?: 'ReturnLineItemTypeEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ReturnLineItemTypeEdge. */
  node: ReturnLineItemType;
};

/**
 * The reason for returning the item.
 *
 * > **Deprecated**: This enum is deprecated in favor of `ReturnReasonDefinition`.
 * > Use `returnReasonDefinitionId` in input objects and `returnReasonDefinition` in return line items instead.
 * > This enum will be removed in a future API version.
 */
export const ReturnReason = {
  /** The color of the item didn't meet expectations. */
  Color: 'COLOR',
  /** The item was damaged or defective. */
  Defective: 'DEFECTIVE',
  /** The item was not as described. */
  NotAsDescribed: 'NOT_AS_DESCRIBED',
  /** Other reason not listed. */
  Other: 'OTHER',
  /** The size of the item was too large. */
  SizeTooLarge: 'SIZE_TOO_LARGE',
  /** The size of the item was too small. */
  SizeTooSmall: 'SIZE_TOO_SMALL',
  /** The style of the item didn't meet expectations. */
  Style: 'STYLE',
  /** The reason is unknown. */
  Unknown: 'UNKNOWN',
  /** The customer changed their mind about the item. */
  Unwanted: 'UNWANTED',
  /** The customer received the wrong item. */
  WrongItem: 'WRONG_ITEM'
} as const;

export type ReturnReason = typeof ReturnReason[keyof typeof ReturnReason];
/**
 * A standardized reason for returning an item.
 *
 * - Shopify offers an expanded library of return reasons available to all merchants
 * - For each product, Shopify suggests a curated subset of reasons based on the product's category.
 */
export type ReturnReasonDefinition = Node & {
  __typename?: 'ReturnReasonDefinition';
  /**
   * Whether the return reason has been removed from taxonomy.
   *
   * Deleted reasons should not be presented to customers when creating new returns, but may still
   * appear on existing returns that were created before the reason was deleted. This field enables
   * graceful deprecation of return reasons without breaking historical data.
   */
  deleted: Scalars['Boolean']['output'];
  /**
   * A unique, human-readable, stable identifier for the return reason.
   *
   * Example values include "arrived-late", "comfort", "too-tight", "color-too-bright", and "quality".
   * The handle remains consistent across API versions and localizations, making it suitable for programmatic use.
   */
  handle: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /**
   * The localized, user-facing name of the return reason.
   *
   * This field returns the reason name in the requested locale, automatically falling back to
   * English if no translation is available. Use this field when displaying return reasons to
   * customers.
   */
  name: Scalars['String']['output'];
};

/** An auto-generated type for paginating through multiple ReturnReasonDefinitions. */
export type ReturnReasonDefinitionConnection = {
  __typename?: 'ReturnReasonDefinitionConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ReturnReasonDefinitionEdge>;
  /** A list of nodes that are contained in ReturnReasonDefinitionEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<ReturnReasonDefinition>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one ReturnReasonDefinition and a cursor during pagination. */
export type ReturnReasonDefinitionEdge = {
  __typename?: 'ReturnReasonDefinitionEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ReturnReasonDefinitionEdge. */
  node: ReturnReasonDefinition;
};

/** The restocking fee incurred during the return process. */
export type ReturnRestockingFee = ReturnFee & {
  __typename?: 'ReturnRestockingFee';
  /** The total monetary value of the fee in shop and presentment currencies. */
  amountSet: MoneyBag;
  /** Human-readable name of the fee. */
  title: Scalars['String']['output'];
};

/** The shipping fee incurred during the return process. */
export type ReturnShippingFee = ReturnFee & {
  __typename?: 'ReturnShippingFee';
  /** The total monetary value of the fee in shop and presentment currencies. */
  amountSet: MoneyBag;
  /** Human-readable name of the fee. */
  title: Scalars['String']['output'];
};

/** How items will be returned to the merchant. */
export const ReturnShippingMethod = {
  /** The customer is responsible for providing the shipping label. */
  CustomerProvidedLabel: 'CUSTOMER_PROVIDED_LABEL',
  /** The merchant provides the shipping label. */
  MerchantProvidedLabel: 'MERCHANT_PROVIDED_LABEL'
} as const;

export type ReturnShippingMethod = typeof ReturnShippingMethod[keyof typeof ReturnShippingMethod];
/** The set of valid sort keys for the Return query. */
export const ReturnSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID'
} as const;

export type ReturnSortKeys = typeof ReturnSortKeys[keyof typeof ReturnSortKeys];
/** The current status of a `Return`. */
export const ReturnStatus = {
  /** The `Return` has been canceled by the user. */
  Canceled: 'CANCELED',
  /** The `Return` has been successfully completed. */
  Closed: 'CLOSED',
  /** The `Return` request was declined. */
  Declined: 'DECLINED',
  /** The `Return` is currently in progress. */
  Open: 'OPEN',
  /** The `Return` has been requested by the user. */
  Requested: 'REQUESTED'
} as const;

export type ReturnStatus = typeof ReturnStatus[keyof typeof ReturnStatus];
/** The supported reason for returning a line item. */
export type ReturnSupportedReason = {
  __typename?: 'ReturnSupportedReason';
  /** The standardized return reason (e.g. `DEFECTIVE` or `UNWANTED`) for returning the line item. */
  reason: ReturnReason;
  /** The localized, display text for the return reason. */
  title: Scalars['String']['output'];
};

/** The errors that occur during the execution of a return mutation. */
export type ReturnUserError = DisplayableError & {
  __typename?: 'ReturnUserError';
  /** The error code. */
  code?: Maybe<ReturnErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** A line item with at least one unit that is eligible for return. */
export type ReturnableLineItem = {
  __typename?: 'ReturnableLineItem';
  /** The related line item. */
  lineItem: LineItem;
  /** The quantity of units that can be returned. */
  quantity: Scalars['Int']['output'];
};

/** An auto-generated type for paginating through multiple ReturnableLineItems. */
export type ReturnableLineItemConnection = {
  __typename?: 'ReturnableLineItemConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ReturnableLineItemEdge>;
  /** A list of nodes that are contained in ReturnableLineItemEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<ReturnableLineItem>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one ReturnableLineItem and a cursor during pagination. */
export type ReturnableLineItemEdge = {
  __typename?: 'ReturnableLineItemEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ReturnableLineItemEdge. */
  node: ReturnableLineItem;
};

/**
 * A reverse delivery represents a package being sent back by a buyer to a merchant post-fulfillment.
 * This could occur when a buyer requests a return and the merchant provides a shipping label.
 * The reverse delivery includes the context of the items being returned, the method of return
 * (for example, a shipping label), and the current status of the delivery (tracking information).
 */
export type ReverseDelivery = Node & {
  __typename?: 'ReverseDelivery';
  /** Whether the label was generated by the customer. */
  customerGeneratedLabel: Scalars['Boolean']['output'];
  /** The deliverable linked with the reverse delivery. */
  deliverable?: Maybe<ReverseDeliveryDeliverable>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
};

/** An auto-generated type for paginating through multiple ReverseDeliveries. */
export type ReverseDeliveryConnection = {
  __typename?: 'ReverseDeliveryConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<ReverseDeliveryEdge>;
  /** A list of nodes that are contained in ReverseDeliveryEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<ReverseDelivery>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** The method and associated details of a reverse delivery. */
export type ReverseDeliveryDeliverable = ReverseDeliveryShippingDeliverable;

/** An auto-generated type which holds one ReverseDelivery and a cursor during pagination. */
export type ReverseDeliveryEdge = {
  __typename?: 'ReverseDeliveryEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of ReverseDeliveryEdge. */
  node: ReverseDelivery;
};

/** The return label information for a reverse delivery. */
export type ReverseDeliveryLabel = {
  __typename?: 'ReverseDeliveryLabel';
  /** The date and time when the reverse delivery label was created. */
  createdAt: Scalars['DateTime']['output'];
  /** A publicly accessible link for downloading the label image. */
  publicFileUrl?: Maybe<Scalars['URL']['output']>;
  /** The date and time when the reverse delivery label was last updated. */
  updatedAt: Scalars['DateTime']['output'];
};

/** A set of shipping deliverables for reverse delivery. */
export type ReverseDeliveryShippingDeliverable = {
  __typename?: 'ReverseDeliveryShippingDeliverable';
  /** The return label that's attached to the reverse delivery. */
  label?: Maybe<ReverseDeliveryLabel>;
  /** The tracking information for the reverse delivery. */
  tracking?: Maybe<ReverseDeliveryTracking>;
};

/** The tracking information for a reverse delivery. */
export type ReverseDeliveryTracking = {
  __typename?: 'ReverseDeliveryTracking';
  /** The name of the delivery service provider, in a format that's suitable for display purposes. */
  carrierName?: Maybe<Scalars['String']['output']>;
  /** The identifier that the courier uses to track the shipment. */
  trackingNumber?: Maybe<Scalars['String']['output']>;
  /** The URL used to track the shipment. */
  trackingUrl?: Maybe<Scalars['URL']['output']>;
};

/**
 * A record of an individual sale associated with a sales agreement. Every monetary value in an order's sales data is represented in the smallest unit of the currency.
 * When amounts are divided across multiple line items, such as taxes or order discounts, the amounts might not divide evenly across all of the line items on the order.
 * To address this, the remaining currency units that couldn't be divided evenly are allocated one at a time, starting with the first line item, until they are all accounted for.
 * In aggregate, the values sum up correctly. In isolation, one line item might have a different tax or discount amount than another line item of the same price, before taxes and discounts.
 * This is because the amount could not be divided evenly across the items. The allocation of currency units across line items is immutable. After they are allocated, currency units are never reallocated or redistributed among the line items.
 */
export type Sale = {
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** An order action type associated with a sale. */
export const SaleActionType = {
  /** A purchase or charge. */
  Order: 'ORDER',
  /** A removal or return. */
  Return: 'RETURN',
  /** An unidentified order action. Represents new actions that may be added in future versions. */
  Unknown: 'UNKNOWN',
  /** A change to the price, taxes, or discounts for a previous purchase. */
  Update: 'UPDATE'
} as const;

export type SaleActionType = typeof SaleActionType[keyof typeof SaleActionType];
/** An auto-generated type for paginating through multiple Sales. */
export type SaleConnection = {
  __typename?: 'SaleConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SaleEdge>;
  /** A list of nodes that are contained in SaleEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<Sale>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one Sale and a cursor during pagination. */
export type SaleEdge = {
  __typename?: 'SaleEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SaleEdge. */
  node: Sale;
};

/**
 * The possible line types of a sale record. A sale can be an adjustment, which occurs when a refund is issued for a line item that is either more or less than the total value of the line item.
 * Examples include restocking fees and goodwill payments. In such cases, Shopify generates a sales agreement with sale records for each line item that is returned or refunded, and an additional sale record for the adjustment, for example a restocking fee.
 * The sale records for the returned or refunded items represent the reversal of the original line item sale value. The additional adjustment sale record represents the difference between the original total value of all line items that were refunded, and the actual amount refunded.
 */
export const SaleLineType = {
  /** An additional fee. */
  AdditionalFee: 'ADDITIONAL_FEE',
  /** A sale adjustment. */
  Adjustment: 'ADJUSTMENT',
  /** A duty charge. */
  Duty: 'DUTY',
  /** A fee charge. */
  Fee: 'FEE',
  /** A gift card. */
  GiftCard: 'GIFT_CARD',
  /** A product that was purchased, returned, or exchanged. */
  Product: 'PRODUCT',
  /** A shipping charge. */
  Shipping: 'SHIPPING',
  /** A tip given by the customer. */
  Tip: 'TIP',
  /** An unknown sale line type. This represents new types that may be added in future versions. */
  Unknown: 'UNKNOWN'
} as const;

export type SaleLineType = typeof SaleLineType[keyof typeof SaleLineType];
/** The tax allocated to a sale from a single tax line. */
export type SaleTax = Node & {
  __typename?: 'SaleTax';
  /** The portion of the total tax amount on the related sale that's from the associated tax line. */
  amount: MoneyV2;
  /** The unique ID for the sale tax. */
  id: Scalars['ID']['output'];
  /** The tax line associated with the sale. */
  taxLine: TaxLine;
};

/** A contract between a merchant and a customer to do business. Shopify creates a sales agreement whenever an order is placed, edited, or refunded. A sales agreement has one or more sales records, which provide itemized details about the initial agreement or subsequent changes made to the order. For example, when a customer places an order, Shopify creates the order, generates a sales agreement, and records a sale for each line item purchased in the order. A sale record is specific to a type of order line. Order lines can represent different things such as a purchased product, a tip added by a customer, shipping costs collected at checkout, and more. */
export type SalesAgreement = {
  /** The date and time when the agreement occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the agreement. */
  id: Scalars['ID']['output'];
  /** The reason the agreement was created. */
  reason: OrderActionType;
  /** The sales associated with the agreement. */
  sales: SaleConnection;
};


/** A contract between a merchant and a customer to do business. Shopify creates a sales agreement whenever an order is placed, edited, or refunded. A sales agreement has one or more sales records, which provide itemized details about the initial agreement or subsequent changes made to the order. For example, when a customer places an order, Shopify creates the order, generates a sales agreement, and records a sale for each line item purchased in the order. A sale record is specific to a type of order line. Order lines can represent different things such as a purchased product, a tip added by a customer, shipping costs collected at checkout, and more. */
export type SalesAgreementSalesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** An auto-generated type for paginating through multiple SalesAgreements. */
export type SalesAgreementConnection = {
  __typename?: 'SalesAgreementConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SalesAgreementEdge>;
  /** A list of nodes that are contained in SalesAgreementEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<SalesAgreement>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one SalesAgreement and a cursor during pagination. */
export type SalesAgreementEdge = {
  __typename?: 'SalesAgreementEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SalesAgreementEdge. */
  node: SalesAgreement;
};

/** Captures the intentions of a discount that was created by a Shopify Script. */
export type ScriptDiscountApplication = DiscountApplication & {
  __typename?: 'ScriptDiscountApplication';
  /** The method by which the discount's value is allocated to its entitled items. */
  allocationMethod: DiscountApplicationAllocationMethod;
  /** The lines of targetType that the discount is allocated over. */
  targetSelection: DiscountApplicationTargetSelection;
  /** The type of line that the discount is applicable towards. */
  targetType: DiscountApplicationTargetType;
  /** The title of the application as defined by the Script. */
  title: Scalars['String']['output'];
  /** The value of the discount application. */
  value: PricingValue;
};

/** Represents the shipping details that the customer chose for their order. */
export type ShippingLine = {
  __typename?: 'ShippingLine';
  /** A unique identifier for the shipping rate. */
  handle?: Maybe<Scalars['String']['output']>;
  /** The pre-tax shipping price without any discounts applied. */
  originalPrice: MoneyV2;
  /** The title of the shipping line. */
  title: Scalars['String']['output'];
};

/** A sale associated with a shipping charge. */
export type ShippingLineSale = Node & Sale & {
  __typename?: 'ShippingLineSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** A shipping rate to be applied to a checkout. */
export type ShippingRate = {
  __typename?: 'ShippingRate';
  /** The human-readable unique identifier for this shipping rate. */
  handle: Scalars['String']['output'];
  /** The price of this shipping rate. */
  price: MoneyV2;
  /** The title of this shipping rate. */
  title: Scalars['String']['output'];
};

/** A collection of the general information about the shop. */
export type Shop = HasMetafields & Node & {
  __typename?: 'Shop';
  /** Returns the settings for the address form. */
  addressFormSettings: AddressFormSettings;
  /** The email of the shop. */
  email: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** A metafield found by namespace and key. */
  metafield?: Maybe<Metafield>;
  /**
   * The metafields associated with the resource matching the
   * supplied list of namespaces and keys.
   */
  metafields: Array<Maybe<Metafield>>;
  /** The shop's .myshopify.com domain name. */
  myshopifyDomain: Scalars['String']['output'];
  /** The name of the shop. */
  name: Scalars['String']['output'];
  /** The list of all legal policies associated with the shop. */
  shopPolicies: Array<ShopPolicy>;
  /** The URL of the shop's online store. */
  url: Scalars['URL']['output'];
};


/** A collection of the general information about the shop. */
export type ShopMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};


/** A collection of the general information about the shop. */
export type ShopMetafieldsArgs = {
  identifiers: Array<HasMetafieldsIdentifier>;
};

/** The shop app links and resources for an order. */
export type ShopAppLinksAndResources = {
  __typename?: 'ShopAppLinksAndResources';
  /** Whether the the buyer is associated to Shop App. */
  buyerHasShopApp: Scalars['Boolean']['output'];
  /** Whether the the buyer is associated to Shop Pay. */
  buyerHasShopPay: Scalars['Boolean']['output'];
  /** Whether or not the track order updates button should be rendered. */
  canTrackOrderUpdates: Scalars['Boolean']['output'];
  /** Whether or not showing the installments highlight is eligible. */
  installmentsHighlightEligible: Scalars['Boolean']['output'];
  /** The URL to the mobile Shop App. */
  mobileUrl: Scalars['URL']['output'];
  /** The attribution details related to the mobile url. */
  mobileUrlAttributionPayload: Scalars['String']['output'];
  /** The various options that exist for subscribing to order updates. */
  orderUpdateOptions: Array<Scalars['String']['output']>;
  /** The URL to the Shop App QR code. */
  qrCodeUrl: Scalars['URL']['output'];
  /** Whether or not Shop App eligible. */
  shopAppEligible: Scalars['Boolean']['output'];
  /** Whether QR code should be hidden. */
  shopAppQrCodeKillswitch: Scalars['Boolean']['output'];
  /** The URL to the Shop Pay Installments reminders. */
  shopInstallmentsMobileUrl: Scalars['URL']['output'];
  /** The URL to view the Shop Pay Installments schedules in the mobile Shop App. */
  shopInstallmentsViewSchedules: Scalars['URL']['output'];
  /** Whether the order was a shop pay order. */
  shopPayOrder: Scalars['Boolean']['output'];
};

/** Return type for `shopPayCreditCardGetUpdateUrl` mutation. */
export type ShopPayCreditCardGetUpdateUrlPayload = {
  __typename?: 'ShopPayCreditCardGetUpdateUrlPayload';
  /** The URL to which the customer should be redirected to update their Shop Pay credit card. */
  updateShopPayCreditCardUrl?: Maybe<Scalars['URL']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsPaymentInstrumentUserErrors>;
};

/** A policy that a merchant has configured for their store, such as their refund or privacy policy. */
export type ShopPolicy = Node & {
  __typename?: 'ShopPolicy';
  /** The text of the policy. The maximum size is 512kb. */
  body: Scalars['HTML']['output'];
  /** The handle of the policy. */
  handle: Scalars['String']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The title of the policy. */
  title: Scalars['String']['output'];
  /** The public URL to the policy. */
  url: Scalars['URL']['output'];
};

/** Defines the valid SMS marketing states for a customer’s phone number. */
export const SmsMarketingState = {
  /** The customer has not subscribed to SMS marketing. */
  NotSubscribed: 'NOT_SUBSCRIBED',
  /** The customer is in the process of subscribing to SMS marketing. */
  Pending: 'PENDING',
  /** The customer's personal data has been erased. This value is internally-set and read-only. */
  Redacted: 'REDACTED',
  /** The customer has subscribed to SMS marketing. */
  Subscribed: 'SUBSCRIBED',
  /** The customer is not currently subscribed to SMS marketing but was previously subscribed. */
  Unsubscribed: 'UNSUBSCRIBED'
} as const;

export type SmsMarketingState = typeof SmsMarketingState[keyof typeof SmsMarketingState];
/**
 * A store credit account contains a monetary balance that can be redeemed at checkout for purchases in the shop.
 * The account is held in the specified currency and has an owner that cannot be transferred.
 *
 * The account balance is redeemable at checkout only when the owner is authenticated via [new customer accounts authentication](https://shopify.dev/docs/api/customer).
 */
export type StoreCreditAccount = Node & {
  __typename?: 'StoreCreditAccount';
  /** The current balance of the store credit account. */
  balance: MoneyV2;
  /** The expirable part of the store credit account balance. */
  expirableBalance: MoneyV2;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The transaction history of the store credit account. */
  transactions: StoreCreditAccountTransactionConnection;
};


/**
 * A store credit account contains a monetary balance that can be redeemed at checkout for purchases in the shop.
 * The account is held in the specified currency and has an owner that cannot be transferred.
 *
 * The account balance is redeemable at checkout only when the owner is authenticated via [new customer accounts authentication](https://shopify.dev/docs/api/customer).
 */
export type StoreCreditAccountTransactionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<TransactionSortKeys>;
};

/** An auto-generated type for paginating through multiple StoreCreditAccounts. */
export type StoreCreditAccountConnection = {
  __typename?: 'StoreCreditAccountConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<StoreCreditAccountEdge>;
  /** A list of nodes that are contained in StoreCreditAccountEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<StoreCreditAccount>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** A credit transaction which increases the store credit account balance. */
export type StoreCreditAccountCreditTransaction = Node & StoreCreditAccountTransaction & {
  __typename?: 'StoreCreditAccountCreditTransaction';
  /** The store credit account that the transaction belongs to. */
  account: StoreCreditAccount;
  /** The amount of the transaction. */
  amount: MoneyV2;
  /** The balance of the account after the transaction. */
  balanceAfterTransaction: MoneyV2;
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The event that caused the store credit account transaction. */
  event: StoreCreditSystemEvent;
  /**
   * The time at which the transaction expires.
   * Debit transactions will always spend the soonest expiring credit first.
   */
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The origin of the store credit account transaction. */
  origin?: Maybe<StoreCreditAccountTransactionOrigin>;
  /**
   * The remaining amount of the credit.
   * The remaining amount will decrease when a debit spends this credit. It may also increase if that debit is subsequently reverted.
   * In the event that the credit expires, the remaining amount will represent the amount that remained as the expiry ocurred.
   */
  remainingAmount: MoneyV2;
};

/**
 * A debit revert transaction which increases the store credit account balance.
 * Debit revert transactions are created automatically when a [store credit account debit transaction](https://shopify.dev/api/admin-graphql/latest/objects/StoreCreditAccountDebitTransaction) is reverted.
 *
 * Store credit account debit transactions are reverted when an order is cancelled, refunded or in the event of a payment failure at checkout.
 * The amount added to the balance is equal to the amount reverted on the original credit.
 */
export type StoreCreditAccountDebitRevertTransaction = Node & StoreCreditAccountTransaction & {
  __typename?: 'StoreCreditAccountDebitRevertTransaction';
  /** The store credit account that the transaction belongs to. */
  account: StoreCreditAccount;
  /** The amount of the transaction. */
  amount: MoneyV2;
  /** The balance of the account after the transaction. */
  balanceAfterTransaction: MoneyV2;
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The reverted debit transaction. */
  debitTransaction: StoreCreditAccountDebitTransaction;
  /** The event that caused the store credit account transaction. */
  event: StoreCreditSystemEvent;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The origin of the store credit account transaction. */
  origin?: Maybe<StoreCreditAccountTransactionOrigin>;
};

/** A debit transaction which decreases the store credit account balance. */
export type StoreCreditAccountDebitTransaction = Node & StoreCreditAccountTransaction & {
  __typename?: 'StoreCreditAccountDebitTransaction';
  /** The store credit account that the transaction belongs to. */
  account: StoreCreditAccount;
  /** The amount of the transaction. */
  amount: MoneyV2;
  /** The balance of the account after the transaction. */
  balanceAfterTransaction: MoneyV2;
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The event that caused the store credit account transaction. */
  event: StoreCreditSystemEvent;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The origin of the store credit account transaction. */
  origin?: Maybe<StoreCreditAccountTransactionOrigin>;
};

/** An auto-generated type which holds one StoreCreditAccount and a cursor during pagination. */
export type StoreCreditAccountEdge = {
  __typename?: 'StoreCreditAccountEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of StoreCreditAccountEdge. */
  node: StoreCreditAccount;
};

/**
 * An expiration transaction which decreases the store credit account balance.
 * Expiration transactions are created automatically when a [store credit account credit transaction](https://shopify.dev/api/admin-graphql/latest/objects/StoreCreditAccountCreditTransaction) expires.
 *
 * The amount subtracted from the balance is equal to the remaining amount of the credit transaction.
 */
export type StoreCreditAccountExpirationTransaction = StoreCreditAccountTransaction & {
  __typename?: 'StoreCreditAccountExpirationTransaction';
  /** The store credit account that the transaction belongs to. */
  account: StoreCreditAccount;
  /** The amount of the transaction. */
  amount: MoneyV2;
  /** The balance of the account after the transaction. */
  balanceAfterTransaction: MoneyV2;
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The credit transaction which expired. */
  creditTransaction: StoreCreditAccountCreditTransaction;
  /** The event that caused the store credit account transaction. */
  event: StoreCreditSystemEvent;
  /** The origin of the store credit account transaction. */
  origin?: Maybe<StoreCreditAccountTransactionOrigin>;
};

/** Interface for a store credit account transaction. */
export type StoreCreditAccountTransaction = {
  /** The store credit account that the transaction belongs to. */
  account: StoreCreditAccount;
  /** The amount of the transaction. */
  amount: MoneyV2;
  /** The balance of the account after the transaction. */
  balanceAfterTransaction: MoneyV2;
  /** The date and time when the transaction was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The event that caused the store credit account transaction. */
  event: StoreCreditSystemEvent;
  /** The origin of the store credit account transaction. */
  origin?: Maybe<StoreCreditAccountTransactionOrigin>;
};

/** An auto-generated type for paginating through multiple StoreCreditAccountTransactions. */
export type StoreCreditAccountTransactionConnection = {
  __typename?: 'StoreCreditAccountTransactionConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<StoreCreditAccountTransactionEdge>;
  /** A list of nodes that are contained in StoreCreditAccountTransactionEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<StoreCreditAccountTransaction>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one StoreCreditAccountTransaction and a cursor during pagination. */
export type StoreCreditAccountTransactionEdge = {
  __typename?: 'StoreCreditAccountTransactionEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of StoreCreditAccountTransactionEdge. */
  node: StoreCreditAccountTransaction;
};

/** The origin of a store credit account transaction. */
export type StoreCreditAccountTransactionOrigin = OrderTransaction;

/** The event that caused the store credit account transaction. */
export const StoreCreditSystemEvent = {
  /** An adjustment was made to the store credit account. */
  Adjustment: 'ADJUSTMENT',
  /** Store credit was returned when an authorized payment was voided. */
  OrderCancellation: 'ORDER_CANCELLATION',
  /** Store credit was used as payment for an order. */
  OrderPayment: 'ORDER_PAYMENT',
  /** Store credit was refunded from an order. */
  OrderRefund: 'ORDER_REFUND',
  /** A store credit payment was reverted due to another payment method failing. */
  PaymentFailure: 'PAYMENT_FAILURE',
  /** A smaller amount of store credit was captured than was originally authorized. */
  PaymentReturned: 'PAYMENT_RETURNED',
  /** Tax finalization affected the store credit payment. */
  TaxFinalization: 'TAX_FINALIZATION'
} as const;

export type StoreCreditSystemEvent = typeof StoreCreditSystemEvent[keyof typeof StoreCreditSystemEvent];
/** Return type for `storefrontCustomerAccessTokenCreate` mutation. */
export type StorefrontCustomerAccessTokenCreatePayload = {
  __typename?: 'StorefrontCustomerAccessTokenCreatePayload';
  /** The created access token. */
  customerAccessToken?: Maybe<Scalars['String']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsStorefrontCustomerAccessTokenCreateUserErrors>;
};

/** Return type for `stripeFinancialConnectionsSessionInitiate` mutation. */
export type StripeFinancialConnectionsSessionInitiatePayload = {
  __typename?: 'StripeFinancialConnectionsSessionInitiatePayload';
  /** The Stripe Financial Connections client secret for session initiation. */
  clientSecret?: Maybe<Scalars['String']['output']>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<UserErrorsStripeFinancialConnectionsSessionUserErrors>;
};

/** Represents a subscription anchor. */
export type SubscriptionAnchor = SubscriptionMonthDayAnchor | SubscriptionWeekDayAnchor | SubscriptionYearDayAnchor;

/** The billing cycle of a subscription. */
export type SubscriptionBillingCycle = {
  __typename?: 'SubscriptionBillingCycle';
  /** The expected date of the billing attempt. */
  billingAttemptExpectedDate: Scalars['DateTime']['output'];
  /** The end date of the billing cycle. */
  cycleEndAt: Scalars['DateTime']['output'];
  /** The index of the billing cycle. */
  cycleIndex: Scalars['Int']['output'];
  /** The start date of the billing cycle. */
  cycleStartAt: Scalars['DateTime']['output'];
  /** Whether the billing cycle was edited. */
  edited: Scalars['Boolean']['output'];
  /** Whether the billing cycle was skipped. */
  skipped: Scalars['Boolean']['output'];
  /** The status of the billing cycle. */
  status: SubscriptionBillingCycleBillingCycleStatus;
};

/** The possible statuses of a subscription billing cycle. */
export const SubscriptionBillingCycleBillingCycleStatus = {
  /** The billing cycle has been billed. */
  Billed: 'BILLED',
  /** The billing cycle has not been billed. */
  Unbilled: 'UNBILLED'
} as const;

export type SubscriptionBillingCycleBillingCycleStatus = typeof SubscriptionBillingCycleBillingCycleStatus[keyof typeof SubscriptionBillingCycleBillingCycleStatus];
/** An auto-generated type for paginating through multiple SubscriptionBillingCycles. */
export type SubscriptionBillingCycleConnection = {
  __typename?: 'SubscriptionBillingCycleConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SubscriptionBillingCycleEdge>;
  /** A list of nodes that are contained in SubscriptionBillingCycleEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<SubscriptionBillingCycle>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one SubscriptionBillingCycle and a cursor during pagination. */
export type SubscriptionBillingCycleEdge = {
  __typename?: 'SubscriptionBillingCycleEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SubscriptionBillingCycleEdge. */
  node: SubscriptionBillingCycle;
};

/** The input fields for specifying the subscription contract and selecting the associated billing cycle. */
export type SubscriptionBillingCycleInput = {
  /** The ID of the subscription contract associated with the billing cycle. */
  contractId: Scalars['ID']['input'];
  /** Selects the billing cycle by date or index. */
  selector: SubscriptionBillingCycleSelector;
};

/** The input fields to select a SubscriptionBillingCycle by either date or index. */
export type SubscriptionBillingCycleSelector = {
  /** The date to select a billing cycle. */
  date?: InputMaybe<Scalars['DateTime']['input']>;
  /** The index to select a billing cycle. */
  index?: InputMaybe<Scalars['Int']['input']>;
};

/** Return type for `subscriptionBillingCycleSkip` mutation. */
export type SubscriptionBillingCycleSkipPayload = {
  __typename?: 'SubscriptionBillingCycleSkipPayload';
  /** The updated billing cycle. */
  billingCycle?: Maybe<SubscriptionBillingCycle>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionBillingCycleSkipUserError>;
};

/** An error that occurs during the execution of `SubscriptionBillingCycleSkip`. */
export type SubscriptionBillingCycleSkipUserError = DisplayableError & {
  __typename?: 'SubscriptionBillingCycleSkipUserError';
  /** The error code. */
  code?: Maybe<SubscriptionBillingCycleSkipUserErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `SubscriptionBillingCycleSkipUserError`. */
export const SubscriptionBillingCycleSkipUserErrorCode = {
  /** The input value is invalid. */
  Invalid: 'INVALID'
} as const;

export type SubscriptionBillingCycleSkipUserErrorCode = typeof SubscriptionBillingCycleSkipUserErrorCode[keyof typeof SubscriptionBillingCycleSkipUserErrorCode];
/** Return type for `subscriptionBillingCycleUnskip` mutation. */
export type SubscriptionBillingCycleUnskipPayload = {
  __typename?: 'SubscriptionBillingCycleUnskipPayload';
  /** The updated billing cycle. */
  billingCycle?: Maybe<SubscriptionBillingCycle>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionBillingCycleUnskipUserError>;
};

/** An error that occurs during the execution of `SubscriptionBillingCycleUnskip`. */
export type SubscriptionBillingCycleUnskipUserError = DisplayableError & {
  __typename?: 'SubscriptionBillingCycleUnskipUserError';
  /** The error code. */
  code?: Maybe<SubscriptionBillingCycleUnskipUserErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `SubscriptionBillingCycleUnskipUserError`. */
export const SubscriptionBillingCycleUnskipUserErrorCode = {
  /** The input value is invalid. */
  Invalid: 'INVALID'
} as const;

export type SubscriptionBillingCycleUnskipUserErrorCode = typeof SubscriptionBillingCycleUnskipUserErrorCode[keyof typeof SubscriptionBillingCycleUnskipUserErrorCode];
/** The set of valid sort keys for the SubscriptionBillingCycles query. */
export const SubscriptionBillingCyclesSortKeys = {
  /** Sort by the `cycle_end_at` value. */
  CycleEndAt: 'CYCLE_END_AT',
  /** Sort by the `cycle_index` value. */
  CycleIndex: 'CYCLE_INDEX',
  /** Sort by the `id` value. */
  Id: 'ID'
} as const;

export type SubscriptionBillingCyclesSortKeys = typeof SubscriptionBillingCyclesSortKeys[keyof typeof SubscriptionBillingCyclesSortKeys];
/** The billing policy of a subscription. */
export type SubscriptionBillingPolicy = {
  __typename?: 'SubscriptionBillingPolicy';
  /** The anchor dates for calculating billing intervals. */
  anchors: Array<SubscriptionAnchor>;
  /** The type of interval associated with this schedule (e.g. Monthly, Weekly, etc). */
  interval: SubscriptionInterval;
  /** The number of intervals between invoices. */
  intervalCount?: Maybe<Count>;
  /** The maximum number of cycles after which the subscription ends. */
  maxCycles?: Maybe<Scalars['Int']['output']>;
  /** The minimum number of cycles required for the subscription. */
  minCycles?: Maybe<Scalars['Int']['output']>;
};

/** A Subscription Contract. */
export type SubscriptionContract = Node & SubscriptionContractBase & {
  __typename?: 'SubscriptionContract';
  /** The subscription app that the subscription contract is registered to. */
  app?: Maybe<App>;
  /** Whether the subscription contract is eligible for customer actions. */
  appEligibleForCustomerActions: Scalars['Boolean']['output'];
  /** The billing policy associated with the subscription contract. */
  billingPolicy: SubscriptionBillingPolicy;
  /** The date and time when the subscription contract was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The currency used for the subscription contract. */
  currencyCode: CurrencyCode;
  /** A list of custom attributes to be added to the generated orders. */
  customAttributes: Array<Attribute>;
  /** The delivery method for each billing of the subscription contract. */
  deliveryMethod?: Maybe<SubscriptionDeliveryMethod>;
  /** The delivery policy associated with the subscription contract. */
  deliveryPolicy: SubscriptionDeliveryPolicy;
  /** The delivery price for each billing of the subscription contract. */
  deliveryPrice: MoneyV2;
  /** The list of subscription discounts associated with the subscription contract. */
  discounts?: Maybe<SubscriptionDiscountConnection>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The last billing error type of the contract. */
  lastBillingAttemptErrorType?: Maybe<SubscriptionContractLastBillingErrorType>;
  /** The current status of the last payment. */
  lastPaymentStatus?: Maybe<SubscriptionContractLastPaymentStatus>;
  /** The number of lines associated with the subscription contract. */
  lineCount: Scalars['Int']['output'];
  /** A list of subscription lines associated with the subscription contract. */
  lines: SubscriptionLineConnection;
  /** The number of lines associated with the subscription contract. */
  linesCount?: Maybe<Count>;
  /** The next billing date for the subscription contract. */
  nextBillingDate?: Maybe<Scalars['DateTime']['output']>;
  /** A note that will be applied to the generated orders. */
  note?: Maybe<Scalars['String']['output']>;
  /** A list of the subscription contract's orders. */
  orders: OrderConnection;
  /** The order from which the contract originated. */
  originOrder?: Maybe<Order>;
  /** The payment instrument being charged for this subscription contract. */
  paymentInstrument?: Maybe<PaymentInstrument>;
  /** An estimate of the breakdown of the amounts that will be charged in the next billing attempt. */
  priceBreakdownEstimate?: Maybe<SubscriptionPriceBreakdown>;
  /** The revision ID of the contract. */
  revisionId: Scalars['UnsignedInt64']['output'];
  /** The current status of the subscription contract. */
  status: SubscriptionContractSubscriptionStatus;
  /** The upcoming billing cycles on the subscription contract. */
  upcomingBillingCycles: SubscriptionBillingCycleConnection;
  /** The date and time when the subscription contract was updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** A Subscription Contract. */
export type SubscriptionContractDiscountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A Subscription Contract. */
export type SubscriptionContractLinesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A Subscription Contract. */
export type SubscriptionContractOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** A Subscription Contract. */
export type SubscriptionContractUpcomingBillingCyclesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
  sortKey?: InputMaybe<SubscriptionBillingCyclesSortKeys>;
};

/** Return type for `subscriptionContractActivate` mutation. */
export type SubscriptionContractActivatePayload = {
  __typename?: 'SubscriptionContractActivatePayload';
  /** The activated Subscription Contract. */
  contract?: Maybe<SubscriptionContract>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractStatusUpdateUserError>;
};

/** The common fields of a subscription contract. */
export type SubscriptionContractBase = {
  /** Whether the subscription contract is eligible for customer actions. */
  appEligibleForCustomerActions: Scalars['Boolean']['output'];
  /** The currency used for the subscription contract. */
  currencyCode: CurrencyCode;
  /** A list of custom attributes to be added to the generated orders. */
  customAttributes: Array<Attribute>;
  /** The delivery method for each billing of the subscription contract. */
  deliveryMethod?: Maybe<SubscriptionDeliveryMethod>;
  /** The delivery price for each billing of the subscription contract. */
  deliveryPrice: MoneyV2;
  /** The list of subscription discounts associated with the subscription contract. */
  discounts?: Maybe<SubscriptionDiscountConnection>;
  /** The number of lines associated with the subscription contract. */
  lineCount: Scalars['Int']['output'];
  /** A list of subscription lines associated with the subscription contract. */
  lines: SubscriptionLineConnection;
  /** The number of lines associated with the subscription contract. */
  linesCount?: Maybe<Count>;
  /** A note that will be applied to the generated orders. */
  note?: Maybe<Scalars['String']['output']>;
  /** A list of the subscription contract's orders. */
  orders: OrderConnection;
  /** An estimate of the breakdown of the amounts that will be charged in the next billing attempt. */
  priceBreakdownEstimate?: Maybe<SubscriptionPriceBreakdown>;
  /** The date and time when the subscription contract was updated. */
  updatedAt: Scalars['DateTime']['output'];
};


/** The common fields of a subscription contract. */
export type SubscriptionContractBaseDiscountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The common fields of a subscription contract. */
export type SubscriptionContractBaseLinesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


/** The common fields of a subscription contract. */
export type SubscriptionContractBaseOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Return type for `subscriptionContractCancel` mutation. */
export type SubscriptionContractCancelPayload = {
  __typename?: 'SubscriptionContractCancelPayload';
  /** The canceled Subscription Contract. */
  contract?: Maybe<SubscriptionContract>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractStatusUpdateUserError>;
};

/** Return type for `subscriptionContractChangePaymentInstrument` mutation. */
export type SubscriptionContractChangePaymentInstrumentPayload = {
  __typename?: 'SubscriptionContractChangePaymentInstrumentPayload';
  /** The updated Subscription Contract after the payment instrument change. */
  contract?: Maybe<SubscriptionContract>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractUserError>;
};

/** An auto-generated type for paginating through multiple SubscriptionContracts. */
export type SubscriptionContractConnection = {
  __typename?: 'SubscriptionContractConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SubscriptionContractEdge>;
  /** A list of nodes that are contained in SubscriptionContractEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<SubscriptionContract>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one SubscriptionContract and a cursor during pagination. */
export type SubscriptionContractEdge = {
  __typename?: 'SubscriptionContractEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SubscriptionContractEdge. */
  node: SubscriptionContract;
};

/** Return type for `subscriptionContractFetchDeliveryOptions` mutation. */
export type SubscriptionContractFetchDeliveryOptionsPayload = {
  __typename?: 'SubscriptionContractFetchDeliveryOptionsPayload';
  /** The available delivery options for a given delivery address. Returns `null` for pending requests. */
  deliveryOptionsResult?: Maybe<SubscriptionDeliveryOptionsResult>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractUserError>;
};

/** The possible values of the last billing error on a subscription contract. */
export const SubscriptionContractLastBillingErrorType = {
  /** Subscription billing attempt error due to customer error. */
  CustomerError: 'CUSTOMER_ERROR',
  /** Subscription billing attempt error due to inventory error. */
  InventoryError: 'INVENTORY_ERROR',
  /** All other billing attempt errors. */
  Other: 'OTHER',
  /** Subscription billing attempt error due to payment error. */
  PaymentError: 'PAYMENT_ERROR'
} as const;

export type SubscriptionContractLastBillingErrorType = typeof SubscriptionContractLastBillingErrorType[keyof typeof SubscriptionContractLastBillingErrorType];
/** The status of the last payment on a subscription contract. */
export const SubscriptionContractLastPaymentStatus = {
  /** A failed subscription billing attempt. */
  Failed: 'FAILED',
  /** A successful subscription billing attempt. */
  Succeeded: 'SUCCEEDED'
} as const;

export type SubscriptionContractLastPaymentStatus = typeof SubscriptionContractLastPaymentStatus[keyof typeof SubscriptionContractLastPaymentStatus];
/** Return type for `subscriptionContractPause` mutation. */
export type SubscriptionContractPausePayload = {
  __typename?: 'SubscriptionContractPausePayload';
  /** The updated Subscription Contract after the pause operation. */
  contract?: Maybe<SubscriptionContract>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractStatusUpdateUserError>;
};

/** Return type for `subscriptionContractSelectDeliveryMethod` mutation. */
export type SubscriptionContractSelectDeliveryMethodPayload = {
  __typename?: 'SubscriptionContractSelectDeliveryMethodPayload';
  /** The updated subscription contract object. */
  contract?: Maybe<SubscriptionContract>;
  /** The list of errors that occurred from executing the mutation. */
  userErrors: Array<SubscriptionContractUserError>;
};

/** Possible error codes that can be returned by `SubscriptionContractStatusUpdateUserError`. */
export const SubscriptionContractStatusUpdateErrorCode = {
  /** Subscription contract status cannot be changed once failed. */
  ContractFailed: 'CONTRACT_FAILED',
  /** Subscription contract status cannot be changed once terminated. */
  ContractTerminated: 'CONTRACT_TERMINATED',
  /** Subscription contract has a future contract or schedule edit. */
  HasFutureEdits: 'HAS_FUTURE_EDITS',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** Subscription contract does not exist. */
  SubscriptionContractDoesNotExist: 'SUBSCRIPTION_CONTRACT_DOES_NOT_EXIST'
} as const;

export type SubscriptionContractStatusUpdateErrorCode = typeof SubscriptionContractStatusUpdateErrorCode[keyof typeof SubscriptionContractStatusUpdateErrorCode];
/** The error codes for failed subscription contract mutations. */
export type SubscriptionContractStatusUpdateUserError = DisplayableError & {
  __typename?: 'SubscriptionContractStatusUpdateUserError';
  /** The error code. */
  code?: Maybe<SubscriptionContractStatusUpdateErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** The status of a subscription. */
export const SubscriptionContractSubscriptionStatus = {
  /** The contract is active and is continuing per its policies. */
  Active: 'ACTIVE',
  /** The contract was ended by an unplanned customer action. */
  Cancelled: 'CANCELLED',
  /** The contract has ended per the expected circumstances. All billing and delivery cycles of the subscriptions have been executed. */
  Expired: 'EXPIRED',
  /** The contract has ended because billing failed and no further billing attempts are expected. */
  Failed: 'FAILED',
  /** The contract is temporarily paused and is expected to resume in the future. */
  Paused: 'PAUSED',
  /** The contract has expired due to inactivity. */
  Stale: 'STALE'
} as const;

export type SubscriptionContractSubscriptionStatus = typeof SubscriptionContractSubscriptionStatus[keyof typeof SubscriptionContractSubscriptionStatus];
/** The error codes for failed subscription contract mutations. */
export type SubscriptionContractUserError = DisplayableError & {
  __typename?: 'SubscriptionContractUserError';
  /** The error code. */
  code?: Maybe<SubscriptionContractUserErrorCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `SubscriptionContractUserError`. */
export const SubscriptionContractUserErrorCode = {
  /** The input value is blank. */
  Blank: 'BLANK',
  /** Subscription contract has a future contract or schedule edit. */
  HasFutureEdits: 'HAS_FUTURE_EDITS',
  /** The input value is invalid. */
  Invalid: 'INVALID',
  /** Payment instrument does not exist. */
  PaymentInstrumentDoesNotExist: 'PAYMENT_INSTRUMENT_DOES_NOT_EXIST',
  /** Subscription contract does not exist. */
  SubscriptionContractDoesNotExist: 'SUBSCRIPTION_CONTRACT_DOES_NOT_EXIST'
} as const;

export type SubscriptionContractUserErrorCode = typeof SubscriptionContractUserErrorCode[keyof typeof SubscriptionContractUserErrorCode];
/** The set of valid sort keys for the SubscriptionContracts query. */
export const SubscriptionContractsSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `id` value. */
  Id: 'ID',
  /** Sort by the `status` value. */
  Status: 'STATUS',
  /** Sort by the `updated_at` value. */
  UpdatedAt: 'UPDATED_AT'
} as const;

export type SubscriptionContractsSortKeys = typeof SubscriptionContractsSortKeys[keyof typeof SubscriptionContractsSortKeys];
/** The delivery method to use to deliver the physical goods to the customer. */
export type SubscriptionDeliveryMethod = SubscriptionDeliveryMethodLocalDelivery | SubscriptionDeliveryMethodPickup | SubscriptionDeliveryMethodShipping;

/**
 * Specifies delivery method fields for a subscription contract.
 * This is an input union: one, and only one, field can be provided.
 * The field provided will determine which delivery method is to be used.
 */
export type SubscriptionDeliveryMethodInput = {
  /** The input fields for the local delivery method. */
  localDelivery?: InputMaybe<SubscriptionDeliveryMethodLocalDeliveryInput>;
  /** The input fields for the pickup delivery method. */
  pickup?: InputMaybe<SubscriptionDeliveryMethodPickupInput>;
  /** The input fields for the shipping delivery method. */
  shipping?: InputMaybe<SubscriptionDeliveryMethodShippingInput>;
};

/** The local delivery method, including a mailing address and a local delivery option. */
export type SubscriptionDeliveryMethodLocalDelivery = {
  __typename?: 'SubscriptionDeliveryMethodLocalDelivery';
  /** The delivery address. */
  address: SubscriptionMailingAddress;
  /** The local delivery method details. */
  localDeliveryOption: SubscriptionDeliveryMethodLocalDeliveryOption;
};

/** The input fields for a local delivery method. */
export type SubscriptionDeliveryMethodLocalDeliveryInput = {
  /** The address to deliver to. */
  address?: InputMaybe<CustomerMailingAddressInput>;
  /** The address to deliver to. */
  deliveryAddress?: InputMaybe<CustomerAddressInput>;
  /** The delivery instructions that the customer can provide to the merchant. */
  instructions?: InputMaybe<Scalars['String']['input']>;
  /**
   * The phone number that the customer must provide to the merchant.
   * Formatted using E.164 standard. For example, `+16135551111`.
   */
  phone: Scalars['String']['input'];
};

/** The delivery option selected for a subscription contract. */
export type SubscriptionDeliveryMethodLocalDeliveryOption = {
  __typename?: 'SubscriptionDeliveryMethodLocalDeliveryOption';
  /** The description of the delivery option shown to the customer. */
  description?: Maybe<Scalars['String']['output']>;
  /** The delivery instructions provided by the customer to the merchant. */
  instructions?: Maybe<Scalars['String']['output']>;
  /**
   * The phone number of the customer provided to the merchant.
   * Formatted using E.164 standard. For example, `+16135551111`.
   */
  phone: Scalars['String']['output'];
  /** The displayed title of the delivery option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The title of the delivery option. */
  title?: Maybe<Scalars['String']['output']>;
};

/** A delivery method with a pickup option. */
export type SubscriptionDeliveryMethodPickup = {
  __typename?: 'SubscriptionDeliveryMethodPickup';
  /** The details of the pickup delivery method. */
  pickupOption: SubscriptionDeliveryMethodPickupOption;
};

/** The input fields for a pickup delivery method. */
export type SubscriptionDeliveryMethodPickupInput = {
  /** The ID of the pickup location. */
  locationId: Scalars['ID']['input'];
};

/** Represents the selected pickup option on a subscription contract. */
export type SubscriptionDeliveryMethodPickupOption = {
  __typename?: 'SubscriptionDeliveryMethodPickupOption';
  /** The details displayed to the customer to describe the pickup option. */
  description?: Maybe<Scalars['String']['output']>;
  /** The address where the customer will pick up the merchandise. */
  pickupAddress: PickupAddress;
  /** The presentment title of the pickup option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The title of the pickup option. */
  title?: Maybe<Scalars['String']['output']>;
};

/** The shipping delivery method, including a mailing address and a shipping option. */
export type SubscriptionDeliveryMethodShipping = {
  __typename?: 'SubscriptionDeliveryMethodShipping';
  /** The address for shipping. */
  address: SubscriptionMailingAddress;
  /** The details of the shipping method. */
  shippingOption: SubscriptionDeliveryMethodShippingOption;
};

/** The input fields for a shipping delivery method. */
export type SubscriptionDeliveryMethodShippingInput = {
  /** The address to ship to. */
  shippingAddress?: InputMaybe<CustomerAddressInput>;
};

/** The selected shipping option on a subscription contract. */
export type SubscriptionDeliveryMethodShippingOption = {
  __typename?: 'SubscriptionDeliveryMethodShippingOption';
  /** The description of the shipping option. */
  description?: Maybe<Scalars['String']['output']>;
  /** The presentment title of the shipping option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The title of the shipping option. */
  title?: Maybe<Scalars['String']['output']>;
};

/** The delivery option for a subscription contract. */
export type SubscriptionDeliveryOption = SubscriptionLocalDeliveryOption | SubscriptionPickupOption | SubscriptionShippingOption;

/** The result of the query that fetches delivery options for the subscription contract. */
export type SubscriptionDeliveryOptionsResult = SubscriptionDeliveryOptionsResultFailure | SubscriptionDeliveryOptionsResultSuccess;

/** A failed result indicating unavailability of delivery options for the subscription contract. */
export type SubscriptionDeliveryOptionsResultFailure = {
  __typename?: 'SubscriptionDeliveryOptionsResultFailure';
  /** The reason for the failure. */
  message?: Maybe<Scalars['String']['output']>;
};

/** A successful result containing the available delivery options for the subscription contract. */
export type SubscriptionDeliveryOptionsResultSuccess = {
  __typename?: 'SubscriptionDeliveryOptionsResultSuccess';
  /** The available delivery options. */
  deliveryOptions: Array<SubscriptionDeliveryOption>;
  /** The token associated with the successful result of delivery options. */
  token: Scalars['String']['output'];
};

/** The delivery policy of a subscription. */
export type SubscriptionDeliveryPolicy = {
  __typename?: 'SubscriptionDeliveryPolicy';
  /** The anchor dates for calculating delivery intervals. */
  anchors: Array<SubscriptionAnchor>;
  /** The type of interval associated with this schedule (e.g. Monthly, Weekly, etc). */
  interval: SubscriptionInterval;
  /** The number of intervals between deliveries. */
  intervalCount?: Maybe<Count>;
};

/** A discount applied to a subscription contract. */
export type SubscriptionDiscount = {
  __typename?: 'SubscriptionDiscount';
  /** Specify whether the subscription discount will apply on all subscription lines. */
  appliesToAllLines: Scalars['Boolean']['output'];
  /** The unique ID. */
  id: Scalars['ID']['output'];
  /** The list of subscription lines associated with the subscription discount. */
  lines?: Maybe<SubscriptionLineConnection>;
  /** The maximum number of times the subscription discount will be applied on orders. */
  recurringCycleLimit?: Maybe<Scalars['Int']['output']>;
  /** Type of line the discount applies on. */
  targetType: DiscountTargetType;
  /** The title associated with the subscription discount. */
  title?: Maybe<Scalars['String']['output']>;
  /** The type of the subscription discount. */
  type: DiscountType;
  /** The number of times the discount was applied. */
  usageCount?: Maybe<Count>;
  /** The value of the subscription discount. */
  value: SubscriptionDiscountValue;
};


/** A discount applied to a subscription contract. */
export type SubscriptionDiscountLinesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Represents what a particular discount reduces from a line price. */
export type SubscriptionDiscountAllocation = {
  __typename?: 'SubscriptionDiscountAllocation';
  /** Allocation amount. */
  amount: MoneyV2;
  /** Discount that created the allocation. */
  discount: SubscriptionDiscount;
};

/** An auto-generated type for paginating through multiple SubscriptionDiscounts. */
export type SubscriptionDiscountConnection = {
  __typename?: 'SubscriptionDiscountConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SubscriptionDiscountEdge>;
  /** A list of nodes that are contained in SubscriptionDiscountEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<SubscriptionDiscount>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one SubscriptionDiscount and a cursor during pagination. */
export type SubscriptionDiscountEdge = {
  __typename?: 'SubscriptionDiscountEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SubscriptionDiscountEdge. */
  node: SubscriptionDiscount;
};

/** The value of the discount and how it will be applied. */
export type SubscriptionDiscountFixedAmountValue = {
  __typename?: 'SubscriptionDiscountFixedAmountValue';
  /** The fixed amount value of the discount. */
  amount: MoneyV2;
  /** Whether the amount is applied per item. */
  appliesOnEachItem: Scalars['Boolean']['output'];
};

/** The percentage value of the discount. */
export type SubscriptionDiscountPercentageValue = {
  __typename?: 'SubscriptionDiscountPercentageValue';
  /** The percentage value of the discount. */
  percentage: Scalars['Int']['output'];
};

/** The value of the discount and how it will be applied. */
export type SubscriptionDiscountValue = SubscriptionDiscountFixedAmountValue | SubscriptionDiscountPercentageValue;

/** Defines valid subscription intervals. */
export const SubscriptionInterval = {
  /** Represents a day interval. */
  Day: 'DAY',
  /** Represents a month interval. */
  Month: 'MONTH',
  /** Represents a week interval. */
  Week: 'WEEK',
  /** Represents a year interval. */
  Year: 'YEAR'
} as const;

export type SubscriptionInterval = typeof SubscriptionInterval[keyof typeof SubscriptionInterval];
/** A line item in a subscription. */
export type SubscriptionLine = {
  __typename?: 'SubscriptionLine';
  /** The current price per unit for the subscription line in the contract's currency. */
  currentPrice: MoneyV2;
  /** The custom attributes associated with the line item. */
  customAttributes: Array<Attribute>;
  /** Discount allocations. */
  discountAllocations: Array<SubscriptionDiscountAllocation>;
  /** The unique ID of the line item. */
  id: Scalars['ID']['output'];
  /** The image associated with the product variant. */
  image?: Maybe<Image>;
  /** The total price of the line item after all discounts have been applied. */
  lineDiscountedPrice: MoneyV2;
  /** The name of the product. */
  name: Scalars['String']['output'];
  /**
   * The URL of the product in the online store.
   * A value of `null` indicates that the product isn't published in the Online Store sales channel.
   */
  onlineStoreUrl?: Maybe<Scalars['URL']['output']>;
  /** The quantity of the unit selected for the subscription line. */
  quantity: Scalars['Int']['output'];
  /** Whether the product variant requires shipping. */
  requiresShipping: Scalars['Boolean']['output'];
  /** The SKU of the product variant associated with the subscription line. */
  sku?: Maybe<Scalars['String']['output']>;
  /** Whether the product variant is taxable. */
  taxable: Scalars['Boolean']['output'];
  /** The title of the product associated with the subscription line. */
  title: Scalars['String']['output'];
  /** The image associated with the product variant. */
  variantImage?: Maybe<Image>;
  /** The title of the product variant associated with the subscription line. */
  variantTitle?: Maybe<Scalars['String']['output']>;
};

/** An auto-generated type for paginating through multiple SubscriptionLines. */
export type SubscriptionLineConnection = {
  __typename?: 'SubscriptionLineConnection';
  /** The connection between the node and its parent. Each edge contains a minimum of the edge's cursor and the node. */
  edges: Array<SubscriptionLineEdge>;
  /** A list of nodes that are contained in SubscriptionLineEdge. You can fetch data about an individual node, or you can follow the edges to fetch data about a collection of related nodes. At each node, you specify the fields that you want to retrieve. */
  nodes: Array<SubscriptionLine>;
  /** An object that’s used to retrieve [cursor information](https://shopify.dev/api/usage/pagination-graphql) about the current page. */
  pageInfo: PageInfo;
};

/** An auto-generated type which holds one SubscriptionLine and a cursor during pagination. */
export type SubscriptionLineEdge = {
  __typename?: 'SubscriptionLineEdge';
  /** The position of each node in an array, used in [pagination](https://shopify.dev/api/usage/pagination-graphql). */
  cursor: Scalars['String']['output'];
  /** The item at the end of SubscriptionLineEdge. */
  node: SubscriptionLine;
};

/** A local delivery option for a subscription contract. */
export type SubscriptionLocalDeliveryOption = {
  __typename?: 'SubscriptionLocalDeliveryOption';
  /** The code of the local delivery option. */
  code: Scalars['String']['output'];
  /** The description of the local delivery option. */
  description?: Maybe<Scalars['String']['output']>;
  /** Whether a phone number is required for the local delivery option. */
  phoneRequired: Scalars['Boolean']['output'];
  /** The presentment title of the local delivery option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The price of the local delivery option. */
  price: MoneyV2;
  /** The title of the local delivery option. */
  title: Scalars['String']['output'];
};

/** The mailing address on a subscription. */
export type SubscriptionMailingAddress = {
  __typename?: 'SubscriptionMailingAddress';
  /** The first line of the address, typically the street address or PO Box number. */
  address1?: Maybe<Scalars['String']['output']>;
  /** The second line of the address, typically the apartment, suite, or unit number. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The name of the city, district, village, or town. */
  city?: Maybe<Scalars['String']['output']>;
  /** The name of the customer's company or organization. */
  company?: Maybe<Scalars['String']['output']>;
  /** The name of the country. */
  country?: Maybe<Scalars['String']['output']>;
  /**
   * The two-letter code for the country of the address.
   * For example, US.
   */
  countryCode?: Maybe<CountryCode>;
  /** The first name of the customer. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The last name of the customer. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The full name of the customer, based on the first name and last name. */
  name?: Maybe<Scalars['String']['output']>;
  /** A unique phone number for the customer, formatted using the E.164 standard. For example, _+16135551111_. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The region of the address, such as the province, state, or district. */
  province?: Maybe<Scalars['String']['output']>;
  /**
   * The alphanumeric code for the region.
   * For example, ON.
   */
  provinceCode?: Maybe<Scalars['String']['output']>;
  /** The zip or postal code of the address. */
  zip?: Maybe<Scalars['String']['output']>;
};

/** Represents an anchor specifying a day of the month. */
export type SubscriptionMonthDayAnchor = {
  __typename?: 'SubscriptionMonthDayAnchor';
  /** Day of the month (1-31). */
  dayOfMonth: Scalars['Int']['output'];
};

/** A pickup option to deliver a subscription contract. */
export type SubscriptionPickupOption = {
  __typename?: 'SubscriptionPickupOption';
  /** The code of the pickup option. */
  code: Scalars['String']['output'];
  /** The description of the pickup option. */
  description?: Maybe<Scalars['String']['output']>;
  /** The ID of the pickup location. */
  locationId: Scalars['ID']['output'];
  /** Whether a phone number is required for the pickup option. */
  phoneRequired: Scalars['Boolean']['output'];
  /** The address where the customer will pick up the merchandise. */
  pickupAddress: PickupAddress;
  /** The estimated amount of time it takes for the pickup to be ready. For example, "Usually ready in 24 hours". */
  pickupTime: Scalars['String']['output'];
  /** The presentment title of the pickup option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The price of the pickup option. */
  price: MoneyV2;
  /** The title of the pickup option. */
  title: Scalars['String']['output'];
};

/** Represents the breakdown of prices to be charges in the billing attempt. */
export type SubscriptionPriceBreakdown = {
  __typename?: 'SubscriptionPriceBreakdown';
  /**
   * The sum of the prices for all line items after discounts.
   * If taxesIncluded is true, then the subtotal also includes tax.
   */
  subtotalPrice: MoneyV2;
  /** Whether taxes are included in the subtotal price. */
  taxesIncluded: Scalars['Boolean']['output'];
  /**
   * The total amount discounted.
   * This includes both order and line level discounts.
   */
  totalDiscounts: MoneyV2;
  /** The total price. This includes taxes and discounts. */
  totalPrice: MoneyV2;
  /** The total shipping amount before discounts and returns. */
  totalShippingPrice: MoneyV2;
  /** The total tax amount. */
  totalTax: MoneyV2;
};

/** A shipping option to deliver a subscription contract. */
export type SubscriptionShippingOption = {
  __typename?: 'SubscriptionShippingOption';
  /** The code of the shipping option. */
  code: Scalars['String']['output'];
  /** The description of the shipping option. */
  description?: Maybe<Scalars['String']['output']>;
  /** Whether a phone number is required for the shipping option. */
  phoneRequired: Scalars['Boolean']['output'];
  /** The presentment title of the shipping option. */
  presentmentTitle?: Maybe<Scalars['String']['output']>;
  /** The price of the shipping option. */
  price: MoneyV2;
  /** The title of the shipping option. */
  title: Scalars['String']['output'];
};

/** Represents an anchor specifying a day of the week. */
export type SubscriptionWeekDayAnchor = {
  __typename?: 'SubscriptionWeekDayAnchor';
  /** Day of the week (1-7, where 1 is Monday). */
  dayOfWeek: Scalars['Int']['output'];
};

/** Represents an anchor specifying a specific day and month of the year. */
export type SubscriptionYearDayAnchor = {
  __typename?: 'SubscriptionYearDayAnchor';
  /** Day of the month (1-31). Specifies the exact day within the given month. */
  dayOfMonth: Scalars['Int']['output'];
  /** Month of the year (1-12). Specifies the month in which the day occurs. */
  month: Scalars['Int']['output'];
};

/** The available tax exemptions for a customer. */
export const TaxExemption = {
  /** This customer is exempt from GST taxes for holding a valid exemption. The business customer should provide their GST number and account for the GST. */
  AustraliaResellerExemption: 'AUSTRALIA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid COMMERCIAL_FISHERY_EXEMPTION in British Columbia. */
  CaBcCommercialFisheryExemption: 'CA_BC_COMMERCIAL_FISHERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid CONTRACTOR_EXEMPTION in British Columbia. */
  CaBcContractorExemption: 'CA_BC_CONTRACTOR_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid PRODUCTION_AND_MACHINERY_EXEMPTION in British Columbia. */
  CaBcProductionAndMachineryExemption: 'CA_BC_PRODUCTION_AND_MACHINERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in British Columbia. */
  CaBcResellerExemption: 'CA_BC_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid SUB_CONTRACTOR_EXEMPTION in British Columbia. */
  CaBcSubContractorExemption: 'CA_BC_SUB_CONTRACTOR_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid DIPLOMAT_EXEMPTION in Canada. */
  CaDiplomatExemption: 'CA_DIPLOMAT_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid COMMERCIAL_FISHERY_EXEMPTION in Manitoba. */
  CaMbCommercialFisheryExemption: 'CA_MB_COMMERCIAL_FISHERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid FARMER_EXEMPTION in Manitoba. */
  CaMbFarmerExemption: 'CA_MB_FARMER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Manitoba. */
  CaMbResellerExemption: 'CA_MB_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid COMMERCIAL_FISHERY_EXEMPTION in Nova Scotia. */
  CaNsCommercialFisheryExemption: 'CA_NS_COMMERCIAL_FISHERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid FARMER_EXEMPTION in Nova Scotia. */
  CaNsFarmerExemption: 'CA_NS_FARMER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid PURCHASE_EXEMPTION in Ontario. */
  CaOnPurchaseExemption: 'CA_ON_PURCHASE_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid COMMERCIAL_FISHERY_EXEMPTION in Prince Edward Island. */
  CaPeCommercialFisheryExemption: 'CA_PE_COMMERCIAL_FISHERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid COMMERCIAL_FISHERY_EXEMPTION in Saskatchewan. */
  CaSkCommercialFisheryExemption: 'CA_SK_COMMERCIAL_FISHERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid CONTRACTOR_EXEMPTION in Saskatchewan. */
  CaSkContractorExemption: 'CA_SK_CONTRACTOR_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid FARMER_EXEMPTION in Saskatchewan. */
  CaSkFarmerExemption: 'CA_SK_FARMER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid PRODUCTION_AND_MACHINERY_EXEMPTION in Saskatchewan. */
  CaSkProductionAndMachineryExemption: 'CA_SK_PRODUCTION_AND_MACHINERY_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Saskatchewan. */
  CaSkResellerExemption: 'CA_SK_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid SUB_CONTRACTOR_EXEMPTION in Saskatchewan. */
  CaSkSubContractorExemption: 'CA_SK_SUB_CONTRACTOR_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid STATUS_CARD_EXEMPTION in Canada. */
  CaStatusCardExemption: 'CA_STATUS_CARD_EXEMPTION',
  /** This customer is exempt from VAT for purchases within the EU that is shipping from outside of customer's country, as well as purchases from the EU to the UK. */
  EuReverseChargeExemptionRule: 'EU_REVERSE_CHARGE_EXEMPTION_RULE',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Alaska. */
  UsAkResellerExemption: 'US_AK_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Alabama. */
  UsAlResellerExemption: 'US_AL_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Arkansas. */
  UsArResellerExemption: 'US_AR_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Arizona. */
  UsAzResellerExemption: 'US_AZ_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in California. */
  UsCaResellerExemption: 'US_CA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Colorado. */
  UsCoResellerExemption: 'US_CO_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Connecticut. */
  UsCtResellerExemption: 'US_CT_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Washington DC. */
  UsDcResellerExemption: 'US_DC_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Delaware. */
  UsDeResellerExemption: 'US_DE_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Florida. */
  UsFlResellerExemption: 'US_FL_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Georgia. */
  UsGaResellerExemption: 'US_GA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Hawaii. */
  UsHiResellerExemption: 'US_HI_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Iowa. */
  UsIaResellerExemption: 'US_IA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Idaho. */
  UsIdResellerExemption: 'US_ID_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Illinois. */
  UsIlResellerExemption: 'US_IL_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Indiana. */
  UsInResellerExemption: 'US_IN_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Kansas. */
  UsKsResellerExemption: 'US_KS_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Kentucky. */
  UsKyResellerExemption: 'US_KY_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Louisiana. */
  UsLaResellerExemption: 'US_LA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Massachusetts. */
  UsMaResellerExemption: 'US_MA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Maryland. */
  UsMdResellerExemption: 'US_MD_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Maine. */
  UsMeResellerExemption: 'US_ME_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Michigan. */
  UsMiResellerExemption: 'US_MI_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Minnesota. */
  UsMnResellerExemption: 'US_MN_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Missouri. */
  UsMoResellerExemption: 'US_MO_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Mississippi. */
  UsMsResellerExemption: 'US_MS_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Montana. */
  UsMtResellerExemption: 'US_MT_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in North Carolina. */
  UsNcResellerExemption: 'US_NC_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in North Dakota. */
  UsNdResellerExemption: 'US_ND_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Nebraska. */
  UsNeResellerExemption: 'US_NE_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in New Hampshire. */
  UsNhResellerExemption: 'US_NH_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in New Jersey. */
  UsNjResellerExemption: 'US_NJ_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in New Mexico. */
  UsNmResellerExemption: 'US_NM_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Nevada. */
  UsNvResellerExemption: 'US_NV_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in New York. */
  UsNyResellerExemption: 'US_NY_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Ohio. */
  UsOhResellerExemption: 'US_OH_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Oklahoma. */
  UsOkResellerExemption: 'US_OK_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Oregon. */
  UsOrResellerExemption: 'US_OR_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Pennsylvania. */
  UsPaResellerExemption: 'US_PA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Rhode Island. */
  UsRiResellerExemption: 'US_RI_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in South Carolina. */
  UsScResellerExemption: 'US_SC_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in South Dakota. */
  UsSdResellerExemption: 'US_SD_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Tennessee. */
  UsTnResellerExemption: 'US_TN_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Texas. */
  UsTxResellerExemption: 'US_TX_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Utah. */
  UsUtResellerExemption: 'US_UT_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Virginia. */
  UsVaResellerExemption: 'US_VA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Vermont. */
  UsVtResellerExemption: 'US_VT_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Washington. */
  UsWaResellerExemption: 'US_WA_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Wisconsin. */
  UsWiResellerExemption: 'US_WI_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in West Virginia. */
  UsWvResellerExemption: 'US_WV_RESELLER_EXEMPTION',
  /** This customer is exempt from specific taxes for holding a valid RESELLER_EXEMPTION in Wyoming. */
  UsWyResellerExemption: 'US_WY_RESELLER_EXEMPTION'
} as const;

export type TaxExemption = typeof TaxExemption[keyof typeof TaxExemption];
/** The detailed information about tax exemptions that can be applied to customers. */
export type TaxExemptionDetails = {
  __typename?: 'TaxExemptionDetails';
  /** Whether the tax exemption can be applied on tax lines. */
  applicable: Scalars['Boolean']['output'];
  /** An identifier that groups exemptions. */
  exemptionGroup: Scalars['String']['output'];
  /** The translated display name of the tax exemption group. */
  exemptionGroupName: Scalars['String']['output'];
  /** The translated display name of the tax exemption when grouped. */
  groupedName: Scalars['String']['output'];
  /** The translated display name of the tax exemption. */
  name: Scalars['String']['output'];
  /** The code of the tax region this exemption applies to. If null, it applies in all regions. */
  taxRegionCode?: Maybe<TaxRegionCode>;
  /** The unique type of the exemption. */
  type: TaxExemption;
};

/** A tax invoice on an order. */
export type TaxInvoice = {
  __typename?: 'TaxInvoice';
  /** The time zone of the destination address of the tax invoice. */
  buyerTimeZone: Scalars['String']['output'];
  /** The datetime of when the tax invoice was created. */
  createdAt: Scalars['DateTime']['output'];
  /** The invoice number of the tax invoice. */
  invoiceNumber: Scalars['String']['output'];
  /** The current processing status of the tax invoice. */
  status: TaxInvoiceStatus;
  /** The url to download the tax invoice. */
  url: Scalars['URL']['output'];
};

/** The current processing status of the tax invoices. */
export const TaxInvoiceStatus = {
  /** The tax invoice has been created. */
  Processed: 'PROCESSED',
  /** The tax invoice is being created. */
  Processing: 'PROCESSING'
} as const;

export type TaxInvoiceStatus = typeof TaxInvoiceStatus[keyof typeof TaxInvoiceStatus];
/** The details about a single tax applied to the associated line item. */
export type TaxLine = Node & {
  __typename?: 'TaxLine';
  /** Whether the channel that submitted the tax line is responsible for remitting it. */
  channelLiable: Scalars['Boolean']['output'];
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The tax amount in shop and presentment currencies, calculated after discounts and before returns. */
  priceSet: MoneyV2;
  /** The proportion of the line item price represented by the tax, expressed as a decimal. */
  rate?: Maybe<Scalars['Float']['output']>;
  /** The proportion of the line item price represented by the tax, expressed as a percentage. */
  ratePercentage?: Maybe<Scalars['Float']['output']>;
  /** The origin of the tax. */
  source?: Maybe<Scalars['String']['output']>;
  /** The name of the applied tax. */
  title: Scalars['String']['output'];
};

/** The ISO 3166-1 alpha-2 codes that distinguish a region where common tax rules apply. */
export const TaxRegionCode = {
  /** Ascension Island. */
  Ac: 'AC',
  /** Andorra. */
  Ad: 'AD',
  /** United Arab Emirates. */
  Ae: 'AE',
  /** Afghanistan. */
  Af: 'AF',
  /** Antigua & Barbuda. */
  Ag: 'AG',
  /** Anguilla. */
  Ai: 'AI',
  /** Albania. */
  Al: 'AL',
  /** Armenia. */
  Am: 'AM',
  /** Netherlands Antilles. */
  An: 'AN',
  /** Angola. */
  Ao: 'AO',
  /** Argentina. */
  Ar: 'AR',
  /** Austria. */
  At: 'AT',
  /** Australia. */
  Au: 'AU',
  /** Aruba. */
  Aw: 'AW',
  /** Åland Islands. */
  Ax: 'AX',
  /** Azerbaijan. */
  Az: 'AZ',
  /** Bosnia & Herzegovina. */
  Ba: 'BA',
  /** Barbados. */
  Bb: 'BB',
  /** Bangladesh. */
  Bd: 'BD',
  /** Belgium. */
  Be: 'BE',
  /** Burkina Faso. */
  Bf: 'BF',
  /** Bulgaria. */
  Bg: 'BG',
  /** Bahrain. */
  Bh: 'BH',
  /** Burundi. */
  Bi: 'BI',
  /** Benin. */
  Bj: 'BJ',
  /** St. Barthélemy. */
  Bl: 'BL',
  /** Bermuda. */
  Bm: 'BM',
  /** Brunei. */
  Bn: 'BN',
  /** Bolivia. */
  Bo: 'BO',
  /** Caribbean Netherlands. */
  Bq: 'BQ',
  /** Brazil. */
  Br: 'BR',
  /** Bahamas. */
  Bs: 'BS',
  /** Bhutan. */
  Bt: 'BT',
  /** Bouvet Island. */
  Bv: 'BV',
  /** Botswana. */
  Bw: 'BW',
  /** Belarus. */
  By: 'BY',
  /** Belize. */
  Bz: 'BZ',
  /** Canada. */
  Ca: 'CA',
  /** Cocos (Keeling) Islands. */
  Cc: 'CC',
  /** Congo - Kinshasa. */
  Cd: 'CD',
  /** Central African Republic. */
  Cf: 'CF',
  /** Congo - Brazzaville. */
  Cg: 'CG',
  /** Switzerland. */
  Ch: 'CH',
  /** Côte d’Ivoire. */
  Ci: 'CI',
  /** Cook Islands. */
  Ck: 'CK',
  /** Chile. */
  Cl: 'CL',
  /** Cameroon. */
  Cm: 'CM',
  /** China. */
  Cn: 'CN',
  /** Colombia. */
  Co: 'CO',
  /** Costa Rica. */
  Cr: 'CR',
  /** Cuba. */
  Cu: 'CU',
  /** Cape Verde. */
  Cv: 'CV',
  /** Curaçao. */
  Cw: 'CW',
  /** Christmas Island. */
  Cx: 'CX',
  /** Cyprus. */
  Cy: 'CY',
  /** Czechia. */
  Cz: 'CZ',
  /** Germany. */
  De: 'DE',
  /** Djibouti. */
  Dj: 'DJ',
  /** Denmark. */
  Dk: 'DK',
  /** Dominica. */
  Dm: 'DM',
  /** Dominican Republic. */
  Do: 'DO',
  /** Algeria. */
  Dz: 'DZ',
  /** Ecuador. */
  Ec: 'EC',
  /** Estonia. */
  Ee: 'EE',
  /** Egypt. */
  Eg: 'EG',
  /** Western Sahara. */
  Eh: 'EH',
  /** Eritrea. */
  Er: 'ER',
  /** Spain. */
  Es: 'ES',
  /** Ethiopia. */
  Et: 'ET',
  /** European Union. */
  Eu: 'EU',
  /** Finland. */
  Fi: 'FI',
  /** Fiji. */
  Fj: 'FJ',
  /** Falkland Islands. */
  Fk: 'FK',
  /** Faroe Islands. */
  Fo: 'FO',
  /** France. */
  Fr: 'FR',
  /** Gabon. */
  Ga: 'GA',
  /** United Kingdom. */
  Gb: 'GB',
  /** Grenada. */
  Gd: 'GD',
  /** Georgia. */
  Ge: 'GE',
  /** French Guiana. */
  Gf: 'GF',
  /** Guernsey. */
  Gg: 'GG',
  /** Ghana. */
  Gh: 'GH',
  /** Gibraltar. */
  Gi: 'GI',
  /** Greenland. */
  Gl: 'GL',
  /** Gambia. */
  Gm: 'GM',
  /** Guinea. */
  Gn: 'GN',
  /** Guadeloupe. */
  Gp: 'GP',
  /** Equatorial Guinea. */
  Gq: 'GQ',
  /** Greece. */
  Gr: 'GR',
  /** South Georgia & South Sandwich Islands. */
  Gs: 'GS',
  /** Guatemala. */
  Gt: 'GT',
  /** Guinea-Bissau. */
  Gw: 'GW',
  /** Guyana. */
  Gy: 'GY',
  /** Hong Kong SAR. */
  Hk: 'HK',
  /** Heard & McDonald Islands. */
  Hm: 'HM',
  /** Honduras. */
  Hn: 'HN',
  /** Croatia. */
  Hr: 'HR',
  /** Haiti. */
  Ht: 'HT',
  /** Hungary. */
  Hu: 'HU',
  /** Indonesia. */
  Id: 'ID',
  /** Ireland. */
  Ie: 'IE',
  /** Israel. */
  Il: 'IL',
  /** Isle of Man. */
  Im: 'IM',
  /** India. */
  In: 'IN',
  /** British Indian Ocean Territory. */
  Io: 'IO',
  /** Iraq. */
  Iq: 'IQ',
  /** Iran. */
  Ir: 'IR',
  /** Iceland. */
  Is: 'IS',
  /** Italy. */
  It: 'IT',
  /** Jersey. */
  Je: 'JE',
  /** Jamaica. */
  Jm: 'JM',
  /** Jordan. */
  Jo: 'JO',
  /** Japan. */
  Jp: 'JP',
  /** Kenya. */
  Ke: 'KE',
  /** Kyrgyzstan. */
  Kg: 'KG',
  /** Cambodia. */
  Kh: 'KH',
  /** Kiribati. */
  Ki: 'KI',
  /** Comoros. */
  Km: 'KM',
  /** St. Kitts & Nevis. */
  Kn: 'KN',
  /** North Korea. */
  Kp: 'KP',
  /** South Korea. */
  Kr: 'KR',
  /** Kuwait. */
  Kw: 'KW',
  /** Cayman Islands. */
  Ky: 'KY',
  /** Kazakhstan. */
  Kz: 'KZ',
  /** Laos. */
  La: 'LA',
  /** Lebanon. */
  Lb: 'LB',
  /** St. Lucia. */
  Lc: 'LC',
  /** Liechtenstein. */
  Li: 'LI',
  /** Sri Lanka. */
  Lk: 'LK',
  /** Liberia. */
  Lr: 'LR',
  /** Lesotho. */
  Ls: 'LS',
  /** Lithuania. */
  Lt: 'LT',
  /** Luxembourg. */
  Lu: 'LU',
  /** Latvia. */
  Lv: 'LV',
  /** Libya. */
  Ly: 'LY',
  /** Morocco. */
  Ma: 'MA',
  /** Monaco. */
  Mc: 'MC',
  /** Moldova. */
  Md: 'MD',
  /** Montenegro. */
  Me: 'ME',
  /** St. Martin. */
  Mf: 'MF',
  /** Madagascar. */
  Mg: 'MG',
  /** North Macedonia. */
  Mk: 'MK',
  /** Mali. */
  Ml: 'ML',
  /** Myanmar (Burma). */
  Mm: 'MM',
  /** Mongolia. */
  Mn: 'MN',
  /** Macao SAR. */
  Mo: 'MO',
  /** Martinique. */
  Mq: 'MQ',
  /** Mauritania. */
  Mr: 'MR',
  /** Montserrat. */
  Ms: 'MS',
  /** Malta. */
  Mt: 'MT',
  /** Mauritius. */
  Mu: 'MU',
  /** Maldives. */
  Mv: 'MV',
  /** Malawi. */
  Mw: 'MW',
  /** Mexico. */
  Mx: 'MX',
  /** Malaysia. */
  My: 'MY',
  /** Mozambique. */
  Mz: 'MZ',
  /** Namibia. */
  Na: 'NA',
  /** New Caledonia. */
  Nc: 'NC',
  /** Niger. */
  Ne: 'NE',
  /** Norfolk Island. */
  Nf: 'NF',
  /** Nigeria. */
  Ng: 'NG',
  /** Nicaragua. */
  Ni: 'NI',
  /** Netherlands. */
  Nl: 'NL',
  /** Norway. */
  No: 'NO',
  /** Nepal. */
  Np: 'NP',
  /** Nauru. */
  Nr: 'NR',
  /** Niue. */
  Nu: 'NU',
  /** New Zealand. */
  Nz: 'NZ',
  /** Oman. */
  Om: 'OM',
  /** Panama. */
  Pa: 'PA',
  /** Peru. */
  Pe: 'PE',
  /** French Polynesia. */
  Pf: 'PF',
  /** Papua New Guinea. */
  Pg: 'PG',
  /** Philippines. */
  Ph: 'PH',
  /** Pakistan. */
  Pk: 'PK',
  /** Poland. */
  Pl: 'PL',
  /** St. Pierre & Miquelon. */
  Pm: 'PM',
  /** Pitcairn Islands. */
  Pn: 'PN',
  /** Palestinian Territories. */
  Ps: 'PS',
  /** Portugal. */
  Pt: 'PT',
  /** Paraguay. */
  Py: 'PY',
  /** Qatar. */
  Qa: 'QA',
  /** Réunion. */
  Re: 'RE',
  /** Romania. */
  Ro: 'RO',
  /** Serbia. */
  Rs: 'RS',
  /** Russia. */
  Ru: 'RU',
  /** Rwanda. */
  Rw: 'RW',
  /** Saudi Arabia. */
  Sa: 'SA',
  /** Solomon Islands. */
  Sb: 'SB',
  /** Seychelles. */
  Sc: 'SC',
  /** Sudan. */
  Sd: 'SD',
  /** Sweden. */
  Se: 'SE',
  /** Singapore. */
  Sg: 'SG',
  /** St. Helena. */
  Sh: 'SH',
  /** Slovenia. */
  Si: 'SI',
  /** Svalbard & Jan Mayen. */
  Sj: 'SJ',
  /** Slovakia. */
  Sk: 'SK',
  /** Sierra Leone. */
  Sl: 'SL',
  /** San Marino. */
  Sm: 'SM',
  /** Senegal. */
  Sn: 'SN',
  /** Somalia. */
  So: 'SO',
  /** Suriname. */
  Sr: 'SR',
  /** South Sudan. */
  Ss: 'SS',
  /** São Tomé & Príncipe. */
  St: 'ST',
  /** El Salvador. */
  Sv: 'SV',
  /** Sint Maarten. */
  Sx: 'SX',
  /** Syria. */
  Sy: 'SY',
  /** Eswatini. */
  Sz: 'SZ',
  /** Tristan da Cunha. */
  Ta: 'TA',
  /** Turks & Caicos Islands. */
  Tc: 'TC',
  /** Chad. */
  Td: 'TD',
  /** French Southern Territories. */
  Tf: 'TF',
  /** Togo. */
  Tg: 'TG',
  /** Thailand. */
  Th: 'TH',
  /** Tajikistan. */
  Tj: 'TJ',
  /** Tokelau. */
  Tk: 'TK',
  /** Timor-Leste. */
  Tl: 'TL',
  /** Turkmenistan. */
  Tm: 'TM',
  /** Tunisia. */
  Tn: 'TN',
  /** Tonga. */
  To: 'TO',
  /** Türkiye. */
  Tr: 'TR',
  /** Trinidad & Tobago. */
  Tt: 'TT',
  /** Tuvalu. */
  Tv: 'TV',
  /** Taiwan. */
  Tw: 'TW',
  /** Tanzania. */
  Tz: 'TZ',
  /** Ukraine. */
  Ua: 'UA',
  /** Uganda. */
  Ug: 'UG',
  /** U.S. Outlying Islands. */
  Um: 'UM',
  /** United States. */
  Us: 'US',
  /** Uruguay. */
  Uy: 'UY',
  /** Uzbekistan. */
  Uz: 'UZ',
  /** Vatican City. */
  Va: 'VA',
  /** St. Vincent & Grenadines. */
  Vc: 'VC',
  /** Venezuela. */
  Ve: 'VE',
  /** British Virgin Islands. */
  Vg: 'VG',
  /** Vietnam. */
  Vn: 'VN',
  /** Vanuatu. */
  Vu: 'VU',
  /** Wallis & Futuna. */
  Wf: 'WF',
  /** Samoa. */
  Ws: 'WS',
  /** Kosovo. */
  Xk: 'XK',
  /** Yemen. */
  Ye: 'YE',
  /** Mayotte. */
  Yt: 'YT',
  /** South Africa. */
  Za: 'ZA',
  /** Zambia. */
  Zm: 'ZM',
  /** Zimbabwe. */
  Zw: 'ZW'
} as const;

export type TaxRegionCode = typeof TaxRegionCode[keyof typeof TaxRegionCode];
/** The events that chronicle resource activities available to the customer. */
export type TimelineEvent = Node & {
  __typename?: 'TimelineEvent';
  /** The date and time when the event occurred. */
  happenedAt: Scalars['DateTime']['output'];
  /** The unique ID for the timeline event. */
  id: Scalars['ID']['output'];
  /** Additional details about the event. */
  message?: Maybe<Scalars['String']['output']>;
  /** The subtitle of the event. */
  subtitle?: Maybe<Scalars['String']['output']>;
  /** The title of the event. */
  title: Scalars['String']['output'];
};

/** A sale that is associated with a tip. */
export type TipSale = Node & Sale & {
  __typename?: 'TipSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The line item associated with the sale. */
  lineItem: LineItem;
  /** The type of line associated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** Represents the tracking information for a fulfillment. */
export type TrackingInformation = {
  __typename?: 'TrackingInformation';
  /** The name of the tracking company. */
  company?: Maybe<Scalars['String']['output']>;
  /** The tracking number for the fulfillment. */
  number?: Maybe<Scalars['String']['output']>;
  /** The URLs to track the fulfillment. */
  url?: Maybe<Scalars['URL']['output']>;
};

/** The set of valid sort keys for the Transaction query. */
export const TransactionSortKeys = {
  /** Sort by the `created_at` value. */
  CreatedAt: 'CREATED_AT',
  /** Sort by the `expires_at` value. */
  ExpiresAt: 'EXPIRES_AT'
} as const;

export type TransactionSortKeys = typeof TransactionSortKeys[keyof typeof TransactionSortKeys];
/** The details related to the transaction type. */
export type TransactionTypeDetails = {
  __typename?: 'TransactionTypeDetails';
  /** The message of the transaction type. */
  message?: Maybe<Scalars['String']['output']>;
  /** The name of the transaction type. */
  name?: Maybe<Scalars['String']['output']>;
};

/**
 * The custom data attached to a resource. Metafields can be sorted into namespaces and are
 * comprised of keys, values, and value types.
 */
export type UiExtensionMetafield = Node & {
  __typename?: 'UiExtensionMetafield';
  /** The description of a metafield. */
  description?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The key name for a metafield. */
  key: Scalars['String']['output'];
  /** The namespace for a metafield. */
  namespace: Scalars['String']['output'];
  /** The owner ID for a metafield. */
  ownerId: Scalars['ID']['output'];
  /**
   * The type name of the metafield.
   * See the list of [supported types](https://shopify.dev/apps/metafields/definitions/types).
   */
  type: Scalars['String']['output'];
  /** The value of a metafield. */
  value: Scalars['String']['output'];
  /**
   * Represents the metafield value type.
   * @deprecated `valueType` is deprecated and replaced by `type`.
   */
  valueType: MetafieldValueType;
};

/** A session token for a UI extension. */
export type UiExtensionSessionToken = {
  __typename?: 'UiExtensionSessionToken';
  /** The second count until the session token expires. */
  expiresIn: Scalars['Int']['output'];
  /** The value of the UI extension session token. */
  value: Scalars['String']['output'];
};

/** The information about the container for unfulfilled digital line items (excluding gift cards). */
export type UnfulfilledDigitalLineItemContainer = UnfulfilledLineItemContainerCommonFields & {
  __typename?: 'UnfulfilledDigitalLineItemContainer';
  /** The line items within this container. */
  lineItems: LineItemContainerLineItemConnection;
};


/** The information about the container for unfulfilled digital line items (excluding gift cards). */
export type UnfulfilledDigitalLineItemContainerLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about the container for unfulfilled gift card type line items. */
export type UnfulfilledGiftCardLineItemContainer = UnfulfilledLineItemContainerCommonFields & {
  __typename?: 'UnfulfilledGiftCardLineItemContainer';
  /** The line items within this container. */
  lineItems: LineItemContainerLineItemConnection;
};


/** The information about the container for unfulfilled gift card type line items. */
export type UnfulfilledGiftCardLineItemContainerLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about the container for unfulfilled line items. */
export type UnfulfilledLineItemContainer = UnfulfilledLineItemContainerCommonFields & {
  __typename?: 'UnfulfilledLineItemContainer';
  /** The translated state of the line item container (for example, `Unfulfilled`). */
  displayableState: Scalars['String']['output'];
  /** The line items within this container. */
  lineItems: LineItemContainerLineItemConnection;
  /** The state of the line item container (for example, `unfulfilled`). */
  state: Scalars['String']['output'];
};


/** The information about the container for unfulfilled line items. */
export type UnfulfilledLineItemContainerLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The common fields for containers of unfulfilled line items series. */
export type UnfulfilledLineItemContainerCommonFields = {
  /** The line items within this container. */
  lineItems: LineItemContainerLineItemConnection;
};


/** The common fields for containers of unfulfilled line items series. */
export type UnfulfilledLineItemContainerCommonFieldsLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The information about the container for unfulfilled physical type line items. */
export type UnfulfilledPhysicalLineItemContainer = UnfulfilledLineItemContainerCommonFields & {
  __typename?: 'UnfulfilledPhysicalLineItemContainer';
  /** The line items within this container. */
  lineItems: LineItemContainerLineItemConnection;
};


/** The information about the container for unfulfilled physical type line items. */
export type UnfulfilledPhysicalLineItemContainerLineItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The unit price of the line component. For example, "$9.99 / 100ml". */
export type UnitPrice = {
  __typename?: 'UnitPrice';
  /** The unit measurement. For example, "$9.99 / 100ml". */
  measurement: UnitPriceMeasurement;
  /** The unit price of the variant. For example, "$1 per xy" where price is "$1". */
  price: MoneyV2;
};

/** The unit price measurement of the line component. For example, "$9.99 / 100ml". */
export type UnitPriceMeasurement = {
  __typename?: 'UnitPriceMeasurement';
  /** The reference unit for the unit price measurement. For example, "$9.99 / 100ml" where the reference unit is "ml". */
  referenceUnit: UnitPriceMeasurementUnit;
  /** The reference value for the unit price measurement. For example, "$9.99 / 100ml" where the reference value is "100". */
  referenceValue: Scalars['Int']['output'];
};

/** The valid units of measurement for a unit price measurement. */
export const UnitPriceMeasurementUnit = {
  /** 100 centiliters equals 1 liter. */
  Cl: 'CL',
  /** 100 centimeters equals 1 meter. */
  Cm: 'CM',
  /** Imperial system unit of volume (U.S. customary unit). */
  Floz: 'FLOZ',
  /** 1 foot equals 12 inches. */
  Ft: 'FT',
  /** Imperial system unit of area. */
  Ft2: 'FT2',
  /** Metric system unit of weight. */
  G: 'G',
  /** 1 gallon equals 128 fluid ounces (U.S. customary unit). */
  Gal: 'GAL',
  /** Imperial system unit of length. */
  In: 'IN',
  /** 1 item, a unit of count. */
  Item: 'ITEM',
  /** 1 kilogram equals 1000 grams. */
  Kg: 'KG',
  /** Metric system unit of volume. */
  L: 'L',
  /** Imperial system unit of weight. */
  Lb: 'LB',
  /** Metric system unit of length. */
  M: 'M',
  /** Metric system unit of area. */
  M2: 'M2',
  /** 1 cubic meter equals 1000 liters. */
  M3: 'M3',
  /** 1000 milligrams equals 1 gram. */
  Mg: 'MG',
  /** 1000 milliliters equals 1 liter. */
  Ml: 'ML',
  /** 1000 millimeters equals 1 meter. */
  Mm: 'MM',
  /** 16 ounces equals 1 pound. */
  Oz: 'OZ',
  /** 1 pint equals 16 fluid ounces (U.S. customary unit). */
  Pt: 'PT',
  /** 1 quart equals 32 fluid ounces (U.S. customary unit). */
  Qt: 'QT',
  /** The unit of measurement is unknown. Upgrade to the latest version of the API to resolve this unit. */
  Unknown: 'UNKNOWN',
  /** 1 yard equals 36 inches. */
  Yd: 'YD'
} as const;

export type UnitPriceMeasurementUnit = typeof UnitPriceMeasurementUnit[keyof typeof UnitPriceMeasurementUnit];
/** This represents new sale types that have been added in future API versions. You may update to a more recent API version to receive additional details about this sale. */
export type UnknownSale = Node & Sale & {
  __typename?: 'UnknownSale';
  /** The type of order action represented by the sale. */
  actionType: SaleActionType;
  /** The unique ID of the sale. */
  id: Scalars['ID']['output'];
  /** The line type assocated with the sale. */
  lineType: SaleLineType;
  /** The number of units ordered or intended to be returned. */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The individual taxes associated with the sale. */
  taxes: Array<SaleTax>;
  /** The total sale amount after taxes and discounts. */
  totalAmount: MoneyV2;
  /** The total amount of discounts allocated to the sale after taxes. */
  totalDiscountAmountAfterTaxes: MoneyV2;
  /** The total discounts allocated to the sale before taxes. */
  totalDiscountAmountBeforeTaxes: MoneyV2;
  /** The total tax amount for the sale. */
  totalTaxAmount: MoneyV2;
};

/** An unverified return line item. */
export type UnverifiedReturnLineItem = Node & ReturnLineItemType & {
  __typename?: 'UnverifiedReturnLineItem';
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The specific line item that's being returned. */
  lineItem: LineItem;
  /** The quantity of the line item that's been returned. */
  quantity: Scalars['Int']['output'];
  /**
   * The reason for returning the line item.
   * @deprecated Use `returnReasonDefinition` instead. This field will be removed in the future.
   */
  returnReason: ReturnReason;
  /** The standardized reason for why the item is being returned. */
  returnReasonDefinition?: Maybe<ReturnReasonDefinition>;
};

/** The error codes for failed business contact mutations. */
export type UserErrorsBusinessContactUserErrors = DisplayableError & {
  __typename?: 'UserErrorsBusinessContactUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsBusinessContactUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsBusinessContactUserErrors`. */
export const UserErrorsBusinessContactUserErrorsCode = {
  /** Business contact was not found. */
  BusinessContactNotFound: 'BUSINESS_CONTACT_NOT_FOUND',
  /** Business contact update input argument is empty. */
  BusinessContactUpdateInputArgumentEmpty: 'BUSINESS_CONTACT_UPDATE_INPUT_ARGUMENT_EMPTY',
  /** Business contact field is too long. */
  TooLong: 'TOO_LONG'
} as const;

export type UserErrorsBusinessContactUserErrorsCode = typeof UserErrorsBusinessContactUserErrorsCode[keyof typeof UserErrorsBusinessContactUserErrorsCode];
/** The error codes for failed payment instrument mutations. */
export type UserErrorsBusinessLocationPaymentInstrumentUserErrors = DisplayableError & {
  __typename?: 'UserErrorsBusinessLocationPaymentInstrumentUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsBusinessLocationPaymentInstrumentUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsBusinessLocationPaymentInstrumentUserErrors`. */
export const UserErrorsBusinessLocationPaymentInstrumentUserErrorsCode = {
  /** Address1 field is missing. */
  Address1Missing: 'ADDRESS1_MISSING',
  /** Address argument is empty. */
  AddressArgumentEmpty: 'ADDRESS_ARGUMENT_EMPTY',
  /** The card's brand is not supported. */
  BrandNotSupported: 'BRAND_NOT_SUPPORTED',
  /** Cannot replace a payment instrument with itself. */
  CannotReplacePaymentInstrumentWithItself: 'CANNOT_REPLACE_PAYMENT_INSTRUMENT_WITH_ITSELF',
  /** City field is missing. */
  CityMissing: 'CITY_MISSING',
  /** Company location ID does not exist. */
  CompanyLocationIdDoesNotExist: 'COMPANY_LOCATION_ID_DOES_NOT_EXIST',
  /** Country Code field is missing. */
  CountryCodeMissing: 'COUNTRY_CODE_MISSING',
  /** The card was declined. */
  Declined: 'DECLINED',
  /** The card is expired. */
  Expired: 'EXPIRED',
  /** The card's first name is missing. */
  FirstNameBlank: 'FIRST_NAME_BLANK',
  /** An error occured. */
  GenericError: 'GENERIC_ERROR',
  /** The address is incorrect. */
  Incorrect: 'INCORRECT',
  /** Address field is not valid. */
  Invalid: 'INVALID',
  /** Invalid for country. */
  InvalidForCountry: 'INVALID_FOR_COUNTRY',
  /** Invalid for country and province. */
  InvalidForCountryAndProvince: 'INVALID_FOR_COUNTRY_AND_PROVINCE',
  /** Invalid province in country. */
  InvalidProvinceInCountry: 'INVALID_PROVINCE_IN_COUNTRY',
  /** The card's start date or issue number is invalid. */
  InvalidStartDateOrIssueNumberForDebit: 'INVALID_START_DATE_OR_ISSUE_NUMBER_FOR_DEBIT',
  /** Invalid state in country. */
  InvalidStateInCountry: 'INVALID_STATE_IN_COUNTRY',
  /** The card's last name is missing. */
  LastNameBlank: 'LAST_NAME_BLANK',
  /** The card's month is invalid. */
  MonthInvalid: 'MONTH_INVALID',
  /** The card's name is invalid. */
  NameInvalid: 'NAME_INVALID',
  /** The card's number is invalid. */
  NumberInvalid: 'NUMBER_INVALID',
  /** Payment instrument ID does not exist. */
  PaymentInstrumentIdDoesNotExist: 'PAYMENT_INSTRUMENT_ID_DOES_NOT_EXIST',
  /** This payment instrument is already on file. */
  PaymentInstrumentTaken: 'PAYMENT_INSTRUMENT_TAKEN',
  /** Phone number is not valid. */
  PhoneNumberNotValid: 'PHONE_NUMBER_NOT_VALID',
  /** The field is required. */
  Required: 'REQUIRED',
  /** This test card cannot be used for real transactions. */
  TestModeLiveCard: 'TEST_MODE_LIVE_CARD',
  /** Address field is too long. */
  TooLong: 'TOO_LONG',
  /** Too many payment instrument updates. */
  UpdateLimitExceeded: 'UPDATE_LIMIT_EXCEEDED',
  /** The card's verification value is missing. */
  VerificationValueBlank: 'VERIFICATION_VALUE_BLANK',
  /** The card's verification value is incorrect. */
  VerificationValueIncorrect: 'VERIFICATION_VALUE_INCORRECT',
  /** The card's verification value is invalid. */
  VerificationValueInvalidForCardType: 'VERIFICATION_VALUE_INVALID_FOR_CARD_TYPE',
  /** The card's year is invalid. */
  YearInvalid: 'YEAR_INVALID',
  /** The address's zip code is incorrect. */
  ZipIncorrect: 'ZIP_INCORRECT',
  /** Zone Code field is missing. */
  ZoneCodeMissing: 'ZONE_CODE_MISSING'
} as const;

export type UserErrorsBusinessLocationPaymentInstrumentUserErrorsCode = typeof UserErrorsBusinessLocationPaymentInstrumentUserErrorsCode[keyof typeof UserErrorsBusinessLocationPaymentInstrumentUserErrorsCode];
/** The error codes that are provided for failed address mutations. */
export type UserErrorsCustomerAddressUserErrors = DisplayableError & {
  __typename?: 'UserErrorsCustomerAddressUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsCustomerAddressUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsCustomerAddressUserErrors`. */
export const UserErrorsCustomerAddressUserErrorsCode = {
  /** The Address1 field is missing. */
  Address1Missing: 'ADDRESS1_MISSING',
  /** The provided address argument is empty. */
  AddressArgumentEmpty: 'ADDRESS_ARGUMENT_EMPTY',
  /** The provided address ID doesn't exist. */
  AddressIdDoesNotExist: 'ADDRESS_ID_DOES_NOT_EXIST',
  /** Input contains HTML tags. */
  ContainsHtmlTags: 'CONTAINS_HTML_TAGS',
  /** The provided country doesn't exist. */
  CountryNotExist: 'COUNTRY_NOT_EXIST',
  /** The provided customer address already exists. */
  CustomerAddressAlreadyExists: 'CUSTOMER_ADDRESS_ALREADY_EXISTS',
  /** The default address of the customer can't be deleted before setting another one as default. */
  DeletingCustomerDefaultAddressNotAllowed: 'DELETING_CUSTOMER_DEFAULT_ADDRESS_NOT_ALLOWED',
  /** Demoting the default address of the customer isn't allowed. */
  DemotingCustomerDefaultAddressNotAllowed: 'DEMOTING_CUSTOMER_DEFAULT_ADDRESS_NOT_ALLOWED',
  /** The provided address field isn't valid. */
  Invalid: 'INVALID',
  /** The provided value is invalid for the country. */
  InvalidForCountry: 'INVALID_FOR_COUNTRY',
  /** The provided value is invalid for the country and province. */
  InvalidForCountryAndProvince: 'INVALID_FOR_COUNTRY_AND_PROVINCE',
  /** The provided Territory Code isn't valid. */
  InvalidTerritoryCode: 'INVALID_TERRITORY_CODE',
  /** The provided phone number isn't valid. */
  PhoneNumberNotValid: 'PHONE_NUMBER_NOT_VALID',
  /** The field is required. */
  Required: 'REQUIRED',
  /** The Territory Code field is missing. */
  TerritoryCodeMissing: 'TERRITORY_CODE_MISSING',
  /** The provided address field is too long. */
  TooLong: 'TOO_LONG',
  /** The Zone Code field is missing. */
  ZoneCodeMissing: 'ZONE_CODE_MISSING'
} as const;

export type UserErrorsCustomerAddressUserErrorsCode = typeof UserErrorsCustomerAddressUserErrorsCode[keyof typeof UserErrorsCustomerAddressUserErrorsCode];
/** Provides error codes for failed marketing opt-in mutations. */
export type UserErrorsCustomerEmailMarketingOptInUserErrors = DisplayableError & {
  __typename?: 'UserErrorsCustomerEmailMarketingOptInUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsCustomerEmailMarketingOptInUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsCustomerEmailMarketingOptInUserErrors`. */
export const UserErrorsCustomerEmailMarketingOptInUserErrorsCode = {
  /** The customer is already subscribed. */
  CustomerAlreadySubscribed: 'CUSTOMER_ALREADY_SUBSCRIBED',
  /** The customer does not have an email address. */
  EmailAddressNotFound: 'EMAIL_ADDRESS_NOT_FOUND',
  /** There was an error. */
  Failed: 'FAILED'
} as const;

export type UserErrorsCustomerEmailMarketingOptInUserErrorsCode = typeof UserErrorsCustomerEmailMarketingOptInUserErrorsCode[keyof typeof UserErrorsCustomerEmailMarketingOptInUserErrorsCode];
/** Provides error codes for marketing subscribe mutations. */
export type UserErrorsCustomerEmailMarketingUserErrors = DisplayableError & {
  __typename?: 'UserErrorsCustomerEmailMarketingUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsCustomerEmailMarketingUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsCustomerEmailMarketingUserErrors`. */
export const UserErrorsCustomerEmailMarketingUserErrorsCode = {
  /** The customer is already subscribed. */
  CustomerAlreadySubscribed: 'CUSTOMER_ALREADY_SUBSCRIBED',
  /** The customer does not have an email address. */
  EmailAddressNotFound: 'EMAIL_ADDRESS_NOT_FOUND',
  /** Subscription failed. */
  FailedToSubscribe: 'FAILED_TO_SUBSCRIBE',
  /** Unsubscription failed. */
  FailedToUnsubscribe: 'FAILED_TO_UNSUBSCRIBE'
} as const;

export type UserErrorsCustomerEmailMarketingUserErrorsCode = typeof UserErrorsCustomerEmailMarketingUserErrorsCode[keyof typeof UserErrorsCustomerEmailMarketingUserErrorsCode];
/** Provides error codes for failed personal information mutations. */
export type UserErrorsCustomerUserErrors = DisplayableError & {
  __typename?: 'UserErrorsCustomerUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsCustomerUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsCustomerUserErrors`. */
export const UserErrorsCustomerUserErrorsCode = {
  /** Input contains HTML tags. */
  ContainsHtmlTags: 'CONTAINS_HTML_TAGS',
  /** Input contains URL. */
  ContainsUrl: 'CONTAINS_URL',
  /** The customer does not exist. */
  CustomerDoesNotExist: 'CUSTOMER_DOES_NOT_EXIST',
  /** The personal information input argument is empty. */
  CustomerInputArgumentEmpty: 'CUSTOMER_INPUT_ARGUMENT_EMPTY',
  /** The personal information field is not valid. */
  Invalid: 'INVALID',
  /** The personal information field is too long. */
  TooLong: 'TOO_LONG'
} as const;

export type UserErrorsCustomerUserErrorsCode = typeof UserErrorsCustomerUserErrorsCode[keyof typeof UserErrorsCustomerUserErrorsCode];
/** The error codes for failed payment instrument mutations. */
export type UserErrorsPaymentInstrumentUserErrors = DisplayableError & {
  __typename?: 'UserErrorsPaymentInstrumentUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsPaymentInstrumentUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsPaymentInstrumentUserErrors`. */
export const UserErrorsPaymentInstrumentUserErrorsCode = {
  /** Address1 field is missing. */
  Address1Missing: 'ADDRESS1_MISSING',
  /** Address argument is empty. */
  AddressArgumentEmpty: 'ADDRESS_ARGUMENT_EMPTY',
  /** The card's brand is not supported. */
  BrandNotSupported: 'BRAND_NOT_SUPPORTED',
  /** Cannot find Shop Pay order for redirection. */
  CannotRedirectToShopPay: 'CANNOT_REDIRECT_TO_SHOP_PAY',
  /** Cannot replace a payment instrument with itself. */
  CannotReplacePaymentInstrumentWithItself: 'CANNOT_REPLACE_PAYMENT_INSTRUMENT_WITH_ITSELF',
  /** City field is missing. */
  CityMissing: 'CITY_MISSING',
  /** Country Code field is missing. */
  CountryCodeMissing: 'COUNTRY_CODE_MISSING',
  /** The card was declined. */
  Declined: 'DECLINED',
  /** The card is expired. */
  Expired: 'EXPIRED',
  /** The card's first name is missing. */
  FirstNameBlank: 'FIRST_NAME_BLANK',
  /** An error occured. */
  GenericError: 'GENERIC_ERROR',
  /** The address is incorrect. */
  Incorrect: 'INCORRECT',
  /** Address field is not valid. */
  Invalid: 'INVALID',
  /** Invalid for country. */
  InvalidForCountry: 'INVALID_FOR_COUNTRY',
  /** Invalid for country and province. */
  InvalidForCountryAndProvince: 'INVALID_FOR_COUNTRY_AND_PROVINCE',
  /** Invalid province in country. */
  InvalidProvinceInCountry: 'INVALID_PROVINCE_IN_COUNTRY',
  /** The card's start date or issue number is invalid. */
  InvalidStartDateOrIssueNumberForDebit: 'INVALID_START_DATE_OR_ISSUE_NUMBER_FOR_DEBIT',
  /** Invalid state in country. */
  InvalidStateInCountry: 'INVALID_STATE_IN_COUNTRY',
  /** The card's last name is missing. */
  LastNameBlank: 'LAST_NAME_BLANK',
  /** The card's month is invalid. */
  MonthInvalid: 'MONTH_INVALID',
  /** The card's name is invalid. */
  NameInvalid: 'NAME_INVALID',
  /** The card's number is invalid. */
  NumberInvalid: 'NUMBER_INVALID',
  /** Owner ID is invalid. */
  OwnerIdInvalid: 'OWNER_ID_INVALID',
  /** Payment instrument ID does not exist. */
  PaymentInstrumentIdDoesNotExist: 'PAYMENT_INSTRUMENT_ID_DOES_NOT_EXIST',
  /** This payment instrument is already on file. */
  PaymentInstrumentTaken: 'PAYMENT_INSTRUMENT_TAKEN',
  /** Phone number is not valid. */
  PhoneNumberNotValid: 'PHONE_NUMBER_NOT_VALID',
  /** The field is required. */
  Required: 'REQUIRED',
  /** Saved payment methods is not enabled on this shop. */
  SavedPaymentMethodsNotEnabled: 'SAVED_PAYMENT_METHODS_NOT_ENABLED',
  /** This test card cannot be used for real transactions. */
  TestModeLiveCard: 'TEST_MODE_LIVE_CARD',
  /** Address field is too long. */
  TooLong: 'TOO_LONG',
  /** Payment instrument type is not supported for this operation. */
  UnsupportedPaymentInstrumentType: 'UNSUPPORTED_PAYMENT_INSTRUMENT_TYPE',
  /** Too many payment instrument updates. */
  UpdateLimitExceeded: 'UPDATE_LIMIT_EXCEEDED',
  /** The card's verification value is missing. */
  VerificationValueBlank: 'VERIFICATION_VALUE_BLANK',
  /** The card's verification value is incorrect. */
  VerificationValueIncorrect: 'VERIFICATION_VALUE_INCORRECT',
  /** The card's verification value is invalid. */
  VerificationValueInvalidForCardType: 'VERIFICATION_VALUE_INVALID_FOR_CARD_TYPE',
  /** The card's year is invalid. */
  YearInvalid: 'YEAR_INVALID',
  /** The address's zip code is incorrect. */
  ZipIncorrect: 'ZIP_INCORRECT',
  /** Zone Code field is missing. */
  ZoneCodeMissing: 'ZONE_CODE_MISSING'
} as const;

export type UserErrorsPaymentInstrumentUserErrorsCode = typeof UserErrorsPaymentInstrumentUserErrorsCode[keyof typeof UserErrorsPaymentInstrumentUserErrorsCode];
/** The error codes for failed PayPal token mutations. */
export type UserErrorsPaypalTokenUserErrors = DisplayableError & {
  __typename?: 'UserErrorsPaypalTokenUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsPaypalTokenUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsPaypalTokenUserErrors`. */
export const UserErrorsPaypalTokenUserErrorsCode = {
  /** PayPal Express gateway is not enabled. */
  PaypalExpressGatewayNotEnabled: 'PAYPAL_EXPRESS_GATEWAY_NOT_ENABLED',
  /** PayPal account does not support reference transactions. */
  ReferenceTransactionsNotEnabled: 'REFERENCE_TRANSACTIONS_NOT_ENABLED',
  /** PayPal Express token could not be created. */
  TokenCouldNotBeCreated: 'TOKEN_COULD_NOT_BE_CREATED'
} as const;

export type UserErrorsPaypalTokenUserErrorsCode = typeof UserErrorsPaypalTokenUserErrorsCode[keyof typeof UserErrorsPaypalTokenUserErrorsCode];
/** The error codes for failed resending gift card mutations. */
export type UserErrorsResendGiftCardErrors = DisplayableError & {
  __typename?: 'UserErrorsResendGiftCardErrors';
  /** The error code. */
  code?: Maybe<UserErrorsResendGiftCardErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsResendGiftCardErrors`. */
export const UserErrorsResendGiftCardErrorsCode = {
  /** No gift card is associated with the order. */
  GiftCardNotFoundForOrder: 'GIFT_CARD_NOT_FOUND_FOR_ORDER',
  /** This order does not exist. */
  OrderNotFound: 'ORDER_NOT_FOUND'
} as const;

export type UserErrorsResendGiftCardErrorsCode = typeof UserErrorsResendGiftCardErrorsCode[keyof typeof UserErrorsResendGiftCardErrorsCode];
/** Error codes for failed Storefront Customer Access Token mutation. */
export type UserErrorsStorefrontCustomerAccessTokenCreateUserErrors = DisplayableError & {
  __typename?: 'UserErrorsStorefrontCustomerAccessTokenCreateUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsStorefrontCustomerAccessTokenCreateUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsStorefrontCustomerAccessTokenCreateUserErrors`. */
export const UserErrorsStorefrontCustomerAccessTokenCreateUserErrorsCode = {
  /** The customer does not exist. */
  CustomerDoesNotExist: 'CUSTOMER_DOES_NOT_EXIST'
} as const;

export type UserErrorsStorefrontCustomerAccessTokenCreateUserErrorsCode = typeof UserErrorsStorefrontCustomerAccessTokenCreateUserErrorsCode[keyof typeof UserErrorsStorefrontCustomerAccessTokenCreateUserErrorsCode];
/** The error codes for failed Stripe Financial Connections session initiation. */
export type UserErrorsStripeFinancialConnectionsSessionUserErrors = DisplayableError & {
  __typename?: 'UserErrorsStripeFinancialConnectionsSessionUserErrors';
  /** The error code. */
  code?: Maybe<UserErrorsStripeFinancialConnectionsSessionUserErrorsCode>;
  /** The path to the input field that caused the error. */
  field?: Maybe<Array<Scalars['String']['output']>>;
  /** The error message. */
  message: Scalars['String']['output'];
};

/** Possible error codes that can be returned by `UserErrorsStripeFinancialConnectionsSessionUserErrors`. */
export const UserErrorsStripeFinancialConnectionsSessionUserErrorsCode = {
  /** Stripe Financial Connections session could not be initiated. */
  StripeFinancialConnectionsSessionError: 'STRIPE_FINANCIAL_CONNECTIONS_SESSION_ERROR'
} as const;

export type UserErrorsStripeFinancialConnectionsSessionUserErrorsCode = typeof UserErrorsStripeFinancialConnectionsSessionUserErrorsCode[keyof typeof UserErrorsStripeFinancialConnectionsSessionUserErrorsCode];
/** Represents a Shopify hosted video. */
export type Video = Media & {
  __typename?: 'Video';
  /** A word or phrase to share the nature or contents of a media. */
  alt?: Maybe<Scalars['String']['output']>;
  /** A globally-unique ID. */
  id: Scalars['ID']['output'];
  /** The media content type. */
  mediaContentType: MediaContentType;
  /** The preview image for the media. */
  previewImage?: Maybe<Image>;
  /** The sources for a video. */
  sources: Array<VideoSource>;
};

/** Represents a source for a Shopify hosted video. */
export type VideoSource = {
  __typename?: 'VideoSource';
  /** The format of the video source. */
  format: Scalars['String']['output'];
  /** The height of the video. */
  height: Scalars['Int']['output'];
  /** The video MIME type. */
  mimeType: Scalars['String']['output'];
  /** The URL of the video. */
  url: Scalars['String']['output'];
  /** The width of the video. */
  width: Scalars['Int']['output'];
};

/** The configuration used for Payment Wallets. */
export type WalletPaymentConfig = ApplePayWalletConfig | GooglePayWalletConfig;

/**
 * A weight measurement with its numeric value and unit. Used throughout the API, for example in shipping calculations, delivery conditions, order line items, and inventory measurements.
 *
 * The weight combines a decimal value with a standard unit of measurement to ensure consistent weight handling across different regional systems.
 */
export type Weight = {
  __typename?: 'Weight';
  /** The unit of measurement for `value`. */
  unit: WeightUnit;
  /** The weight value using the unit system specified with `unit`. */
  value: Scalars['Float']['output'];
};

/** Units of measurement for weight. */
export const WeightUnit = {
  /** Metric system unit of mass. */
  Grams: 'GRAMS',
  /** 1 kilogram equals 1000 grams. */
  Kilograms: 'KILOGRAMS',
  /** Imperial system unit of mass. */
  Ounces: 'OUNCES',
  /** 1 pound equals 16 ounces. */
  Pounds: 'POUNDS'
} as const;

export type WeightUnit = typeof WeightUnit[keyof typeof WeightUnit];