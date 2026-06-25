import {NativeModules, Platform} from 'react-native';
import {
  calculatePrayerTimes,
  getPrayerTimeEntries,
  PrayerTimeEntry,
} from './prayerTimes';
import {formatTime} from '../utils/format';
import {getLocation} from './storage';

const {PrayerWidgetBridge} = NativeModules;
let lastWidgetPayload = '';

function stripSeconds(countdown: string): string {
  if (!countdown) return '--:--';
  const parts = countdown.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return countdown;
}

function buildNextDayEntries(entries: PrayerTimeEntry[]): PrayerTimeEntry[] {
  const location = getLocation();
  if (!location || entries.length === 0) {
    return [];
  }

  const baseDate = new Date(entries[0].time);
  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const tomorrowTimes = calculatePrayerTimes(location.latitude, location.longitude, tomorrow);
    return getPrayerTimeEntries(tomorrowTimes, new Date());
  } catch {
    return [];
  }
}

function buildDisplayTimesString(entries: PrayerTimeEntry[]): string {
  return entries.map(e => `${e.nameTr}|${formatTime(e.time)}`).join('|');
}

function buildAllTimestampsString(entries: PrayerTimeEntry[]): string {
  return entries.map(e => String(e.time.getTime())).join('|');
}

export function updateWidget(
  nextPrayer: PrayerTimeEntry | null,
  countdown: string,
  entries: PrayerTimeEntry[],
): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }

  const tomorrowEntries = buildNextDayEntries(entries);
  const eventEntries = [...entries, ...tomorrowEntries].sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );

  const nextName = nextPrayer ? nextPrayer.nameTr : '--';
  const nextTime = nextPrayer ? formatTime(nextPrayer.time) : '--:--';
  const countdownNoSec = stripSeconds(countdown);
  const displayTimes = buildDisplayTimesString(eventEntries);
  const allTimestamps = buildAllTimestampsString(eventEntries);

  try {
    const payload = `${nextName}|${nextTime}|${countdownNoSec}|${displayTimes}|${allTimestamps}`;
    if (payload === lastWidgetPayload) {
      return;
    }
    lastWidgetPayload = payload;

    PrayerWidgetBridge.updateWidgetWithTimes(
      nextName,
      nextTime,
      countdownNoSec,
      nextPrayer ? String(nextPrayer.time.getTime()) : '',
      displayTimes,
      allTimestamps,
    );
  } catch {
    try {
      PrayerWidgetBridge.updateWidget(
        nextName,
        nextTime,
        countdownNoSec,
        nextPrayer ? String(nextPrayer.time.getTime()) : '',
      );
    } catch {
      // Silently fail
    }
  }
}

export function startPrayerForegroundService(): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }
  try {
    PrayerWidgetBridge.startForegroundService();
  } catch {
    // Silently fail
  }
}

export function stopPrayerForegroundService(): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }
  try {
    PrayerWidgetBridge.stopForegroundService();
  } catch {
    // Silently fail
  }
}
