import {
  PrayerTimes,
  CalculationMethod,
  Coordinates,
} from 'adhan';
import {formatTime} from '../utils/format';

export interface DailyPrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface PrayerTimeEntry {
  name: string;
  nameTr: string;
  time: Date;
  isPassed: boolean;
  isKerahat?: boolean;
  kerahatLabel?: string;
}

export interface KerahatVakti {
  label: string;
  start: Date;
  end: Date;
}

// Turkey uses Diyanet calculation method (based on Muslim World League with specific angles)
const CALCULATION_PARAMS = CalculationMethod.Turkey();

export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): DailyPrayerTimes {
  const coordinates = new Coordinates(latitude, longitude);
  const prayers = new PrayerTimes(coordinates, date, CALCULATION_PARAMS);

  return {
    fajr: prayers.fajr,
    sunrise: prayers.sunrise,
    dhuhr: prayers.dhuhr,
    asr: prayers.asr,
    maghrib: prayers.maghrib,
    isha: prayers.isha,
  };
}

export function getPrayerTimeEntries(
  times: DailyPrayerTimes,
  now: Date = new Date(),
): PrayerTimeEntry[] {
  const entries: PrayerTimeEntry[] = [
    {name: 'fajr', nameTr: 'İmsak', time: times.fajr, isPassed: false},
    {
      name: 'sunrise',
      nameTr: 'Güneş',
      time: times.sunrise,
      isPassed: false,
    },
    {name: 'dhuhr', nameTr: 'Öğle', time: times.dhuhr, isPassed: false},
    {name: 'asr', nameTr: 'İkindi', time: times.asr, isPassed: false},
    {name: 'maghrib', nameTr: 'Akşam', time: times.maghrib, isPassed: false},
    {name: 'isha', nameTr: 'Yatsı', time: times.isha, isPassed: false},
  ];

  // Mark passed prayers
  for (const entry of entries) {
    entry.isPassed = entry.time.getTime() < now.getTime();
  }

  return entries;
}

export function getNextPrayer(
  entries: PrayerTimeEntry[],
): PrayerTimeEntry | null {
  const upcoming = entries.filter(e => !e.isPassed);
  return upcoming.length > 0 ? upcoming[0] : null;
}

export function getCurrentPrayerIndex(entries: PrayerTimeEntry[]): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].isPassed) {
      return i;
    }
  }
  return -1;
}

export function getPrayerTimesAsStrings(
  times: DailyPrayerTimes,
): Record<string, string> {
  return {
    fajr: formatTime(times.fajr),
    sunrise: formatTime(times.sunrise),
    dhuhr: formatTime(times.dhuhr),
    asr: formatTime(times.asr),
    maghrib: formatTime(times.maghrib),
    isha: formatTime(times.isha),
  };
}

/**
 * Kerahat vakitlerini hesaplar (Hanefi mezhebine göre)
 * 1. Güneş doğarken: güneş doğumundan 45 dk sonrasına kadar
 * 2. Güneş tam tepedeyken: öğle vaktinden ~10 dk önce ve ~10 dk sonra
 * 3. Güneş batarken: güneş batımından 45 dk öncesine kadar
 */
export function calculateKerahatTimes(times: DailyPrayerTimes): KerahatVakti[] {
  const kerahatList: KerahatVakti[] = [];
  const now = new Date();

  // 1. Güneş doğarken kerâheti (sunrise + 45 dk)
  const sunriseEnd = new Date(times.sunrise.getTime() + 45 * 60 * 1000);
  if (sunriseEnd > now) {
    kerahatList.push({
      label: 'Güneş doğarken',
      start: times.sunrise,
      end: sunriseEnd,
    });
  }

  // 2. Güneş tepedeyken kerâheti (öğle - 10dk, öğle + 10dk)
  const noonStart = new Date(times.dhuhr.getTime() - 10 * 60 * 1000);
  const noonEnd = new Date(times.dhuhr.getTime() + 10 * 60 * 1000);
  if (noonEnd > now) {
    kerahatList.push({
      label: 'Güneş tepede',
      start: noonStart,
      end: noonEnd,
    });
  }

  // 3. Güneş batarken kerâheti (günbatımı - 45 dk)
  const sunsetStart = new Date(times.maghrib.getTime() - 45 * 60 * 1000);
  const sunsetEnd = times.maghrib;
  if (sunsetEnd > now) {
    kerahatList.push({
      label: 'Güneş batarken',
      start: sunsetStart,
      end: sunsetEnd,
    });
  }

  return kerahatList;
}

/** Belirli bir zamanın herhangi bir kerahat vaktinde olup olmadığını kontrol eder */
export function isTimeInKerahat(
  time: Date,
  kerahatList: KerahatVakti[],
): {isKerahat: boolean; label?: string} {
  const timeMs = time.getTime();
  for (const k of kerahatList) {
    if (timeMs >= k.start.getTime() && timeMs < k.end.getTime()) {
      return {isKerahat: true, label: k.label};
    }
  }
  return {isKerahat: false};
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
