import {TextStyle} from 'react-native';

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
  xs: 2,
  sm: 3,
  md: 4,
  lg: 6,
  xl: 8,
  full: 999,
} as const;

export const motion = {
  fast: 140,
  base: 220,
  slow: 320,
} as const;

const display = 'Archivo-Bold';
const semi = 'Archivo-SemiBold';
const medium = 'Archivo-Medium';
const regular = 'Archivo-Regular';
const mono = 'IBMPlexMono-Medium';
const monoRegular = 'IBMPlexMono-Regular';

export type TextVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'body'
  | 'caption'
  | 'label'
  | 'numeric'
  | 'measure'
  | 'time';

/**
 * Tipografi ölçeği.
 *
 * İki aile, iki iş: **Archivo** (grotesk) başlık ve gövde, **IBM Plex Mono**
 * her sayı ve küçük etiket. Saatler mono olduğu için alt alta gelen vakitler
 * aynı genişlikte duruyor ve geri sayım akarken metin zıplamıyor.
 *
 * DİKKAT: `fontVariant: ['tabular-nums']` **kullanılmaz**. Android'de bu özellik
 * metni varsayılan sistem fontuna düşürüyor; sayılar mono yerine Archivo'da
 * çiziliyordu. Mono font zaten sabit genişlikte, ek bir ayar gerekmiyor.
 *
 * Serif bilinçli olarak yok: “krem kâğıt + serif başlık + toprak vurgu”
 * mobilde en sık görülen varsayılan. Uygulama bir ölçü aleti gibi okunsun
 * istendiği için grotesk + mono seçildi.
 *
 * `label` büyük harfe çevrilir (textTransform): küçük plastik etiketler,
 * almanak başlığı değil.
 */
export const typography: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: display,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -1.9,
  },
  title: {
    fontFamily: semi,
    fontSize: 25,
    lineHeight: 29,
    letterSpacing: -0.7,
  },
  headline: {
    fontFamily: semi,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.25,
  },
  body: {fontFamily: regular, fontSize: 15, lineHeight: 21},
  caption: {fontFamily: regular, fontSize: 13, lineHeight: 18},
  label: {
    fontFamily: mono,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  numeric: {
    fontFamily: mono,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.2,
  },
  /** Derece, yüzde gibi tek ölçüm değerleri — geri sayımdan küçük. */
  measure: {
    fontFamily: mono,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  time: {
    fontFamily: mono,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
};

export {display, semi, medium, regular, mono, monoRegular};

