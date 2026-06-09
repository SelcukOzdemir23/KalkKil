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

  // Build structured all-times string for widget
  // Format: "name|time,isNext;name|time,isNext;..."
  // Example: "İmsak|05:34,0;Güneş|07:02,0;Öğle|13:15,0;İkindi|16:45,1;Akşam|19:30,0;Yatsı|21:00,0"
  const allTimes = entries
    .map(e => `${e.nameTr}|${formatTime(e.time)},${nextPrayer && e.name === nextPrayer.name ? '1' : '0'}`)
    .join(';');

  try {
    const payload = `${nextName}|${nextTime}|${countdownNoSec}|${allTimes}`;
    if (payload === lastWidgetPayload) {
      return;
    }
    lastWidgetPayload = payload;
    PrayerWidgetBridge.updateWidget(nextName, nextTime, countdownNoSec, allTimes);
  } catch {
    // Silently fail - widget update is non-critical
  }
}
