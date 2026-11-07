import {DailyTimes, calculateDailyTimes} from '../domain/prayer';
import {getLocation} from './storage';

/**
 * Bugünden başlayarak `count` günün vakitleri.
 *
 * Bildirim planlayıcısı ve widget aynı pencereyi kullanır; ikisi de uygulama
 * açılmadan bu süre boyunca doğru kalmalı.
 */
export function getUpcomingDays(start: DailyTimes, count: number): DailyTimes[] {
  const location = getLocation();
  if (!location) {
    return [start];
  }

  const days = [start];
  const base = start.fajr;

  for (let offset = 1; offset < count; offset++) {
    const date = new Date(base);
    date.setDate(date.getDate() + offset);
    try {
      days.push(
        calculateDailyTimes(location.latitude, location.longitude, date),
      );
    } catch {
      break;
    }
  }

  return days;
}
