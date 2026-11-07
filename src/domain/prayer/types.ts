export const PRAYER_KEYS = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
] as const;

export type PrayerKey = (typeof PRAYER_KEYS)[number];

export interface PrayerEntry {
  key: PrayerKey;
  time: Date;
  isPassed: boolean;
}

/**
 * Bir gündeki namaz vakitleri.
 *
 * `sunset` bir vakit değildir: kerahat penceresini güneşin gerçek batışına
 * bağlayabilmek için tutulur. Akşam ezanı (maghrib) Diyanet'in temkin payı
 * nedeniyle gün batımından birkaç dakika sonradır, kerahat ise tam batış anında
 * biter; bu yüzden ikisini ayrı tutmak gerekir.
 */
export interface DailyTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunset: Date;
}

export type PrayerTimesOnly = Pick<DailyTimes, PrayerKey>;

export interface TimeWindow {
  start: Date;
  end: Date;
}

export type KerahatReason = 'sunrise' | 'solarNoon' | 'sunset';

export interface KerahatWindow extends TimeWindow {
  reason: KerahatReason;
}
