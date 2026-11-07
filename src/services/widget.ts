import {NativeModules, Platform} from 'react-native';
import {DailyTimes, buildWidgetSchedule} from '../domain/prayer';
import {PRAYER_LABELS} from '../i18n/tr';import {getUpcomingDays} from './upcoming-days';

const {PrayerWidgetBridge} = NativeModules;

/** Widget'ın uygulama hiç açılmadan doğru kalacağı gün sayısı. */
export const WIDGET_DAYS = 7;

/**
 * Widget planını native tarafa yazar.
 *
 * Geri sayım native `Chronometer` ile aktığı için her saniye köprü çağrısı yok;
 * plan günde bir kez (veya konum değişince) yazılır. Hata widget'ı uygulamayı
 * engellememeli: sessizce yutulur, widget eski veriyle kalır.
 */
export function syncWidget(times: DailyTimes): void {
  if (Platform.OS !== 'android' || !PrayerWidgetBridge?.syncSchedule) {
    return;
  }

  try {
    const days = getUpcomingDays(times, WIDGET_DAYS);
    const schedule = buildWidgetSchedule(days, PRAYER_LABELS);
    PrayerWidgetBridge.syncSchedule(schedule.names, schedule.timestamps);
  } catch {
    // Widget güncellenemedi; uygulama akışını etkilemez.
  }
}
