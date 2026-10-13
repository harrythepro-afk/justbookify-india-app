import { AccountLogin } from '@/components/AccountLogin';
import { AnalyticsConsentSwitch } from '@/components/AnalyticsConsentSwitch';
import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AccountScreen() {
  return (
    <PlaceholderScreen
      message="Your profile, addresses, notification settings and help will appear here."
      title="Account"
    >
      <AccountLogin />
      <AnalyticsConsentSwitch />
    </PlaceholderScreen>
  );
}
