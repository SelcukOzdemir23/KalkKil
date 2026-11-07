/**
 * Arayüz metinleri.
 *
 * v1 tek dil (Türkçe). Çoklu dil gerekirse değişecek tek dosya burasıdır:
 * domain katmanı yalnızca `PrayerKey` / `KerahatReason` gibi anahtarlar döner.
 */

import {KerahatReason, PrayerKey} from '../domain/prayer/types';

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'İmsak',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

export const KERAHAT_LABELS: Record<KerahatReason, string> = {
  sunrise: 'Güneş doğarken',
  solarNoon: 'Güneş tepedeyken',
  sunset: 'Güneş batarken',
};
