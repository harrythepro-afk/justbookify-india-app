import { contrastRatio, relativeLuminance } from '@/theme/contrast';
import { colors, palette, textPairs } from '@/theme/tokens';

// WCAG 2.2 AA for normal-size text.
const AA_TEXT = 4.5;

describe('contrastRatio', () => {
  it('gives 21:1 for black on white, in either order', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });

  it('gives 1:1 for a colour on itself', () => {
    expect(contrastRatio(palette.maroon, palette.maroon)).toBe(1);
  });

  // The ratios recorded in D-038 and D-039.
  it.each([
    ['dark maroon on green', palette.darkMaroon, palette.green, 11.01],
    ['cream on dark green', palette.cream, palette.greenDark, 4.6],
    ['dark green on off-white', palette.greenDark, palette.offWhite, 5.22],
    ['cream on green', palette.cream, palette.green, 1.32],
    ['green on off-white', palette.green, palette.offWhite, 1.5],
  ])('gives the recorded ratio for %s', (_name, foreground, background, expected) => {
    expect(contrastRatio(foreground, background)).toBeCloseTo(expected, 2);
  });

  it('refuses a colour that is not #rrggbb', () => {
    expect(() => relativeLuminance('#fff')).toThrow('#rrggbb');
    expect(() => relativeLuminance('maroon')).toThrow('#rrggbb');
  });
});

describe('design tokens', () => {
  it.each(textPairs.map(({ text, background }) => [text, background]))(
    'puts %s on %s at 4.5:1 or more',
    (text, background) => {
      expect(contrastRatio(colors[text], colors[background])).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it('never pairs cream text with the brand green (D-039)', () => {
    const creams: string[] = [palette.cream, palette.lightCream, palette.offWhite];
    const onBrandGreen = textPairs.filter(
      ({ text, background }) =>
        colors[background] === palette.green && creams.includes(colors[text]),
    );
    expect(onBrandGreen).toEqual([]);
  });
});
