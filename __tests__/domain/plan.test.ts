import {describe, expect, it} from '@jest/globals';

import {DailyTimes, PRAYER_KEYS, PrayerKey, planPrayerNotifications} from '../../src/domain/prayer';

function dayTimes(dayOffset: number): DailyTimes {
  const at = (h: number, m: number) =>
    new Date(2026, 10, 3 + dayOffset, h, m, 0, 0);
  return {
    fajr: at(6, 4),
    sunrise: at(7, 30),
    dhuhr: at(12, 53),
    asr: at(15, 39),
    maghrib: at(18, 5),
    isha: at(19, 26),
    sunset: at(17, 58),
  };
}

const allEnabled = PRAYER_KEYS.reduce(
  (acc, key) => ({...acc, [key]: true}),
  {} as Record<PrayerKey, boolean>,
);

function plan(overrides: Partial<Parameters<typeof planPrayerNotifications>[0]> = {}) {
  return planPrayerNotifications({
    days: [dayTimes(0)],
    enabled: allEnabled,
    leadMinutes: 0,
    now: new Date(2026, 10, 3, 0, 30),
    ...overrides,
  });
}

describe('planPrayerNotifications', () => {
  it('bir gün için altı bildirim kurar', () => {
    expect(plan()).toHaveLength(6);
  });

  it('yedi günlük pencere 42 bildirim verir', () => {
    const days = Array.from({length: 7}, (_, i) => dayTimes(i));
    expect(plan({days})).toHaveLength(42);
  });

  it('geçmiş vakitler için bildirim kurmaz', () => {
    const entries = plan({now: new Date(2026, 10, 3, 14, 0)});
    expect(entries.map(e => e.key)).toEqual(['asr', 'maghrib', 'isha']);
  });

  it('kapatılan vakitleri atlar', () => {
    const entries = plan({
      enabled: {...allEnabled, sunrise: false, fajr: false},
    });
    expect(entries.some(e => e.key === 'sunrise')).toBe(false);
    expect(entries.some(e => e.key === 'fajr')).toBe(false);
    expect(entries).toHaveLength(4);
  });

  it('öne alma süresini uygular', () => {
    const [first] = plan({leadMinutes: 15});
    expect(first.key).toBe('fajr');
    expect(first.fireAt.getHours()).toBe(5);
    expect(first.fireAt.getMinutes()).toBe(49);
  });

  it('öne alma yüzünden geçmişe düşen bildirimi atlar', () => {
    // İmsak 06:04, 15 dk öne alma -> 05:49. Saat 05:55 ise o bildirim geçmiştir.
    const entries = plan({leadMinutes: 15, now: new Date(2026, 10, 3, 5, 55)});
    expect(entries.some(e => e.key === 'fajr')).toBe(false);
    expect(entries[0].key).toBe('sunrise');
  });

  it('erteleme süresi kadar öteler', () => {
    const entries = plan({delayMinutes: 15, now: new Date(2026, 10, 3, 5, 30)});
    expect(entries[0].fireAt.getHours()).toBe(6);
    expect(entries[0].fireAt.getMinutes()).toBe(19);
  });

  it('kimlikler kararlı: yeniden planlama kopya üretmez', () => {
    const first = plan();
    const second = plan();
    expect(first.map(e => e.id)).toEqual(second.map(e => e.id));
    expect(first[0].id).toBe('prayer-fajr-2026-11-03');
  });

  it('çıktı ateşleme zamanına göre sıralıdır', () => {
    const days = [dayTimes(0), dayTimes(1)];
    const times = plan({days}).map(e => e.fireAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });
});
