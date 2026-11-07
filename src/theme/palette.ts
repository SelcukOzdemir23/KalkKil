/**
 * İki tema, tek yapı.
 *
 * Yön: **ölçü aleti**. Uygulamanın işi günü ölçmek; arayüz de bir alet gibi
 * davranıyor — soğuk taş-yeşil zemin, mürekkep metin, tek çini yeşili vurgu.
 *
 * Neden bu palet: sıcak krem + serif + kiremit kırmızısı, mobil uygulamalarda
 * en sık görülen varsayılan ve uygulamayı jenerik gösteriyordu. Zemin bilinçli
 * olarak **soğuk** (yeşile çalan taş), vurgu **çini** (İznik/çini geleneği):
 * kültürel olarak yerli, ama turuncu-kiremit ailesinden değil.
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
  /** Kerahat gibi "dikkat ama bağırma" bölgeleri için bir tık daha belirgin. */
  accentFaint: string;
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
  background: '#E6E8E1',
  surface: '#EFF1EB',
  surfaceMuted: '#DBDED5',

  ink: '#101C19',
  inkMuted: 'rgba(16, 28, 25, 0.66)',
  inkSubtle: 'rgba(16, 28, 25, 0.56)',

  hairline: 'rgba(16, 28, 25, 0.14)',
  hairlineStrong: 'rgba(16, 28, 25, 0.30)',

  accent: '#186A5E',
  accentSoft: 'rgba(24, 106, 94, 0.10)',
  accentFaint: 'rgba(24, 106, 94, 0.20)',
  accentMuted: 'rgba(24, 106, 94, 0.62)',

  success: '#2F6B45',
  successSoft: 'rgba(47, 107, 69, 0.12)',

  compassNorth: '#186A5E',
  compassSouth: '#8A8570',
  needle: '#186A5E',

  overlay: 'rgba(16, 28, 25, 0.55)',
};

export const darkPalette: Palette = {
  background: '#0B1211',
  surface: '#111A18',
  surfaceMuted: '#070D0C',

  ink: '#E3E6DD',
  inkMuted: 'rgba(227, 230, 221, 0.64)',
  inkSubtle: 'rgba(227, 230, 221, 0.50)',

  hairline: 'rgba(227, 230, 221, 0.13)',
  hairlineStrong: 'rgba(227, 230, 221, 0.26)',

  accent: '#55B9A7',
  accentSoft: 'rgba(85, 185, 167, 0.14)',
  accentFaint: 'rgba(85, 185, 167, 0.22)',
  accentMuted: 'rgba(85, 185, 167, 0.66)',

  success: '#7FBF98',
  successSoft: 'rgba(127, 191, 152, 0.14)',

  compassNorth: '#55B9A7',
  compassSouth: '#9A957F',
  needle: '#55B9A7',

  overlay: 'rgba(0, 0, 0, 0.62)',
};
