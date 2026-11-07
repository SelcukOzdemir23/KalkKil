import {describe, expect, it} from '@jest/globals';

import {DailyTimes, buildWidgetSchedule} from '../../src/domain/prayer';
import {PRAYER_LABELS} from '../../src/i18n/tr';

function dayTimes(dayOffset: number): DailyTimes {
  const at = (h: number, m: number) => new Date(2026, 10, 3 + dayOffset, h, m);
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

describe('buildWidgetSchedule', () => {
  it('gün başına altı etiket ve zaman damgası yazar', () => {
    const schedule = buildWidgetSchedule([dayTimes(0), dayTimes(1)], PRAYER_LABELS);
    expect(schedule.names.split('|')).toHaveLength(12);
    expect(schedule.timestamps.split('|')).toHaveLength(12);
  });

  it('etiketler ve damgalar paralel: aynı vakit, aynı sıra', () => {
    const schedule = buildWidgetSchedule([dayTimes(0)], PRAYER_LABELS);
    expect(schedule.names.split('|')[0]).toBe('İmsak');
    expect(Number(schedule.timestamps.split('|')[0])).toBe(
      dayTimes(0).fajr.getTime(),
    );
  });

  it('günleri kronolojik sırayla dizer', () => {
    const schedule = buildWidgetSchedule([dayTimes(0), dayTimes(1)], PRAYER_LABELS);
    const stamps = schedule.timestamps.split('|').map(Number);
    expect(stamps).toEqual([...stamps].sort((a, b) => a - b));
  });
});

