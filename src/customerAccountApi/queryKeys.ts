/**
 * Query keys for the customer's own data (P7-02, D-127), under their own root. In memory only,
 * like every key (D-059), and emptied by `clearAllCaches()` at logout and when Shopify refuses the
 * refresh (D-061, D-121).
 */
export const customerKeys = {
  all: ['customer'] as const,
  profile: () => [...customerKeys.all, 'profile'] as const,
  orders: () => [...customerKeys.all, 'orders'] as const,
};
