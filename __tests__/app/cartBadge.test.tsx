import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import TabLayout, { cartTabLabel } from '@/app/(tabs)/_layout';
import { colors } from '@/theme/tokens';

// The tab bar's own drawing is Expo Router's; here only the options the layout gives each tab.
type Options = {
  title?: string;
  tabBarBadge?: number;
  tabBarBadgeStyle?: object;
  tabBarAccessibilityLabel?: string;
};
const mockScreens = new Map<string, Options>();
jest.mock('expo-router', () => {
  const Tabs = ({ children }: { children: unknown }) => children;
  Tabs.Screen = function Screen({ name, options }: { name: string; options: Options }) {
    mockScreens.set(name, options);
    return null;
  };
  return { Tabs };
});

let mockCount = 0;
jest.mock('@/shopify/hooks/cart', () => ({ useCartCount: () => mockCount }));

beforeEach(() => {
  mockScreens.clear();
});

describe("the Cart tab's count (P8-01, answer 6)", () => {
  it('shows no badge for an empty cart', async () => {
    mockCount = 0;
    await render(<TabLayout />);

    expect(mockScreens.get('cart')?.tabBarBadge).toBeUndefined();
    expect(mockScreens.get('cart')?.tabBarAccessibilityLabel).toBe('Cart');
  });

  it('shows the number of books, rented-out ones included', async () => {
    mockCount = 3;
    await render(<TabLayout />);

    expect(mockScreens.get('cart')?.tabBarBadge).toBe(3);
    expect(mockScreens.get('cart')?.tabBarAccessibilityLabel).toBe('Cart, 3 books');
    expect(StyleSheet.flatten(mockScreens.get('cart')?.tabBarBadgeStyle)).toMatchObject({
      backgroundColor: colors.primaryButton,
      color: colors.onPrimaryButton,
    });
  });

  it('puts the badge on the Cart tab only', async () => {
    mockCount = 2;
    await render(<TabLayout />);

    for (const name of ['index', 'browse', 'my-books', 'account']) {
      expect(mockScreens.get(name)?.tabBarBadge).toBeUndefined();
    }
  });

  it('says "book" for one and "books" for more', () => {
    expect(cartTabLabel(1)).toBe('Cart, 1 book');
    expect(cartTabLabel(2)).toBe('Cart, 2 books');
  });
});
