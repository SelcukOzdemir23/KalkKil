import {describe, expect, it} from '@jest/globals';

import {
  computeKerahatWindows,
  findActiveKerahat,
  isInKerahat,
} from '../../src/domain/prayer';
import {DailyTimes} from '../../src/domain/prayer/types';

/** 3 Kasım 2026, İstanbul: güneş 07:30, öğle 12:53, gerçek batış 17:58, akşam 18:05. */
function istanbulTimes(): DailyTimes {
  const day = (h: number, m: number) => new Date(2026, 10, 3, h, m, 0, 0);
  return {
    fajr: day(6, 4),
    sunrise: day(7, 30),
    dhuhr: day(12, 53),
    asr: day(15, 39),
    maghrib: day(18, 5),
    isha: day(19, 26),
    sunset: day(17, 58),
  };
}

describe('computeKerahatWindows', () => {
  it('üç kerahat penceresi üretir', () => {
    const windows = computeKerahatWindows(istanbulTimes());
    expect(windows.map(w => w.reason)).toEqual(['sunrise', 'solarNoon', 'sunset']);
  });

  it('gün doğumu penceresi doğuştan 45 dk sonra biter', () => {
    const [sunrise] = computeKerahatWindows(istanbulTimes());
    expect(sunrise.start.getHours()).toBe(7);
    expect(sunrise.end.getHours()).toBe(8);
    expect(sunrise.end.getMinutes()).toBe(15);
  });

  it('gün batımı penceresi akşam ezanında değil, gerçek batışta biter', () => {
    // Akşam ezanı (18:05) temkin payı nedeniyle batıştan 7 dk sonradır.
    // Kerahat batış anında biter; bu yüzden `maghrib` değil `sunset` kullanılır.
    const sunset = computeKerahatWindows(istanbulTimes())[2];
    expect(sunset.end.getHours()).toBe(17);
    expect(sunset.end.getMinutes()).toBe(58);
    expect(sunset.start.getHours()).toBe(17);
    expect(sunset.start.getMinutes()).toBe(13);
  });

  it('geçmiş pencereleri de döner (geçmişlik bilgisi burada tutulmaz)', () => {
    const windows = computeKerahatWindows(istanbulTimes());
    expect(windows).toHaveLength(3);
  });
});

describe('findActiveKerahat', () => {
  const at = (h: number, m: number) => new Date(2026, 10, 3, h, m);

  it('güneş doğduğu an kerahat başlar', () => {
    expect(findActiveKerahat(computeKerahatWindows(istanbulTimes()), at(7, 30))?.reason).toBe(
      'sunrise',
    );
  });

  it('güneş penceresinin son anı artık kerahat değil (aralık yarı açık)', () => {
    expect(findActiveKerahat(computeKerahatWindows(istanbulTimes()), at(8, 15))).toBeNull();
  });

  it('öğle penceresini yakalar', () => {
    expect(findActiveKerahat(computeKerahatWindows(istanbulTimes()), at(12, 53))?.reason).toBe(
      'solarNoon',
    );
  });

  it('öğle penceresinden önce değil', () => {
    expect(isInKerahat(computeKerahatWindows(istanbulTimes()), at(12, 40))).toBe(false);
  });

  it('akşam ezanı saatinde (18:05) kerahat bitmiş olur', () => {
    expect(isInKerahat(computeKerahatWindows(istanbulTimes()), at(18, 5))).toBe(false);
  });
});
