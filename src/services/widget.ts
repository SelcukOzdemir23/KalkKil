import {NativeModules, Platform} from 'react-native';
import {formatTime, PrayerTimeEntry} from './prayerTimes';

const {PrayerWidgetBridge} = NativeModules;

function stripSeconds(countdown: string): string {
  // "01:23:45" → "01:23"
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

  // Build vertical all-times string for widget (newline separated)
  const allTimes = entries
    .map(e => `${e.nameTr.padEnd(6)}${formatTime(e.time)}`)
    .join('\n');

  try {
    PrayerWidgetBridge.updateWidget(nextName, nextTime, countdownNoSec, allTimes);
  } catch {
    // Silently fail - widget update is non-critical
  }
}
