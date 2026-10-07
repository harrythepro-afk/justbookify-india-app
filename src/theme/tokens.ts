// The only file in src/ allowed to hold colour literals (lint rule in eslint.config.js).
// Colours and fonts come from justbookify.in's theme (D-038); the greens follow D-039.
// Screens use the roles in `colors`, never `palette` directly.

export const palette = {
  maroon: '#910F3F',
  darkMaroon: '#3D081B',
  offWhite: '#FDFDFD',
  cream: '#F2EFDD',
  lightCream: '#FAF9E1',
  yellow: '#F9E547',
  /** The website's "Rent" badge. Only dark maroon text goes on it (D-039). */
  green: '#9DE46D',
  /** For a green that carries light text or stands alone as a button or outline (D-039). */
  greenDark: '#3E7916',
} as const;

export const colors = {
  background: palette.offWhite,
  text: palette.maroon,
  link: palette.darkMaroon,
  divider: palette.cream,

  primaryButton: palette.maroon,
  onPrimaryButton: palette.cream,
  secondaryButtonText: palette.darkMaroon,
  /** Outline of a secondary button on the page background, such as the card's "Notify me". */
  secondaryButtonBorder: palette.darkMaroon,
  /** The frame behind a book cover while it loads, and the whole cover when there is none. */
  coverFrame: palette.cream,

  rentBadge: palette.green,
  onRentBadge: palette.darkMaroon,
  rentedOutBadge: palette.offWhite,
  onRentedOutBadge: palette.maroon,

  accent: palette.greenDark,
  onAccent: palette.cream,

  tabBar: palette.offWhite,
  tabActive: palette.maroon,
  tabInactive: palette.darkMaroon,

  banner: palette.darkMaroon,
  onBanner: palette.yellow,

  // A switch's state shows by the thumb's side as well as the track's colour.
  switchTrackOn: palette.greenDark,
  switchTrackOff: palette.darkMaroon,
  switchThumb: palette.offWhite,
} as const;

export type ColorRole = keyof typeof colors;

/** Every text-on-background pair the tokens allow. The contrast test holds each to 4.5:1. */
export const textPairs: readonly { text: ColorRole; background: ColorRole }[] = [
  { text: 'text', background: 'background' },
  { text: 'link', background: 'background' },
  { text: 'secondaryButtonText', background: 'background' },
  { text: 'onPrimaryButton', background: 'primaryButton' },
  { text: 'onRentBadge', background: 'rentBadge' },
  { text: 'onRentedOutBadge', background: 'rentedOutBadge' },
  { text: 'onAccent', background: 'accent' },
  { text: 'accent', background: 'background' },
  { text: 'tabActive', background: 'tabBar' },
  { text: 'tabInactive', background: 'tabBar' },
  { text: 'onBanner', background: 'banner' },
];

/** One family per face: SDK 57 cannot map `fontWeight` to a custom face (D-041). */
export const fonts = {
  heading: 'Asul_400Regular',
  body: 'Archivo_400Regular',
  bodyBold: 'Archivo_700Bold',
} as const;

// The website scales headings to 1.1 times the body scale (D-038).
const HEADING_SCALE = 1.1;

export const fontSize = {
  small: 14,
  body: 16,
  /** Header bar titles. */
  title: Math.round(18 * HEADING_SCALE),
  /** Page headings. */
  heading: Math.round(24 * HEADING_SCALE),
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 4,
  md: 8,
} as const;

export const iconSize = {
  tab: 24,
  /** The book icon in a cover frame with no image. */
  coverFallback: 40,
} as const;

/** The smallest touch target, in points (WCAG 2.5.5 and both platforms' guidelines). */
export const minTouchTarget = 44;

/** Width over height of the book card's cover frame. Covers fit inside it, never cropped. */
export const coverAspectRatio = 2 / 3;
