import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons';
import { Tabs } from 'expo-router';

import { colors, fonts, iconSize } from '@/theme/tokens';

// Filled when the tab is active, outline otherwise, so the state is not shown by colour alone (D-040).
const TABS: readonly {
  name: string;
  title: string;
  icon: IoniconsIconName;
  activeIcon: IoniconsIconName;
}[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'browse', title: 'Browse', icon: 'search-outline', activeIcon: 'search' },
  { name: 'cart', title: 'Cart', icon: 'cart-outline', activeIcon: 'cart' },
  { name: 'my-books', title: 'My Books', icon: 'book-outline', activeIcon: 'book' },
  { name: 'account', title: 'Account', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.divider },
        tabBarLabelStyle: { fontFamily: fonts.body },
      }}
    >
      {TABS.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons color={color} name={focused ? activeIcon : icon} size={iconSize.tab} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
