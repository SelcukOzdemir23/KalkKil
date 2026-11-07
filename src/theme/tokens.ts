import {Platform, TextStyle} from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  full: 999,
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;

const serif = 'Alegreya-SemiBold';
const serifBold = 'Alegreya-Bold';
const sans = Platform.select({ios: 'System', default: 'sans-serif'});

export type TextVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'body'
  | 'caption'
  | 'label'
  | 'numeric'
  | 'time';

/**
 * Tipografi ölçeği.
 *
 * Başlıklar Alegreya (almanak karakteri), gövde ve sayılar sistem sansı.
 * Zaman değerleri `tabular-nums` ile sabit genişlikte: geri sayım saniye
 * saniye değişirken metin zıplamaz.
 */
export const typography: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: serifBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
  },
  title: {
    fontFamily: serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  headline: {
    fontFamily: serif,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {fontFamily: sans, fontSize: 15, lineHeight: 22},
  caption: {fontFamily: sans, fontSize: 13, lineHeight: 18},
  label: {fontFamily: sans, fontSize: 12, lineHeight: 16, letterSpacing: 0.2},
  numeric: {
    fontFamily: sans,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -1.6,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  time: {
    fontFamily: sans,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
};
