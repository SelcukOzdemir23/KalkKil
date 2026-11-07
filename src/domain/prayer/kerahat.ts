import {DailyTimes, KerahatWindow} from './types';

/** Güneş doğduktan sonra kerahat sürer (Hanefi: ~45 dk). */
export const SUNRISE_KERAHAT_MINUTES = 45;
/** Güneş tam tepedeyken, öğle vaktinden önceki ve sonraki pay. */
export const NOON_KERAHAT_MINUTES = 10;
/** Güneş batmadan önceki kerahat süresi. */
export const SUNSET_KERAHAT_MINUTES = 45;

const MINUTE_MS = 60 * 1000;

/**
 * Günün kerahat pencereleri (Hanefi).
 *
 * Sıra önemli değil; tüketiciler `findActiveKerahat` ile "şu an" sorgular.
 * Pencereler geçmiş olsa da döner — "şimdi" bilgisi burada değil, çağıran tarafta.
 *
 * Öğle penceresi gerçek zeval anından değil, öğle ezanından geriye 10 dk alınarak
 * hesaplanır (temkin payı kadar yaklaşıklık, ±5 dk).
 */
export function computeKerahatWindows(times: DailyTimes): KerahatWindow[] {
  return [
    {
      reason: 'sunrise',
      start: times.sunrise,
      end: new Date(times.sunrise.getTime() + SUNRISE_KERAHAT_MINUTES * MINUTE_MS),
    },
    {
      reason: 'solarNoon',
      start: new Date(times.dhuhr.getTime() - NOON_KERAHAT_MINUTES * MINUTE_MS),
      end: new Date(times.dhuhr.getTime() + NOON_KERAHAT_MINUTES * MINUTE_MS),
    },
    {
      reason: 'sunset',
      // Güneşin gerçek batışı esas alınır; akşam ezanı (maghrib) temkin payı
      // nedeniyle birkaç dakika sonradır ve kerahat orada bitmiş olur.
      start: new Date(times.sunset.getTime() - SUNSET_KERAHAT_MINUTES * MINUTE_MS),
      end: times.sunset,
    },
  ];
}

/** Verilen an bir kerahat penceresinin içindeyse o pencereyi döner. */
export function findActiveKerahat(
  windows: KerahatWindow[],
  at: Date,
): KerahatWindow | null {
  const atMs = at.getTime();
  return (
    windows.find(
      w => atMs >= w.start.getTime() && atMs < w.end.getTime(),
    ) ?? null
  );
}

export function isInKerahat(windows: KerahatWindow[], at: Date): boolean {
  return findActiveKerahat(windows, at) !== null;
}
