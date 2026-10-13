import { StyleSheet, Text, View } from 'react-native';

import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { NoDataState, OfflineNotice } from '@/components/ScreenMessage';
import { useCustomerSession } from '@/customerAccount/session';
import {
  recheckNetwork,
  useCustomerProfile,
  useIsOffline,
  type CustomerProfile,
} from '@/customerAccountApi/hooks/customer';
import { colors, fonts, fontSize, spacing } from '@/theme/tokens';

// Proposed by Claude Code at P7-02's plan, for the owner's approval (D-128).
export const DETAILS_HEADING = 'Your details';
export const NOT_ADDED = 'Not added';
export const DETAILS_OFFLINE_NOTICE = "You're offline. Showing saved details.";

/**
 * The customer's profile on the Account tab, read only (P7-02, architect's answer 1): name,
 * email, phone and the default address, "Not added" for a value the customer has not given.
 * Shown only while signed in, below the login section (D-123). The states of D-078: loading,
 * offline or error with "Try again" while there is nothing to show, and the offline notice over
 * saved details.
 */
export function AccountProfile() {
  const session = useCustomerSession();
  return session.status === 'signedIn' ? <SignedInProfile /> : null;
}

function SignedInProfile() {
  const query = useCustomerProfile();
  const isOffline = useIsOffline();
  const hasData = query.data !== undefined;
  const state = catalogueViewState({
    hasData,
    isFetching: query.isFetching,
    isOffline,
    error: query.error,
  });

  return (
    <View style={styles.section} testID="account-profile">
      <Text accessibilityRole="header" style={styles.heading}>
        {DETAILS_HEADING}
      </Text>
      {query.data === undefined ? (
        state === 'ready' ? null : (
          <NoDataState
            onRetry={() => void recheckNetwork().then(() => query.refetch())}
            state={state}
          />
        )
      ) : (
        <>
          {showsOfflineNotice({ hasData, isOffline, error: query.error }) && (
            <OfflineNotice message={DETAILS_OFFLINE_NOTICE} />
          )}
          <ProfileRows profile={query.data} />
        </>
      )}
    </View>
  );
}

function ProfileRows({ profile }: { readonly profile: CustomerProfile }) {
  return (
    <>
      <Row label="Name" value={profile.name} />
      <Row label="Email" value={profile.email} />
      <Row label="Phone" value={profile.phone} />
      <Row
        label="Default address"
        value={profile.addressLines.length === 0 ? undefined : profile.addressLines.join('\n')}
      />
    </>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string | undefined }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? NOT_ADDED}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  heading: { fontFamily: fonts.heading, fontSize: fontSize.title, color: colors.text },
  row: { marginTop: spacing.md },
  label: { fontFamily: fonts.bodyBold, fontSize: fontSize.small, color: colors.text },
  value: { fontFamily: fonts.body, fontSize: fontSize.body, color: colors.text },
});
