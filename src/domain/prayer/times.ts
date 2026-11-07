import {CalculationMethod, Coordinates, PrayerTimes} from 'adhan';
import {DailyTimes, PRAYER_KEYS, PrayerKey} from './types';

/**
 * Diyanet yöntemi.
 *
 * adhan'ın `Turkey()` parametreleri Diyanet'in uyguladığı temkin paylarını da
 * taşır (güneş -7, öğle +5, ikindi +4, akşam +7 dk). Diyanet'in kendi yayınladığı
 * saatlerle uyumu `__tests__/domain/diyanet.test.ts` içinde sabitlenmiştir:
 * bir ilçenin kendi koordinatıyla sapma ±1 dakikayı geçmiyor.
 */
const CALCULATION_PARAMS = CalculationMethod.Turkey();

/**
 * Verilen koordinat ve gün için vakitleri hesaplar. Ağ erişimi yok, saf fonksiyon.
 *
 * @param date Hangi gün (saat kısmı yok sayılır)
 */
export function calculateDailyTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): DailyTimes {
  const times = new PrayerTimes(
    new Coordinates(latitude, longitude),
    date,
    CALCULATION_PARAMS,
  );

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
    sunset: times.sunset,
  };
}

export type SerializedTimes = Record<PrayerKey, number> & {sunset: number};

/** Önbelleğe yazmak için: Date'leri epoch ms'e çevirir (saat dilimi kayması olmaz). */
export function serializeTimes(times: DailyTimes): SerializedTimes {
  const out = {sunset: times.sunset.getTime()} as SerializedTimes;
  for (const key of PRAYER_KEYS) {
    out[key] = times[key].getTime();
  }
  return out;
}

/**
 * Önbellekten okur. Eksik ya da bozuk veri gelirse `null` döner — çağıran
 * yeniden hesaplar. Depolama şeması değiştiğinde eski kayıt sessizce düşer.
 */
export function deserializeTimes(raw: unknown): DailyTimes | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const pick = (key: string): Date | null => {
    const value = record[key];
    return typeof value === 'number' && Number.isFinite(value)
      ? new Date(value)
      : null;
  };

  const sunset = pick('sunset');
  if (!sunset) {
    return null;
  }

  const parsed = {sunset} as DailyTimes;
  for (const key of PRAYER_KEYS) {
    const value = pick(key);
    if (!value) {
      return null;
    }
    parsed[key] = value;
  }
  return parsed;
}
