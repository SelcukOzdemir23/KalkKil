/**
 * İki tema, tek yapı.
 *
 * Açık tema: nötr kâğıt + mürekkep metin + tek kızıl vurgu. Kızıl, elyazması
 * almanaklarında başlıkları işaretlemek için kullanılan "rubrik" rengidir;
 * seçim bu gelenekten geliyor, dekoratif olsun diye değil.
 *
 * Uyarı: "sıcak krem + pas/oxblood" kombinasyonu mobil uygulamalarda en sık
 * görülen AI varsayılanı. O yüzden kâğıt tonu bilinçli olarak nötr-taş tarafına
 * çekildi (#F3F1EB), krem/bej değil; vurgu tek ve derin. Paleti değiştirirken
 * bu dengeyi koru.
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
  background: '#F3F1EB',
  surface: '#FCFBF7',
  surfaceMuted: '#E8E6DF',

  ink: '#15171C',
  inkMuted: 'rgba(21, 23, 28, 0.64)',
  inkSubtle: 'rgba(21, 23, 28, 0.48)',

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
  inkSubtle: 'rgba(239, 233, 222, 0.38)',

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
