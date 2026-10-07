import { StyleSheet, Text, View } from 'react-native';

import type { RichSpan, RichTextBlock } from '@/shopify/hooks/catalogue';
import { colors, fonts, fontSize, lineHeight, spacing } from '@/theme/tokens';

/** Deeper lists are drawn at this depth, so a long nesting cannot push text off the screen. */
const MAX_INDENT_DEPTH = 3;

/**
 * A book's description as native text (P6-05, D-091): paragraphs, line breaks, bold, italic and
 * list lines with their markers. Nothing is tappable; a link in the HTML is plain text here.
 */
export function RichText({
  blocks,
  testID,
}: {
  readonly blocks: readonly RichTextBlock[];
  readonly testID?: string;
}) {
  return (
    <View testID={testID}>
      {blocks.map((block, index) =>
        block.kind === 'paragraph' ? (
          <Text key={index} style={[styles.text, index > 0 && styles.gap]}>
            <Spans spans={block.spans} />
          </Text>
        ) : (
          <View
            key={index}
            style={[
              styles.item,
              index > 0 && styles.gap,
              { marginLeft: Math.min(block.depth, MAX_INDENT_DEPTH) * spacing.lg },
            ]}
          >
            <Text style={[styles.text, styles.marker]}>{block.marker}</Text>
            <Text style={[styles.text, styles.itemText]}>
              <Spans spans={block.spans} />
            </Text>
          </View>
        ),
      )}
    </View>
  );
}

function Spans({ spans }: { readonly spans: readonly RichSpan[] }) {
  return spans.map((span, index) => (
    <Text key={index} style={[span.bold && styles.bold, span.italic && styles.italic]}>
      {span.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.body,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    color: colors.text,
  },
  gap: { marginTop: spacing.md },
  // One family per face (D-041): bold is its own font, not a weight.
  bold: { fontFamily: fonts.bodyBold },
  italic: { fontStyle: 'italic' },
  item: { flexDirection: 'row' },
  marker: { minWidth: spacing.xl },
  itemText: { flex: 1 },
});
