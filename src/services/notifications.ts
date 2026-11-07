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
  planPrayerNotifications,
} from '../domain/prayer';
import {PRAYER_LABELS} from '../i18n/tr';
import {formatTime} from '../utils/format';
import {getNotificationTiming, getPrayerNotificationEnabled} from './storage';
import {getUpcomingDays} from './upcoming-days';

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

export async function schedulePrayerNotifications(
  times: DailyTimes,
  delayMinutes: number = 0,
): Promise<void> {
  await setupNotificationChannel();
  await cancelAllNotifications();

  const timingMinutes = getNotificationTiming();
  const planned = planPrayerNotifications({
    days: getUpcomingDays(times, SCHEDULE_DAYS),
    enabled: readEnabledMap(),
    leadMinutes: timingMinutes,
    now: new Date(),
    delayMinutes,
  });

  const isExactTime = timingMinutes === 0;

  for (const item of planned) {
    const label = PRAYER_LABELS[item.key];
    const title = isExactTime
      ? `${label} vakti girdi`
      : `${label} vaktine ${timingMinutes} dk kaldı`;
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

/**
 * İzin **istemez**, yalnızca durumu okur.
 *
 * Ana ekranın her açılışında izin istemek, izni bir kez reddetmiş kullanıcıya
 * her seferinde sistem diyaloğu göstermek demek. İzin onboarding'de (veya
 * Ayarlar'daki eylemle) bir kez istenir; burada yalnızca sonucu okunur.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();

  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}
