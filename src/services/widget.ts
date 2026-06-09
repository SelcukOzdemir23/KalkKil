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
  _entries: PrayerTimeEntry[],
): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge) {
    return;
  }

  const nextName = nextPrayer ? nextPrayer.nameTr : '--';
  const nextTime = nextPrayer ? formatTime(nextPrayer.time) : '--:--';
  const countdownNoSec = stripSeconds(countdown);

  try {
    const payload = `${nextName}|${nextTime}|${countdownNoSec}`;
    if (payload === lastWidgetPayload) {
      return;
    }
    lastWidgetPayload = payload;
    PrayerWidgetBridge.updateWidget(nextName, nextTime, countdownNoSec, '');
  } catch {
    // Silently fail - widget update is non-critical
  }
}
