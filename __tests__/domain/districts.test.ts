import {describe, expect, it} from '@jest/globals';

import {DISTRICTS, nearestDistrict, searchDistricts} from '../../src/data/districts';
import {calculateDailyTimes, PrayerKey} from '../../src/domain/prayer';

/**
 * Gönderilen ilçe verisinin Diyanet ile uyumu.
 *
 * Koordinatlar tools/build-districts.mjs ile Diyanet'in kendi yayınladığı
 * saatlerden çözüldü; bu test o çözümün bozulmadığını doğrular. Hesap
 * parametrelerine dokunan her değişiklik burada patlar.
 */
const TOLERANCE_MINUTES = 2;

interface Fixture {
  province: string;
  name: string;
  latitude: number;
  longitude: number;
  days: Record<string, Record<PrayerKey, string>>;
}

const FIXTURES: Fixture[] = [
  {
    province: 'İSTANBUL',
    name: 'KÜÇÜKÇEKMECE',
    latitude: 40.63,
    longitude: 28.8159,
    days: {
      '2026-11-17': {'fajr':'06:19', 'sunrise':'07:47', 'dhuhr':'12:55', 'asr':'15:29', 'maghrib':'17:52', 'isha':'19:15'},
    },
  },
  {
    province: 'İSTANBUL',
    name: 'KÜÇÜKÇEKMECE',
    latitude: 40.63,
    longitude: 28.8159,
    days: {
      '2026-11-28': {'fajr':'06:29', 'sunrise':'08:00', 'dhuhr':'12:58', 'asr':'15:24', 'maghrib':'17:46', 'isha':'19:10'},
    },
  },
  {
    province: 'ANKARA',
    name: 'GÜDÜL',
    latitude: 40.09,
    longitude: 32.2378,
    days: {
      '2026-11-17': {'fajr':'06:04', 'sunrise':'07:32', 'dhuhr':'12:41', 'asr':'15:17', 'maghrib':'17:40', 'isha':'19:02'},
    },
  },
  {
    province: 'ANKARA',
    name: 'GÜDÜL',
    latitude: 40.09,
    longitude: 32.2378,
    days: {
      '2026-11-28': {'fajr':'06:15', 'sunrise':'07:44', 'dhuhr':'12:44', 'asr':'15:12', 'maghrib':'17:34', 'isha':'18:58'},
    },
  },
  {
    province: 'İZMİR',
    name: 'KINIK',
    latitude: 38.9,
    longitude: 27.4097,
    days: {
      '2026-11-17': {'fajr':'06:23', 'sunrise':'07:48', 'dhuhr':'13:00', 'asr':'15:39', 'maghrib':'18:02', 'isha':'19:23'},
    },
  },
  {
    province: 'İZMİR',
    name: 'KINIK',
    latitude: 38.9,
    longitude: 27.4097,
    days: {
      '2026-11-28': {'fajr':'06:33', 'sunrise':'08:00', 'dhuhr':'13:03', 'asr':'15:34', 'maghrib':'17:56', 'isha':'19:18'},
    },
  },
  {
    province: 'ANTALYA',
    name: 'GÜNDOĞMUŞ',
    latitude: 36.74,
    longitude: 32.0078,
    days: {
      '2026-11-17': {'fajr':'06:02', 'sunrise':'07:25', 'dhuhr':'12:42', 'asr':'15:26', 'maghrib':'17:49', 'isha':'19:07'},
    },
  },
  {
    province: 'ANTALYA',
    name: 'GÜNDOĞMUŞ',
    latitude: 36.74,
    longitude: 32.0078,
    days: {
      '2026-11-28': {'fajr':'06:12', 'sunrise':'07:36', 'dhuhr':'12:45', 'asr':'15:22', 'maghrib':'17:44', 'isha':'19:03'},
    },
  },
  {
    province: 'KARS',
    name: 'KAĞIZMAN',
    latitude: 40.01,
    longitude: 43.1362,
    days: {
      '2026-11-17': {'fajr':'05:21', 'sunrise':'06:48', 'dhuhr':'11:57', 'asr':'14:33', 'maghrib':'16:57', 'isha':'18:19'},
    },
  },
  {
    province: 'KARS',
    name: 'KAĞIZMAN',
    latitude: 40.01,
    longitude: 43.1362,
    days: {
      '2026-11-28': {'fajr':'05:31', 'sunrise':'07:00', 'dhuhr':'12:00', 'asr':'14:29', 'maghrib':'16:51', 'isha':'18:14'},
    },
  },
  {
    province: 'TRABZON',
    name: 'HAYRAT',
    latitude: 40.7,
    longitude: 40.3862,
    days: {
      '2026-11-17': {'fajr':'05:32', 'sunrise':'07:01', 'dhuhr':'12:08', 'asr':'14:43', 'maghrib':'17:06', 'isha':'18:29'},
    },
  },
  {
    province: 'TRABZON',
    name: 'HAYRAT',
    latitude: 40.7,
    longitude: 40.3862,
    days: {
      '2026-11-28': {'fajr':'05:43', 'sunrise':'07:13', 'dhuhr':'12:11', 'asr':'14:38', 'maghrib':'17:00', 'isha':'18:24'},
    },
  },
  {
    province: 'HAKKARİ',
    name: 'ŞEMDİNLİ',
    latitude: 37.06,
    longitude: 44.605,
    days: {
      '2026-11-17': {'fajr':'05:12', 'sunrise':'06:36', 'dhuhr':'11:52', 'asr':'14:34', 'maghrib':'16:58', 'isha':'18:16'},
    },
  },
  {
    province: 'HAKKARİ',
    name: 'ŞEMDİNLİ',
    latitude: 37.06,
    longitude: 44.605,
    days: {
      '2026-11-28': {'fajr':'05:22', 'sunrise':'06:47', 'dhuhr':'11:54', 'asr':'14:30', 'maghrib':'16:52', 'isha':'18:12'},
    },
  },
  {
    province: 'EDİRNE',
    name: 'LALAPAŞA',
    latitude: 41.7,
    longitude: 26.73,
    days: {
      '2026-11-17': {'fajr':'06:28', 'sunrise':'07:58', 'dhuhr':'13:03', 'asr':'15:35', 'maghrib':'17:58', 'isha':'19:23'},
    },
  },
  {
    province: 'EDİRNE',
    name: 'LALAPAŞA',
    latitude: 41.7,
    longitude: 26.73,
    days: {
      '2026-11-28': {'fajr':'06:39', 'sunrise':'08:10', 'dhuhr':'13:06', 'asr':'15:29', 'maghrib':'17:51', 'isha':'19:18'},
    },
  },
];

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();
const parseMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

describe('ilçe verisi', () => {
  it('yüzlerce ilçe var ve hepsi Türkiye sınırında', () => {
    expect(DISTRICTS.length).toBeGreaterThan(800);
    for (const district of DISTRICTS) {
      expect(district.latitude).toBeGreaterThan(35);
      expect(district.latitude).toBeLessThan(43);
      expect(district.longitude).toBeGreaterThan(25);
      expect(district.longitude).toBeLessThan(45);
    }
  });

  it('büyük/küçük harf ve Türkçe karakter duyarsız arar', () => {
    const withDiacritics = searchDistricts('Kadıköy');
    const withoutDiacritics = searchDistricts('kadikoy');
    expect(withDiacritics.length).toBeGreaterThan(0);
    expect(withoutDiacritics.map(d => d.name)).toEqual(
      withDiacritics.map(d => d.name),
    );
  });

  it('il adıyla da arar', () => {
    expect(searchDistricts('istanbul').length).toBeGreaterThan(0);
  });

  it('en yakın ilçeyi bulur', () => {
    expect(nearestDistrict(41.0, 29.0)?.province).toBe('İSTANBUL');
  });
});

describe('Diyanet uyumu (gönderilen koordinatlarla)', () => {
  for (const fixture of FIXTURES) {
    it(fixture.province + ' / ' + fixture.name, () => {
      for (const [dateKey, expected] of Object.entries(fixture.days)) {
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
              : fixture.name + ' ' + key + ' ' + diff + ' dk sapma',
          ).toBe('uyumlu');
        }
      }
    });
  }
});
