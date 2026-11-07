/**
 * İki tema, tek yapı.
 *
 * Açık tema varsayılan: kâğıt + mürekkep + tek kızıl vurgu (almanak elyazması
 * geleneğindeki "rubrik"). Karanlık tema, akşam ezanından sonra kendiliğinden
 * devreye girer (güneş batınca kâğıt yerini mürekkebe bırakır).
 *
 * Kural: ekranlarda ham renk kullanılmaz. Yeni bir renk gerekiyorsa buraya
 * eklenir, böylece iki tema birden tutarlı kalır.
 */

export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;

  ink: string;
  inkMuted: string;
  inkSubtle: string;

  hairline: string;
  hairlineStrong: string;

  accent: string;
  accentSoft: string;
  accentMuted: string;

  success: string;
  successSoft: string;

  /** Kıble pusulası — kuzey/güney uçları ve kıble iğnesi. */
  compassNorth: string;
  compassSouth: string;
  needle: string;

  overlay: string;
}

export const lightPalette: Palette = {
  background: '#F5F0E6',
  surface: '#FFFCF5',
  surfaceMuted: '#ECE5D6',

  ink: '#15171C',
  inkMuted: 'rgba(21, 23, 28, 0.58)',
  inkSubtle: 'rgba(21, 23, 28, 0.36)',

  hairline: 'rgba(21, 23, 28, 0.13)',
  hairlineStrong: 'rgba(21, 23, 28, 0.24)',

  accent: '#A6382F',
  accentSoft: 'rgba(166, 56, 47, 0.09)',
  accentMuted: 'rgba(166, 56, 47, 0.60)',

  success: '#3E6B4F',
  successSoft: 'rgba(62, 107, 79, 0.11)',

  compassNorth: '#B54A3C',
  compassSouth: '#3E6B4F',
  needle: '#A6382F',

  overlay: 'rgba(21, 23, 28, 0.52)',
};

export const darkPalette: Palette = {
  background: '#131519',
  surface: '#1A1D23',
  surfaceMuted: '#0E1014',

  ink: '#EFE9DE',
  inkMuted: 'rgba(239, 233, 222, 0.62)',
  inkSubtle: 'rgba(239, 233, 222, 0.36)',

  hairline: 'rgba(239, 233, 222, 0.13)',
  hairlineStrong: 'rgba(239, 233, 222, 0.24)',

  accent: '#E0705E',
  accentSoft: 'rgba(224, 112, 94, 0.14)',
  accentMuted: 'rgba(224, 112, 94, 0.66)',

  success: '#83AE91',
  successSoft: 'rgba(131, 174, 145, 0.14)',

  compassNorth: '#E0705E',
  compassSouth: '#83AE91',
  needle: '#E0705E',

  overlay: 'rgba(5, 6, 8, 0.62)',
};
