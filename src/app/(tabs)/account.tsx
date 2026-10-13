import { AccountLogin } from '@/components/AccountLogin';
import { AccountProfile } from '@/components/AccountProfile';
import { AnalyticsConsentSwitch } from '@/components/AnalyticsConsentSwitch';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AccountScreen() {
  return (
    <PlaceholderScreen
      message="Addresses, notification settings and help will appear here."
      title="Account"
    >
      <AccountLogin />
      <AccountProfile />
      <AnalyticsConsentSwitch />
    </PlaceholderScreen>
  );
}
