import {NativeModules, Platform} from 'react-native';
import {formatTime, PrayerTimeEntry} from './prayerTimes';

const {PrayerWidgetBridge} = NativeModules;
let lastWidgetPayload = '';

function stripSeconds(countdown: string): string {
  if (!countdown) return '--:--';
  const parts = countdown.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return countdown;
}

/**
 * Tüm vakitleri bildirim BigText için pipe-ayrılmış stringe dönüştür.
 * Format: "İmsak|04:32|Güneş|06:01|Öğle|12:45|İkindi|16:23|Akşam|19:11|Yatsı|20:41"
 */
function buildDisplayTimesString(entries: PrayerTimeEntry[]): string {
  return entries
    .map(e => `${e.nameTr}|${formatTime(e.time)}`)
    .join('|');
}

/**
 * Tüm vakitlerin epoch ms timestamp'lerini pipe-ayrılmış stringe dönüştür.
 * Format: "1715000000000|1715010000000|..."
 * Foreground service bu sayede bağımsız olarak sıradaki vakti bulabilir.
 */
function buildAllTimestampsString(entries: PrayerTimeEntry[]): string {
  return entries
    .map(e => String(e.time.getTime()))
    .join('|');
}

export function updateWidget(
  nextPrayer: PrayerTimeEntry | null,
  countdown: string,
  entries: PrayerTimeEntry[],
): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }

  const nextName = nextPrayer ? nextPrayer.nameTr : '--';
  const nextTime = nextPrayer ? formatTime(nextPrayer.time) : '--:--';
  const countdownNoSec = stripSeconds(countdown);
  // Bildirim BigText için tüm vakitler
  const displayTimes = buildDisplayTimesString(entries);

  try {
    const payload = `${nextName}|${nextTime}|${countdownNoSec}`;
    if (payload === lastWidgetPayload) {
      return;
    }
    lastWidgetPayload = payload;
    const allTimestamps = buildAllTimestampsString(entries);

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

/**
 * Start the foreground service that shows a persistent notification
 * with prayer times and keeps updating the widget in the background.
 * Safe to call multiple times — service ignores duplicate starts.
 */
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

/**
 * Stop the foreground service and remove the persistent notification.
 */
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
