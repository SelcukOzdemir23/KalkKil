import {describe, expect, it} from '@jest/globals';

import {isNightAt} from '../../src/theme/sun';

const sunTimes = {
  sunrise: new Date(2026, 10, 3, 7, 30),
  sunset: new Date(2026, 10, 3, 17, 58),
};

describe('isNightAt', () => {
  it('vakitler yokken açık temada kalır', () => {
    expect(isNightAt(null, new Date(2026, 10, 3, 23, 0))).toBe(false);
  });

  it('gün doğumundan önce gecedir', () => {
    expect(isNightAt(sunTimes, new Date(2026, 10, 3, 5, 0))).toBe(true);
  });

  it('gün doğumu anı gündüzdür', () => {
    expect(isNightAt(sunTimes, new Date(2026, 10, 3, 7, 30))).toBe(false);
  });

  it('öğleden sonra gündüzdür', () => {
    expect(isNightAt(sunTimes, new Date(2026, 10, 3, 14, 0))).toBe(false);
  });

  it('gün batımı anı gecedir (karanlık tema devreye girer)', () => {
    expect(isNightAt(sunTimes, new Date(2026, 10, 3, 17, 58))).toBe(true);
  });

  it('akşam ezanından sonra gecedir', () => {
    expect(isNightAt(sunTimes, new Date(2026, 10, 3, 21, 0))).toBe(true);
  });
});
