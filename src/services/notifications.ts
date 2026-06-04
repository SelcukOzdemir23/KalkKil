import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import {Platform} from 'react-native';
import {DailyPrayerTimes, formatTime} from './prayerTimes';
import {getNotificationTiming, getPrayerNotificationEnabled} from './storage';

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
  await notifee.cancelAllNotifications();
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

export async function schedulePrayerNotifications(
  times: DailyPrayerTimes,
  delayMinutes: number = 0,
): Promise<void> {
  await cancelAllNotifications();

  const timingMinutes = getNotificationTiming();
  const now = Date.now();
  const delayMs = delayMinutes * 60 * 1000;

  for (const prayer of PRAYER_NAMES) {
    const prayerTime = prayer.time(times).getTime();
    const notifyTime = prayerTime - timingMinutes * 60 * 1000;
    const finalTime = notifyTime + delayMs;

    if (!getPrayerNotificationEnabled(prayer.name)) {
      continue;
    }

    if (finalTime <= now) {
      continue;
    }

    const nameTr = PRAYER_VISIBLE_NAMES[prayer.name] || prayer.name;
    const isExactTime = timingMinutes === 0;

    await notifee.createTriggerNotification(
      {
        title: isExactTime
          ? `${nameTr} vakti girdi`
          : `${nameTr} vaktine ${timingMinutes} dakika kaldı`,
        body: isExactTime
          ? `${nameTr} vakti - ${formatTime(prayer.time(times))}`
          : `${nameTr} vakti ${formatTime(prayer.time(times))}'de`,
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
      } as TimestampTrigger,
    );
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
  }
  return true;
}
