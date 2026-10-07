import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnalyticsConsent } from '@/analytics/consent';
import { BookCard } from '@/components/BookCard';
import { openBook } from '@/components/openBook';
import { catalogueViewState, showsOfflineNotice } from '@/components/catalogueViewState';
import { AgeChip, SeriesTile } from '@/components/CollectionLinks';
import { SearchButton } from '@/components/SearchButton';
import { guardLinkPress } from '@/navigation/openGuard';
import { NoDataState, OfflineNotice } from '@/components/ScreenMessage';
import {
  FEATURE_FLAG_NAMES,
  getAppEnvironment,
  HOME_CONTENT,
  type CollectionLink,
  type FeatureFlagSource,
} from '@/config';
import { isCrashReportingOn, sendTestError, triggerTestNativeCrash } from '@/crashReporting/sentry';
import { useFeatureFlags } from '@/featureFlags/session';
import { describeReading, useNetworkLog } from '@/query/QueryProvider';
import {
  recheckNetwork,
  useCollectionBooks,
  useCollectionHandles,
  useIsOffline,
} from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, minTouchTarget, radius, spacing } from '@/theme/tokens';

const BROWSE: Href = '/browse';

function collectionHref(handle: string): Href {
  return { pathname: '/collection/[handle]', params: { handle } };
}

/**
 * Home (`PRODUCT_REQUIREMENTS.md`, "Screen layouts"; D-037): the store name, the banner, "Popular
 * series", "Browse by age" and "New arrivals", as on the website, with a search button beside the
 * store name (P6-06). Rows show only the configured
 * collections that exist in the store (D-076). The header and banner are local and always show;
 * what comes from Shopify shows its own loading, offline and error states (D-078). The tab bar
 * already leaves room for Android's navigation bar, so no bottom inset is added here.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isOffline = useIsOffline();
  const handles = useCollectionHandles();
  const arrivals = useCollectionBooks(HOME_CONTENT.newArrivals.handle);

  const hasData = handles.data !== undefined || arrivals.data !== undefined;
  const firstError = handles.error ?? arrivals.error;
  // "Try again" re-reads the network first, so an old offline signal cannot hold it back (D-082).
  const retry = () =>
    void recheckNetwork().then(() => {
      if (handles.data === undefined || handles.isError) void handles.refetch();
      if (arrivals.data === undefined || arrivals.isError) void arrivals.refetch();
    });
  const screenState = catalogueViewState({
    hasData,
    isFetching: handles.isFetching || arrivals.isFetching,
    isOffline,
    error: firstError,
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {showsOfflineNotice({ hasData, isOffline, error: firstError }) && <OfflineNotice />}
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.storeName}>
            {HOME_CONTENT.storeName}
          </Text>
          <SearchButton testID="home-search" />
        </View>
        <Banner />
        {screenState === 'ready' ? (
          <>
            <CollectionRows
              handles={handles.data}
              isFetching={handles.isFetching}
              isOffline={isOffline}
              error={handles.error}
              onRetry={() => void recheckNetwork().then(() => handles.refetch())}
            />
            <NewArrivals
              query={arrivals}
              isOffline={isOffline}
              onRetry={() => void recheckNetwork().then(() => arrivals.refetch())}
            />
          </>
        ) : (
          <NoDataState onRetry={retry} state={screenState} />
        )}
        {getAppEnvironment() === 'development' && <DevelopmentTools />}
      </ScrollView>
    </View>
  );
}

function Banner() {
  const { headline, line, buttonLabel } = HOME_CONTENT.banner;
  return (
    <View style={styles.banner}>
      <Text accessibilityRole="header" style={styles.bannerHeadline}>
        {headline}
      </Text>
      <Text style={styles.bannerLine}>{line}</Text>
      <Link asChild href={BROWSE} onPress={guardLinkPress}>
        <Pressable accessibilityRole="link" style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>{buttonLabel}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

function SectionHeading({ children }: { readonly children: string }) {
  return (
    <Text accessibilityRole="header" style={styles.section}>
      {children}
    </Text>
  );
}

/** "Popular series" and "Browse by age": no tile shows until the store's handles are known. */
function CollectionRows({
  handles,
  isFetching,
  isOffline,
  error,
  onRetry,
}: {
  readonly handles: ReadonlySet<string> | undefined;
  readonly isFetching: boolean;
  readonly isOffline: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}) {
  if (handles === undefined) {
    const state = catalogueViewState({ hasData: false, isFetching, isOffline, error });
    return state === 'ready' ? null : <NoDataState onRetry={onRetry} state={state} />;
  }
  const existing = (links: readonly CollectionLink[]) =>
    links.filter((link) => handles.has(link.handle));
  const series = existing(HOME_CONTENT.popularSeries);
  const ages = existing(HOME_CONTENT.ageGroups);

  return (
    <>
      <SectionHeading>Popular series</SectionHeading>
      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
      >
        {series.map((link) => (
          <SeriesTile href={collectionHref(link.handle)} key={link.handle} label={link.label} />
        ))}
        <SeriesTile href={BROWSE} label="All series" />
      </ScrollView>
      {ages.length > 0 && (
        <>
          <SectionHeading>Browse by age</SectionHeading>
          <ScrollView
            contentContainerStyle={styles.row}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
          >
            {ages.map((link) => (
              <AgeChip href={collectionHref(link.handle)} key={link.handle} label={link.label} />
            ))}
          </ScrollView>
        </>
      )}
    </>
  );
}

/** The first books of "New arrivals" and "See all". Hidden if the collection is missing or empty. */
function NewArrivals({
  query,
  isOffline,
  onRetry,
}: {
  readonly query: ReturnType<typeof useCollectionBooks>;
  readonly isOffline: boolean;
  readonly onRetry: () => void;
}) {
  const first = query.data?.pages[0];
  if (first === undefined) {
    const state = catalogueViewState({
      hasData: false,
      isFetching: query.isFetching,
      isOffline,
      error: query.error,
    });
    return state === 'ready' ? null : (
      <>
        <SectionHeading>New arrivals</SectionHeading>
        <NoDataState onRetry={onRetry} state={state} />
      </>
    );
  }
  if (first.kind === 'not-found' || first.books.length === 0) return null;

  const { handle, count } = HOME_CONTENT.newArrivals;
  return (
    <>
      <View style={styles.sectionRow}>
        <Text accessibilityRole="header" style={styles.sectionInRow}>
          New arrivals
        </Text>
        <Link asChild href={collectionHref(handle)} onPress={guardLinkPress}>
          <Pressable accessibilityLabel="See all new arrivals" accessibilityRole="link">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.grid}>
        {first.books.slice(0, count).map((book) => (
          <View key={book.id} style={styles.cell}>
            <BookCard book={book} onOpen={openBook} />
          </View>
        ))}
      </View>
    </>
  );
}

/** Development builds only: test screens and the status of crash reports, flags and analytics. */
function DevelopmentTools() {
  return (
    <View style={styles.devTools}>
      <SectionHeading>Development tools</SectionHeading>
      <Link href="/dev-checkout" onPress={guardLinkPress} style={styles.link}>
        Open the test checkout screen
      </Link>
      <Link href="/dev-catalogue" onPress={guardLinkPress} style={styles.secondLink}>
        Open the book card preview
      </Link>
      <CrashReportingTestControls />
      <FeatureFlagStatus />
      <AnalyticsStatus />
      <ConnectionStatus />
    </View>
  );
}

/**
 * Development builds only: whether the query cache counts the phone as online (D-064), and what
 * the platform last said about the network, so a wrong "offline" can be traced on the phone.
 */
function ConnectionStatus() {
  const isOffline = useIsOffline();
  const log = useNetworkLog();
  return (
    <>
      <Text style={styles.note}>Query cache: {isOffline ? 'offline' : 'online'}</Text>
      <Text style={styles.note}>To background: {log.backgroundAt ?? 'none'}</Text>
      <Text style={styles.note}>Back to the foreground: {log.returnAt ?? 'none'}</Text>
      <Text style={styles.note}>Read on return: {describeReading(log.readOnReturn)}</Text>
      <Text style={styles.note}>Read 3 s later: {describeReading(log.readLater)}</Text>
      <Text style={styles.note}>
        Network events, newest first: {log.events.length === 0 ? 'none' : ''}
      </Text>
      {log.events.map((event, index) => (
        // Events have no identity of their own; their place in the list is enough here.
        <Text key={index} style={styles.note}>
          {describeReading(event)}
        </Text>
      ))}
    </>
  );
}

const SOURCE_LABELS: Record<FeatureFlagSource, string> = {
  remote: 'Remote Config',
  default: 'in-app default',
};

/** Development builds only: each flag's value for this session, and where it came from. */
function FeatureFlagStatus() {
  const flags = useFeatureFlags();

  if (flags.status === 'not ready') {
    return <Text style={styles.flags}>Feature flags: not ready</Text>;
  }

  const { snapshot, fetch } = flags;
  return (
    <>
      {FEATURE_FLAG_NAMES.map((name) => (
        <Text key={name} style={styles.flags}>
          {name}: {snapshot.values[name]} ({SOURCE_LABELS[snapshot.sources[name]]})
        </Text>
      ))}
      <Text style={styles.note}>
        Remote Config fetch for the next launch: {fetch ?? 'not started'}
      </Text>
    </>
  );
}

/** Development builds only: whether analytics collection is on, and the stored consent. */
function AnalyticsStatus() {
  const { consent } = useAnalyticsConsent();
  if (consent === 'loading') return <Text style={styles.note}>Analytics: consent loading</Text>;
  return (
    <Text style={styles.note}>
      Analytics: {consent === 'granted' ? 'on' : 'off'} (consent: {consent})
    </Text>
  );
}

/** Development builds only: lets the owner see a test error and a native crash reach Sentry. */
function CrashReportingTestControls() {
  const [sent, setSent] = useState(false);

  if (!isCrashReportingOn()) {
    return <Text style={styles.note}>Crash reporting is off (no DSN).</Text>;
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          sendTestError();
          setSent(true);
        }}
        style={styles.control}
      >
        <Text style={styles.controlText}>Send a test error to Sentry</Text>
      </Pressable>
      {sent && (
        <Text accessibilityLiveRegion="polite" style={styles.note}>
          Test error sent. Check Sentry.
        </Text>
      )}
      <Pressable accessibilityRole="button" onPress={triggerTestNativeCrash} style={styles.control}>
        <Text style={styles.controlText}>Trigger a native crash (test)</Text>
      </Pressable>
      <Text style={styles.note}>The app will close; reopen it to send the report.</Text>
    </>
  );
}

const linkText = {
  fontFamily: fonts.body,
  fontSize: fontSize.body,
  color: colors.link,
  textDecorationLine: 'underline',
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  storeName: {
    flexShrink: 1,
    fontFamily: fonts.heading,
    fontSize: fontSize.heading,
    color: colors.text,
  },
  banner: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.hero },
  bannerHeadline: { fontFamily: fonts.heading, fontSize: fontSize.title, color: colors.onHero },
  bannerLine: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    color: colors.onHero,
  },
  bannerButton: {
    minHeight: minTouchTarget,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primaryButton,
  },
  bannerButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.onPrimaryButton,
  },
  section: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontFamily: fonts.heading,
    fontSize: fontSize.title,
    color: colors.text,
  },
  // The heading and "See all" share one row, centred on each other.
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionInRow: { fontFamily: fonts.heading, fontSize: fontSize.title, color: colors.text },
  // Vertical padding brings the link's touch target to the 44-point minimum.
  seeAll: { ...linkText, paddingVertical: spacing.md },
  // The row runs to the screen's edges while its first tile lines up with the text.
  rowScroll: { marginHorizontal: -spacing.lg },
  row: { gap: spacing.md, paddingHorizontal: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm },
  cell: { width: '50%', padding: spacing.sm },
  devTools: { marginTop: spacing.xl },
  link: linkText,
  secondLink: { ...linkText, marginTop: spacing.md },
  // Vertical padding brings the touch target to the 44-point minimum.
  control: { marginTop: spacing.sm, paddingVertical: spacing.md, alignSelf: 'flex-start' },
  controlText: linkText,
  note: {
    marginTop: spacing.xs,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
  flags: {
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.text,
  },
});
