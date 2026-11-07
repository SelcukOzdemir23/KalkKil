import {describe, expect, it} from '@jest/globals';

import {
  DailyTimes,
  buildEntries,
  deserializeTimes,
  findLastPassedIndex,
  findNextEntry,
  isSameDay,
  serializeTimes,
} from '../../src/domain/prayer';

function timesAt(fajr: string, isha: string = '20:00'): DailyTimes {
  const day = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return new Date(2026, 10, 3, h, m, 0, 0);
  };
  return {
    fajr: day(fajr),
    sunrise: day('07:30'),
    dhuhr: day('12:53'),
    asr: day('15:39'),
    maghrib: day('18:05'),
    isha: day(isha),
    sunset: day('17:58'),
  };
}

/** Testler Türkiye saatine sabitlenmiş çalışır (package.json -> npm test). */
describe('saat dilimi', () => {
  it('testler Europe/Istanbul ile çalışıyor', () => {
    expect(new Date().getTimezoneOffset()).toBe(-180);
  });
});

describe('buildEntries', () => {
  it('altı vakti sırayla ve geçti işaretleriyle döner', () => {
    const times = timesAt('05:13');
    const entries = buildEntries(times, new Date(2026, 10, 3, 13, 0));

    expect(entries.map(e => e.key)).toEqual([
      'fajr',
      'sunrise',
      'dhuhr',
      'asr',
      'maghrib',
      'isha',
    ]);
    expect(entries.map(e => e.isPassed)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
    ]);
  });

  it('vakit tam o anda geçmiş sayılmaz (sınır dahil değil)', () => {
    const times = timesAt('05:13');
    const entries = buildEntries(times, new Date(times.fajr));
    expect(entries[0].isPassed).toBe(false);
  });
});

describe('findNextEntry', () => {
  it('gün ortasında sıradaki vakdi bulur', () => {
    const entries = buildEntries(timesAt('05:13'), new Date(2026, 10, 3, 13, 0));
    expect(findNextEntry(entries)?.key).toBe('asr');
  });

  it('yatsıdan sonra null döner', () => {
    const entries = buildEntries(timesAt('05:13'), new Date(2026, 10, 3, 23, 0));
    expect(findNextEntry(entries)).toBeNull();
  });

  it('gece yarısından sonra ilk vakit imsaktır', () => {
    const entries = buildEntries(timesAt('05:13'), new Date(2026, 10, 3, 1, 0));
    expect(findNextEntry(entries)?.key).toBe('fajr');
  });
});

describe('findLastPassedIndex', () => {
  it('hiçbir vakit geçmediyse -1', () => {
    const entries = buildEntries(timesAt('05:13'), new Date(2026, 10, 3, 2, 0));
    expect(findLastPassedIndex(entries)).toBe(-1);
  });

  it('hepsi geçtiyse son indeks', () => {
    const entries = buildEntries(timesAt('05:13'), new Date(2026, 10, 3, 23, 0));
    expect(findLastPassedIndex(entries)).toBe(5);
  });
});

describe('isSameDay', () => {
  it('aynı günün farklı saatlerini eşitler', () => {
    expect(
      isSameDay(new Date(2026, 10, 3, 0, 1), new Date(2026, 10, 3, 23, 59)),
    ).toBe(true);
  });

  it('gece yarısını ayrı gün sayar', () => {
    expect(
      isSameDay(new Date(2026, 10, 3, 23, 59), new Date(2026, 10, 4, 0, 0)),
    ).toBe(false);
  });
});

describe('serializeTimes / deserializeTimes', () => {
  it('gidiş-dönüş aynı anları verir', () => {
    const times = timesAt('05:13');
    const restored = deserializeTimes(serializeTimes(times));
    expect(restored).not.toBeNull();
    for (const key of Object.keys(times) as (keyof DailyTimes)[]) {
      expect(restored?.[key].getTime()).toBe(times[key].getTime());
    }
  });

  it.each([
    ['null', null],
    ['string', 'bozuk'],
    ['eksik vakit', {fajr: 1, sunrise: 2, dhuhr: 3, asr: 4, maghrib: 5, sunset: 7}],
    ['sayı olmayan değer', {fajr: 'x'}],
    ['boş nesne', {}],
  ])('bozuk önbelleği reddeder: %s', (_label, raw) => {
    expect(deserializeTimes(raw)).toBeNull();
  });
});
