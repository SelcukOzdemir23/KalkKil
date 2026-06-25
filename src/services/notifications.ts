import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {calculatePrayerTimes, DailyPrayerTimes} from './prayerTimes';
import {formatTime} from '../utils/format';
import {getLocation, getNotificationTiming, getPrayerNotificationEnabled} from './storage';

const CHANNEL_ID = 'prayer-times-channel';

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

const PRAYER_VISIBLE_NAMES: Record<string, string> = {
  fajr: 'İmsak',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

const PRAYER_NAMES = [
  {name: 'fajr', time: (t: DailyPrayerTimes) => t.fajr},
  {name: 'sunrise', time: (t: DailyPrayerTimes) => t.sunrise},
  {name: 'dhuhr', time: (t: DailyPrayerTimes) => t.dhuhr},
  {name: 'asr', time: (t: DailyPrayerTimes) => t.asr},
  {name: 'maghrib', time: (t: DailyPrayerTimes) => t.maghrib},
  {name: 'isha', time: (t: DailyPrayerTimes) => t.isha},
];

function getNextDayTimes(times: DailyPrayerTimes): DailyPrayerTimes | null {
  const location = getLocation();
  if (!location) {
    return null;
  }

  const nextDay = new Date(times.fajr);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    return calculatePrayerTimes(location.latitude, location.longitude, nextDay);
  } catch {
    return null;
  }
}

export async function schedulePrayerNotifications(
  times: DailyPrayerTimes,
  delayMinutes: number = 0,
): Promise<void> {
  await setupNotificationChannel();
  await cancelAllNotifications();

  const timingMinutes = getNotificationTiming();
  const now = Date.now();
  const delayMs = delayMinutes * 60 * 1000;
  const daysToSchedule = [times];
  const nextDayTimes = getNextDayTimes(times);

  if (nextDayTimes) {
    daysToSchedule.push(nextDayTimes);
  }

  for (const dayTimes of daysToSchedule) {
    for (const prayer of PRAYER_NAMES) {
      if (!getPrayerNotificationEnabled(prayer.name)) {
        continue;
      }

      const prayerDate = prayer.time(dayTimes);
      const prayerTime = prayerDate.getTime();
      const notifyTime = prayerTime - timingMinutes * 60 * 1000;
      const finalTime = notifyTime + delayMs;

      if (finalTime <= now) {
        continue;
      }

      const nameTr = PRAYER_VISIBLE_NAMES[prayer.name] || prayer.name;
      const isExactTime = timingMinutes === 0;
      const title = isExactTime
        ? `☾ ${nameTr} vakti girdi`
        : `☾ ${nameTr} vaktine ${timingMinutes} dk kaldı`;
      const body = isExactTime
        ? `${nameTr} — ${formatTime(prayerDate)}`
        : `${nameTr} — ${formatTime(prayerDate)} · ${timingMinutes} dk sonra`;

      await notifee.createTriggerNotification(
        {
          id: `prayer-${prayer.name}-${prayerDate.toISOString().slice(0, 10)}`,
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
          timestamp: finalTime,
          alarmManager: {
            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          },
        } as TimestampTrigger,
      );
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
