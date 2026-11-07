import {buildEntries, findNextEntry} from './schedule';
import {DailyTimes, PRAYER_KEYS, PrayerEntry} from './types';

export interface WidgetSchedule {
  /** "İmsak|Güneş|..." — günler arka arkaya, `timestamps` ile paralel. */
  names: string;
  /** Epoch ms, `|` ile ayrılmış. */
  timestamps: string;
}

/**
 * Widget'a verilecek planı üretir.
 *
 * Native taraf `names[i]` ile `timestamps[i]`'i eşler; bu yüzden iki dizi aynı
 * uzunlukta ve aynı sırada olmak zorunda.
 */
export function buildWidgetSchedule(
  days: DailyTimes[],
  labels: Record<string, string>,
): WidgetSchedule {
  const names: string[] = [];
  const timestamps: string[] = [];

  for (const day of days) {
    for (const key of PRAYER_KEYS) {
      names.push(labels[key]);
      timestamps.push(String(day[key].getTime()));
    }
  }

  return {names: names.join('|'), timestamps: timestamps.join('|')};
}

/** Widget başlığında görünecek vakit. */
export function nextWidgetEvent(
  days: DailyTimes[],
  now: Date,
): PrayerEntry | null {
  return findNextEntry(days.flatMap(day => buildEntries(day, now)));
}
