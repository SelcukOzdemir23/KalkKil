import {DailyTimes, PRAYER_KEYS, PrayerKey} from './types';

export interface NotificationPlanInput {
  /** En yakın günden başlayarak sıralı günler. */
  days: DailyTimes[];
  enabled: Record<PrayerKey, boolean>;
  /** Vakitten kaç dakika önce haber verilsin (0 = tam vaktinde). */
  leadMinutes: number;
  now: Date;
  /** Anlık erteleme ("Namazdayım" modu). */
  delayMinutes?: number;
}

export interface PlannedNotification {
  /** Kararlı kimlik: yeniden planlamada aynı bildirimi ezsin, kopyasını uretmesin. */
  id: string;
  key: PrayerKey;
  prayerTime: Date;
  fireAt: Date;
}

/** YYYY-MM-DD, yerel saatle — UTC'ye çevrilince gün kaymaz. */
function dateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Hangi bildirimin ne zaman düşeceğini hesaplar. Yan etkisi yok, notifee bilmez.
 *
 * Geçmişe düşen bildirimler atlanır: uygulama açıldığında günün geçmiş
 * vakitleri için bildirim üretilmemeli. Aynı gün+vakit için tek kayıt döner.
 */
export function planPrayerNotifications(
  input: NotificationPlanInput,
): PlannedNotification[] {
  const {days, enabled, leadMinutes, now, delayMinutes = 0} = input;
  const nowMs = now.getTime();
  const shiftMs = (delayMinutes - leadMinutes) * 60 * 1000;
  const seen = new Set<string>();
  const planned: PlannedNotification[] = [];

  for (const day of days) {
    for (const key of PRAYER_KEYS) {
      if (!enabled[key]) {
        continue;
      }

      const prayerTime = day[key];
      const fireAt = new Date(prayerTime.getTime() + shiftMs);
      if (fireAt.getTime() <= nowMs) {
        continue;
      }

      const id = `prayer-${key}-${dateKey(prayerTime)}`;
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);

      planned.push({id, key, prayerTime, fireAt});
    }
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
