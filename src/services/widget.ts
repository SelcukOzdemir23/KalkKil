import {NativeModules, Platform} from 'react-native';
import {
  DailyTimes,
  PrayerEntry,
  buildEntries,
  calculateDailyTimes,
} from '../domain/prayer';
import {PRAYER_LABELS} from '../i18n/tr';
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

function buildNextDayEntries(baseDate: Date): PrayerEntry[] {
  const location = getLocation();
  if (!location) {
    return [];
  }

  const tomorrow = new Date(baseDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const tomorrowTimes: DailyTimes = calculateDailyTimes(
      location.latitude,
      location.longitude,
      tomorrow,
    );
    return buildEntries(tomorrowTimes, new Date());
  } catch {
    return [];
  }
}

function buildDisplayTimesString(entries: PrayerEntry[]): string {
  return entries.map(e => `${PRAYER_LABELS[e.key]}|${formatTime(e.time)}`).join('|');
}

function buildAllTimestampsString(entries: PrayerEntry[]): string {
  return entries.map(e => String(e.time.getTime())).join('|');
}

export function updateWidget(
  nextPrayer: PrayerEntry | null,
  countdown: string,
  entries: PrayerEntry[],
): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }

  const tomorrowEntries = entries.length > 0 ? buildNextDayEntries(entries[0].time) : [];
  const eventEntries = [...entries, ...tomorrowEntries].sort(
    (a, b) => a.time.getTime() - b.time.getTime(),
  );

  const nextName = nextPrayer ? PRAYER_LABELS[nextPrayer.key] : '--';
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
