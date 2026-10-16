/** The `fetch` the identity check uses, passed in so tests can fake Shopify (D-161). */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Sent on every call to Shopify: its docs answer 403 to a request without a user agent. */
export const USER_AGENT = 'JustBookifyIndiaBackend/0.1';
