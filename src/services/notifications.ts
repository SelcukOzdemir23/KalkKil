import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {
  DailyTimes,
  PRAYER_KEYS,
  PrayerKey,
  calculateDailyTimes,
  planPrayerNotifications,
} from '../domain/prayer';
import {PRAYER_LABELS} from '../i18n/tr';
import {formatTime} from '../utils/format';
import {
  getLocation,
  getNotificationTiming,
  getPrayerNotificationEnabled,
} from './storage';

const CHANNEL_ID = 'prayer-times-channel';

/**
 * Kaç gün ileriye bildirim kurulur.
 *
 * iOS'ta bekleyen bildirim limiti 64; 7 gün × 6 vakit = 42, güvenli aralıkta
 * kalır. Pencere her planlamada baştan kurulduğu için kimlik çakışması olmaz.
 */
export const SCHEDULE_DAYS = 7;

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'KalkKıl Vakitleri',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
  }
}

export async function cancelAllNotifications(): Promise<void> {
  // Sadece planlanmış vakit bildirimlerini iptal et.
  // cancelAllNotifications() kalıcı foreground notification'ı da silebildiği için
  // widget/bildirim çubuğu deneyimini bozuyordu.
  await notifee.cancelTriggerNotifications();
}

function readEnabledMap(): Record<PrayerKey, boolean> {
  const enabled = {} as Record<PrayerKey, boolean>;
  for (const key of PRAYER_KEYS) {
    enabled[key] = getPrayerNotificationEnabled(key);
  }
  return enabled;
}

/**
 * Bugünden başlayarak `count` günün vakitleri.
 *
 * Eski davranış sadece bugün + yarını kuruyordu: kullanıcı uygulamayı iki gün
 * açmazsa bildirimler tamamen susuyordu. Pencere artık 7 gün.
 */
function upcomingDays(start: DailyTimes, count: number): DailyTimes[] {
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

export async function schedulePrayerNotifications(
  times: DailyTimes,
  delayMinutes: number = 0,
): Promise<void> {
  await setupNotificationChannel();
  await cancelAllNotifications();

  const timingMinutes = getNotificationTiming();
  const planned = planPrayerNotifications({
    days: upcomingDays(times, SCHEDULE_DAYS),
    enabled: readEnabledMap(),
    leadMinutes: timingMinutes,
    now: new Date(),
    delayMinutes,
  });

  const isExactTime = timingMinutes === 0;

  for (const item of planned) {
    const label = PRAYER_LABELS[item.key];
    const title = isExactTime
      ? `☾ ${label} vakti girdi`
      : `☾ ${label} vaktine ${timingMinutes} dk kaldı`;
    const body = isExactTime
      ? `${label} — ${formatTime(item.prayerTime)}`
      : `${label} — ${formatTime(item.prayerTime)} · ${timingMinutes} dk sonra`;

    try {
      await notifee.createTriggerNotification(
        {
          id: item.id,
          title,
          body,
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            pressAction: {id: 'default'},
          },
          ios: {
            sound: 'default',
            interruptionLevel: 'timeSensitive',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: item.fireAt.getTime(),
          alarmManager: {
            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          },
        } as TimestampTrigger,
      );
    } catch {
      // Tek bir bildirim kurulamazsa kalanları engellemesin.
    }
  }
}


export async function sendTestNotification(): Promise<void> {
  await setupNotificationChannel();
  await notifee.displayNotification({
    title: 'KalkKıl Test',
    body: 'Bildirimler sorunsuz çalışıyor!',
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: {id: 'default'},
    },
    ios: {
      sound: 'default',
      interruptionLevel: 'timeSensitive',
    },
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();

  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}
