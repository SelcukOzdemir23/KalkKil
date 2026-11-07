import {describe, expect, it} from '@jest/globals';

import {
  bearingToCardinalName,
  calculateQiblaBearing,
  smoothCompass,
} from '../../src/domain/qibla';

describe('calculateQiblaBearing', () => {
  it('İstanbul için güneydoğuya bakar', () => {
    // İstanbul'dan Kâbe yaklaşık 152° (güneydoğu).
    const bearing = calculateQiblaBearing(41.0082, 28.9784);
    expect(bearing).toBeGreaterThan(145);
    expect(bearing).toBeLessThan(160);
  });

  it('Londra için daha doğuya bakar', () => {
    const london = calculateQiblaBearing(51.5074, -0.1278);
    expect(london).toBeGreaterThan(115);
    expect(london).toBeLessThan(125);
  });

  it('her zaman 0-360 aralığında döner', () => {
    for (const [lat, lng] of [
      [0, 0],
      [-33.9, 151.2],
      [64.1, -21.9],
      [-54.8, -68.3],
    ]) {
      const bearing = calculateQiblaBearing(lat, lng);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });
});

describe('bearingToCardinalName', () => {
  it('sekiz yönü de adlandırır', () => {
    expect(bearingToCardinalName(0)).toBe('Kuzey');
    expect(bearingToCardinalName(45)).toBe('Kuzeydoğu');
    expect(bearingToCardinalName(90)).toBe('Doğu');
    expect(bearingToCardinalName(152)).toBe('Güneydoğu');
    expect(bearingToCardinalName(180)).toBe('Güney');
    expect(bearingToCardinalName(225)).toBe('Güneybatı');
    expect(bearingToCardinalName(270)).toBe('Batı');
    expect(bearingToCardinalName(315)).toBe('Kuzeybatı');
  });

  it('360° kuzeye döner (taşma yok)', () => {
    expect(bearingToCardinalName(359)).toBe('Kuzey');
  });
});

describe('smoothCompass', () => {
  it('360° sınırını kısa yoldan geçer', () => {
    // 359° → 1° geçişi geriye sarmamalı: yarım adım 0°'ye (kuzeye) düşer.
    expect(smoothCompass(1, 359, 0.5)).toBe(0);
  });
});
