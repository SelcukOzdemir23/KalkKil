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
    // allTimes parametresi artık 2 veri taşıyor:
    //   - timestamp (saniye bazlı countdown için)  → nextPrayer timestamp
    //   - displayTimes (bigtext için)              → KEY_ALL_TIMES'a yazılıyor
    // Bridge'i iki ayrı çağrıyla güncellemek yerine,
    // Kotlin tarafında KEY_ALL_TIMES'ı displayTimes olarak saklayacağız.
    // Timestamp ayrı KEY_NEXT_PRAYER_TIMESTAMP'a yazılıyor (bridge bunu allTimes param olarak alıyor).
    // Yeni: displayTimes'ı da bridge'e gönder — 5. parametre olarak.
    PrayerWidgetBridge.updateWidgetWithTimes(
      nextName,
      nextTime,
      countdownNoSec,
      nextPrayer ? String(nextPrayer.time.getTime()) : '',
      displayTimes,
    );
  } catch {
    // 5-param metod yoksa eski metodu fallback olarak çağır
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
