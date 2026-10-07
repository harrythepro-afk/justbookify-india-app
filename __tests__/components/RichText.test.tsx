import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { RichText } from '@/components/RichText';
import { parseDescriptionHtml } from '@/shopify/richText';
import { fonts } from '@/theme/tokens';

describe('RichText (P6-05, D-091)', () => {
  it('draws bold in the bold face and italic in italic', async () => {
    await render(<RichText blocks={parseDescriptionHtml('<p><b>Bold</b> <i>Italic</i></p>')} />);

    expect(StyleSheet.flatten(screen.getByText('Bold').props.style)).toMatchObject({
      fontFamily: fonts.bodyBold,
    });
    expect(StyleSheet.flatten(screen.getByText('Italic').props.style)).toMatchObject({
      fontStyle: 'italic',
    });
  });

  it('draws each list line with its marker, indented by depth', async () => {
    await render(
      <RichText
        blocks={parseDescriptionHtml('<ol><li>One<ul><li>Inner</li></ul></li><li>Two</li></ol>')}
      />,
    );

    expect(screen.getByText('1.')).toBeOnTheScreen();
    expect(screen.getByText('2.')).toBeOnTheScreen();
    expect(screen.getByText('•')).toBeOnTheScreen();
    const indent = (text: string) =>
      (
        StyleSheet.flatten(
          (screen.getByText(text).parent?.parent?.props as { style?: object }).style,
        ) as { marginLeft?: number }
      ).marginLeft ?? 0;
    expect(indent('Inner')).toBeGreaterThan(indent('One'));
  });

  it('draws a link as plain text with nothing to tap', async () => {
    await render(
      <RichText blocks={parseDescriptionHtml('<p>See <a href="https://x">this</a></p>')} />,
    );

    expect(screen.getByText('See this')).toBeOnTheScreen();
    expect(screen.queryByRole('link')).not.toBeOnTheScreen();
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('draws nothing for an empty description', async () => {
    await render(<RichText blocks={[]} testID="empty" />);

    expect(screen.getByTestId('empty').children).toHaveLength(0);
  });
});
