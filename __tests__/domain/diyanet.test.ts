import {describe, expect, it} from '@jest/globals';

import {calculateDailyTimes, PrayerKey} from '../../src/domain/prayer';

/** Kabul edilen sapma: Diyanet'in yayınladığı dakika ile aramızdaki fark. */
const TOLERANCE_MINUTES = 1;

interface Fixture {
  place: string;
  /** İlçenin Diyanet referans noktası. */
  latitude: number;
  longitude: number;
  /** Diyanet'in o ilçe için yayınladığı vakitler (HH:MM). */
  days: Record<string, Record<PrayerKey, string>>;
}

/**
 * Diyanet'in kendi yayınladığı saatlerle uyum testi.
 *
 * Hesap parametrelerine (açılar, temkin payları) dokunan her değişiklik bu testi
 * geçmek zorunda. Sapma büyürse ya yöntem ya da koordinat bozulmustur.
 *
 * Beklenen değerler namazvakitleri.diyanet.gov.tr'den alınmıştır.
 */
const FIXTURES: Fixture[] = [
  {
    place: 'İstanbul',
    latitude: 41.0082,
    longitude: 28.9784,
    days: {
      '2026-11-03': {
        fajr: '06:04',
        sunrise: '07:30',
        dhuhr: '12:53',
        asr: '15:39',
        maghrib: '18:05',
        isha: '19:26',
      },
      '2026-11-10': {
        fajr: '06:11',
        sunrise: '07:38',
        dhuhr: '12:53',
        asr: '15:33',
        maghrib: '17:58',
        isha: '19:20',
      },
      '2026-11-20': {
        fajr: '06:21',
        sunrise: '07:50',
        dhuhr: '12:55',
        asr: '15:26',
        maghrib: '17:49',
        isha: '19:13',
      },
    },
  },
  {
    place: 'Kars / Akyaka',
    latitude: 40.83,
    longitude: 43.6,
    days: {
      '2026-11-03': {
        fajr: '05:05',
        sunrise: '06:31',
        dhuhr: '11:54',
        asr: '14:41',
        maghrib: '17:07',
        isha: '18:28',
      },
    },
  },
];

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function parseMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

function describeDiff(actual: Date, expected: string): string {
  const diff = minutesOfDay(actual) - parseMinutes(expected);
  const hhmm = `${String(actual.getHours()).padStart(2, '0')}:${String(
    actual.getMinutes(),
  ).padStart(2, '0')}`;
  return `hesap ${hhmm}, Diyanet ${expected} (fark ${diff > 0 ? '+' : ''}${diff} dk)`;
}

describe('Diyanet uyumu', () => {
  for (const fixture of FIXTURES) {
    describe(fixture.place, () => {
      for (const [dateKey, expected] of Object.entries(fixture.days)) {
        it(`${dateKey}: ±${TOLERANCE_MINUTES} dk içinde`, () => {
          const [year, month, day] = dateKey.split('-').map(Number);
          const times = calculateDailyTimes(
            fixture.latitude,
            fixture.longitude,
            new Date(year, month - 1, day),
          );

          for (const key of Object.keys(expected) as PrayerKey[]) {
            const diff = Math.abs(
              minutesOfDay(times[key]) - parseMinutes(expected[key]),
            );
            expect(
              diff <= TOLERANCE_MINUTES
                ? 'uyumlu'
                : `${key}: ${describeDiff(times[key], expected[key])}`,
            ).toBe('uyumlu');
          }
        });
      }
    });
  }
});
