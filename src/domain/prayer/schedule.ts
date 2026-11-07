import {DailyTimes, PRAYER_KEYS, PrayerEntry} from './types';

/** Vakitleri, verilen ana göre `geçti/geçmedi` işaretliyerek listeye çevirir. */
export function buildEntries(times: DailyTimes, now: Date): PrayerEntry[] {
  const nowMs = now.getTime();
  return PRAYER_KEYS.map(key => ({
    key,
    time: times[key],
    isPassed: times[key].getTime() < nowMs,
  }));
}

/** Henüz geçmemiş ilk vakit; gün bittiyse `null`. */
export function findNextEntry(entries: PrayerEntry[]): PrayerEntry | null {
  return entries.find(entry => !entry.isPassed) ?? null;
}

/** Geçmiş son vakdin indeksi; hiçbiri geçmediyse -1. */
export function findLastPassedIndex(entries: PrayerEntry[]): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].isPassed) {
      return i;
    }
  }
  return -1;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
