import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { allowAfterLogin, denyAfterLogin } from '@/analytics/loginConsent';
import {
  colors,
  disabledOpacity,
  fonts,
  fontSize,
  iconSize,
  lineHeight,
  minTouchTarget,
  radius,
  spacing,
} from '@/theme/tokens';

// DRAFT wording (D-130), approved by the owner on 13 October 2026, to be reviewed by the owner's
// adviser with the privacy policy's app section (risk 21).
export const CONSENT_REQUEST_TITLE = 'Help us improve the app?';
export const CONSENT_REQUEST_TEXT =
  'If you allow it, we record how you use the app, such as the screens you open and the books ' +
  'you look at, along with basic device information, and link it to your account. We never ' +
  'record the words you type in search or any payment details.';
export const CONSENT_REQUEST_CHANGE_LATER = 'You can change this at any time on the Account tab.';
export const CONSENT_ALLOW = 'Allow';
export const CONSENT_DONT_ALLOW = "Don't allow";
export const CONSENT_CLOSE = 'Close';
export const CONSENT_SAVE_FAILED = 'Your choice could not be saved. Please try again.';

type Props = {
  readonly visible: boolean;
  /** The request is gone: answered, or closed with the choice left `not asked`. */
  readonly onDone: () => void;
};

/**
 * The analytics consent request (P7-03, D-129, D-130), shown on the Account tab right after a
 * login while the choice is `not asked`. "Allow" grants, "Don't allow" denies, and "Close" or
 * Android's Back stores nothing. The two answers look the same and neither is chosen in advance.
 * Tapping outside does nothing, so a stray tap is never an answer.
 */
export function AnalyticsConsentRequest({ visible, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const titleRef = useRef<ComponentRef<typeof Text>>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const finish = () => {
    setFailed(false);
    onDone();
  };

  const close = () => {
    if (!saving) finish();
  };

  const answer = async (save: () => Promise<boolean>) => {
    if (saving) return;
    setSaving(true);
    setFailed(false);
    const saved = await save();
    setSaving(false);
    if (saved) finish();
    else setFailed(true);
  };

  return (
    <Modal
      animationType="fade"
      navigationBarTranslucent
      onRequestClose={close}
      onShow={() => {
        // A screen reader starts on the title.
        if (titleRef.current !== null) {
          AccessibilityInfo.sendAccessibilityEvent(titleRef.current, 'focus');
        }
      }}
      statusBarTranslucent
      testID="consent-request"
      transparent
      visible={visible}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />
        <View accessibilityViewIsModal style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
              <Text accessibilityRole="header" ref={titleRef} style={styles.title}>
                {CONSENT_REQUEST_TITLE}
              </Text>
              <Pressable
                accessibilityLabel={CONSENT_CLOSE}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                onPress={close}
                style={[styles.close, saving && styles.disabled]}
              >
                <Ionicons color={colors.secondaryButtonText} name="close" size={iconSize.close} />
              </Pressable>
            </View>
            <Text style={styles.text}>{CONSENT_REQUEST_TEXT}</Text>
            <Text style={styles.text}>{CONSENT_REQUEST_CHANGE_LATER}</Text>
            {failed && (
              <Text accessibilityLiveRegion="polite" style={styles.text}>
                {CONSENT_SAVE_FAILED}
              </Text>
            )}
            <View style={styles.buttons}>
              {[
                { label: CONSENT_DONT_ALLOW, save: denyAfterLogin },
                { label: CONSENT_ALLOW, save: allowAfterLogin },
              ].map(({ label, save }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: saving }}
                  disabled={saving}
                  key={label}
                  onPress={() => void answer(save)}
                  style={[styles.button, saving && styles.disabled]}
                >
                  <Text style={styles.buttonText}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  scrim: { backgroundColor: colors.scrim },
  // Long text at large sizes scrolls inside the card; nothing caps the font scale.
  card: { maxHeight: '100%', borderRadius: radius.md, backgroundColor: colors.sheet },
  content: { padding: spacing.lg, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: {
    flex: 1,
    paddingTop: spacing.sm,
    fontFamily: fonts.heading,
    fontSize: fontSize.title,
    color: colors.text,
  },
  close: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: colors.text,
  },
  // Both answers share one style and one width; at large text sizes each takes its own line.
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  button: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    borderColor: colors.secondaryButtonBorder,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: fontSize.body,
    color: colors.secondaryButtonText,
  },
  disabled: { opacity: disabledOpacity },
});
