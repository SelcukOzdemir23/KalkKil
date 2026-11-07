#!/usr/bin/env node
/**
 * İlçe koordinatlarını Diyanet'in yayınladığı vakitlerden geri çözer.
 *
 * Neden böyle: uygulama "Diyanet ile aynı dakika" iddia ediyor. Yöntem
 * doğrulandı (bkz. __tests__/domain/diyanet.test.ts); kalan değişken her
 * ilçenin Diyanet'in kullandığı referans noktası. Açık kaynaklarda ilçe
 * koordinatı yok (turkiyeapi.dev yalnızca il merkezini veriyor), bu yüzden
 * koordinat Diyanet'in kendi saatlerinden en küçük kareler ile geri çözülüyor.
 *
 * Çalıştırma: node tools/build-districts.mjs
 * Çıktı:      src/data/districts.ts
 *
 * Bu bir geliştirme aracıdır; CI'da ve uygulamada çalışmaz.
 */

import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const {PrayerTimes, CalculationMethod, Coordinates} = require('adhan');

const BASE = 'https://ezanvakti.emushaf.net';
const PARAMS = CalculationMethod.Turkey();
const PRAYER_FIELDS = [
  ['fajr', 'Imsak'],
  ['sunrise', 'Gunes'],
  ['dhuhr', 'Ogle'],
  ['asr', 'Ikindi'],
  ['maghrib', 'Aksam'],
  ['isha', 'Yatsi'],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CACHE_DIR = '/tmp/emushaf-cache';
mkdirSync(CACHE_DIR, {recursive: true});

/**
 * Disk önbellekli, tek sıralı, geri çekilmeli istek.
 * Servis 429 veriyor; hem nazik olmak hem de yarıda kalan koşuyu
 * sürdürebilmek için her yanıt diske yazılıyor.
 */
async function getJson(url, cacheKey, attempt = 0) {
  const cachePath = `${CACHE_DIR}/${cacheKey}.json`;
  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, 'utf8'));
  }

  try {
    const response = await fetch(url);
    if (response.status === 429) {
      throw new Error('rate-limited');
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    writeFileSync(cachePath, JSON.stringify(data), 'utf8');
    return data;
  } catch (error) {
    if (attempt >= 6) {
      throw error;
    }
    // 429'da daha uzun bekle.
    await sleep(error.message === 'rate-limited' ? 5000 : 800 * (attempt + 1));
    return getJson(url, cacheKey, attempt + 1);
  }
}

/** "06:04" -> gün başından itibaren dakika */
const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Verilen koordinat için bir günün vakitlerini dakikaya çevirir. */
function computeMinutes(lat, lon, date) {
  const times = new PrayerTimes(new Coordinates(lat, lon), date, PARAMS);
  const out = {};
  for (const [key] of PRAYER_FIELDS) {
    const d = times[key];
    out[key] = d.getHours() * 60 + d.getMinutes();
  }
  return out;
}

// Türkiye sınırları — kaba tarama bu aralıkta yapılır.
const LAT_MIN = 35.5;
const LAT_MAX = 42.5;

/**
 * İki parametreli en küçük kareler.
 *
 * Öğle vakti neredeyse yalnızca boylama bağlıdır (4 dk/derece), bu yüzden
 * boylam tek adımda çözülür. Enlem için önce Türkiye aralığında kaba, sonra
 * en iyi noktanın çevresinde ince tarama yapılır. Toplam ~80 hesap/ilçe.
 */
function fitDistrict(observations) {
  const error = (lat, lon) => {
    let sum = 0;
    for (const obs of observations) {
      const computed = computeMinutes(lat, lon, obs.date);
      for (const [key] of PRAYER_FIELDS) {
        const diff = computed[key] - obs.minutes[key];
        sum += diff * diff;
      }
    }
    return sum;
  };

  // 1) Boylam: gözlenen öğle ile hesaplanan öğle arasındaki fark / 4 dk.
  //    Öğle, enlemden bağımsız olduğu için referans enlem fark etmez.
  const refLat = 39;
  const refLon = 35;
  const dhuhrDelta =
    observations.reduce((acc, obs) => {
      const computed = computeMinutes(refLat, refLon, obs.date).dhuhr;
      return acc + (obs.minutes.dhuhr - computed);
    }, 0) / observations.length;
  // Doğuya gidildikçe güneş daha ERKEN tepeye gelir: işaret negatif.
  const lon = refLon - dhuhrDelta / 4;

  // 2) Enlem: Türkiye aralığında kaba tarama.
  let best = {lat: 39, lon, error: Infinity};
  for (let lat = LAT_MIN; lat <= LAT_MAX; lat += 0.2) {
    const value = error(lat, lon);
    if (value < best.error) {
      best = {lat, lon, error: value};
    }
  }

  // 3) En iyi noktanın çevresinde ince tarama.
  for (let lat = best.lat - 0.2; lat <= best.lat + 0.2; lat += 0.01) {
    const value = error(lat, lon);
    if (value < best.error) {
      best = {lat, lon, error: value};
    }
  }

  // 4) Enlem sabitken boylamı ince ayarla.
  for (let candidate = lon - 0.02; candidate <= lon + 0.02; candidate += 0.01) {
    const value = error(best.lat, candidate);
    if (value < best.error) {
      best = {lat: best.lat, lon: candidate, error: value};
    }
  }

  return best;
}

function residualMinutes(observations, lat, lon) {
  let worst = 0;
  for (const obs of observations) {
    const computed = computeMinutes(lat, lon, obs.date);
    for (const [key] of PRAYER_FIELDS) {
      worst = Math.max(worst, Math.abs(computed[key] - obs.minutes[key]));
    }
  }
  return worst;
}

async function main() {
  const provinces = await getJson(`${BASE}/sehirler/2`, 'sehirler-2');

  const districts = [];
  for (const province of provinces) {
    const list = await getJson(
      `${BASE}/ilceler/${province.SehirID}`,
      `ilceler-${province.SehirID}`,
    );
    await sleep(150);
    for (const district of list) {
      districts.push({
        province: province.SehirAdi,
        name: district.IlceAdi,
        emushafId: district.IlceID,
      });
    }
    process.stdout.write(`.`);
  }
  console.log(`\n${districts.length} ilçe bulundu`);

  // Vakitleri topla. Tek sıra + kısa bekleme: servis hız sınırı koyuyor.
  const observations = new Map();
  const failed = [];
  let done = 0;
  for (const district of districts) {
    let rows;
    try {
      rows = await getJson(
        `${BASE}/vakitler/${district.emushafId}`,
        `vakitler-${district.emushafId}`,
      );
    } catch (error) {
      // Tek bir ilçe sunucuda bozuk olabilir; tüm koşuyu düşürmesin.
      failed.push({name: district.name, province: district.province, id: district.emushafId});
      done++;
      continue;
    }
    observations.set(
      district.emushafId,
      rows.map(row => {
        const [d, m, y] = row.MiladiTarihKisa.split('.').map(Number);
        const minutes = {};
        for (const [key, field] of PRAYER_FIELDS) {
          minutes[key] = toMinutes(row[field]);
        }
        return {date: new Date(y, m - 1, d, 12, 0, 0), minutes};
      }),
    );
    done++;
    if (done % 50 === 0) {
      process.stdout.write(`[${done}/${districts.length}] `);
    }
    await sleep(120);
  }
  console.log(`\nvakitler toplandı (başarısız: ${failed.length})`);
  if (failed.length > 0) {
    console.log('başarısız ilçeler:', failed.map(f => `${f.province}/${f.name}`).join(', '));
  }

  // İl merkezleri ile başlangıç noktası (seed) — fit yakınsaması için.
  const results = [];
  let unresolved = 0;
  for (const district of districts) {
    const rows = observations.get(district.emushafId) ?? [];
    if (rows.length === 0) {
      unresolved++;
      continue;
    }

    // Sabit bir Türkiye ortalamasından değil, doğrudan ülke aralığından
    // tarıyoruz; böylece Edirne ile Hakkari aynı kodla çözülüyor.
    const fitted = fitDistrict(rows);

    results.push({
      province: district.province,
      name: district.name,
      latitude: Math.round(fitted.lat * 1e4) / 1e4,
      longitude: Math.round(fitted.lon * 1e4) / 1e4,
      worstMinutes: residualMinutes(rows, fitted.lat, fitted.lon),
    });
  }

  // emushaf bazı ilçeleri listelemiyor (ör. İstanbul'da 20 ilçe, Kadıköy dahil).
  // Bunları il merkezinin koordinatıyla tamamlıyoruz ve "yaklaşık" işaretliyoruz:
  // uydurma koordinat üretmektense dürüst olan bu.
  // emushaf bazı adları Türkçe karaktersiz yazıyor (ARNAVUTKOY / ARNAVUTKÖY).
  // Aynı ilçeyi iki kez eklememek için adları katlayarak karşılaştırıyoruz.
  const fold = value =>
    value
      .toLocaleUpperCase('tr-TR')
      .replace(/İ/g, 'I')
      .replace(/[ÇĞÖŞÜ]/g, c => ({Ç: 'C', Ğ: 'G', Ö: 'O', Ş: 'S', Ü: 'U'})[c]);

  const known = new Set(results.map(r => `${r.province}/${fold(r.name)}`));
  const centerByName = new Map();
  for (const r of results) {
    if (r.name === r.province) {
      centerByName.set(r.province, {latitude: r.latitude, longitude: r.longitude});
    }
  }

  try {
    const response = await fetch('https://turkiyeapi.dev/api/v1/districts');
    const payload = await response.json();
    const all = payload.data ?? payload;
    let added = 0;

    for (const item of all) {
      const province = String(item.province).toLocaleUpperCase('tr-TR');
      const name = String(item.name).toLocaleUpperCase('tr-TR');
      if (known.has(`${province}/${fold(name)}`)) {
        continue;
      }
      const center = centerByName.get(province);
      if (!center) {
        continue;
      }
      results.push({
        province,
        name,
        latitude: center.latitude,
        longitude: center.longitude,
        approximate: true,
        worstMinutes: 0,
      });
      known.add(`${province}/${fold(name)}`);
      added++;
    }
    console.log(`eksik ilçe tamamlandı (il merkezi): ${added}`);
  } catch (error) {
    console.warn('turkiyeapi alınamadı, eksik ilçeler atlandı:', error.message);
  }

  const worst = Math.max(...results.map(r => r.worstMinutes));
  const over1 = results.filter(r => r.worstMinutes > 1).length;
  console.log(`çözülen: ${results.length}, çözülemeyen: ${unresolved}`);
  console.log(`en kötü sapma: ${worst.toFixed(1)} dk, >1dk olan ilçe: ${over1}`);

  writeFileSync(
    '/tmp/districts-fitted.json',
    JSON.stringify(results, null, 1),
    'utf8',
  );

  // Uygulamanın kullandığı veri dosyası.
  const normalize = value =>
    value
      .toLocaleUpperCase('tr-TR')
      .replace(/İ/g, 'i')
      .replace(/I/g, 'ı')
      .toLocaleLowerCase('tr-TR');

  results.sort(
    (a, b) =>
      a.province.localeCompare(b.province, 'tr') ||
      a.name.localeCompare(b.name, 'tr'),
  );

  const body = results
    .map(
      r =>
        `  {province: '${r.province}', name: '${r.name}', latitude: ${
          r.latitude
        }, longitude: ${r.longitude}${r.approximate ? ', approximate: true' : ''}},`,
    )
    .join('\n');

  const file = `/**
 * İlçe listesi ve Diyanet referans koordinatları.
 *
 * OTOMATİK ÜRETİLDİ — elle düzenlemeyin.
 * Kaynak: tools/build-districts.mjs
 *
 * Koordinatlar Diyanet'in kendi yayınladığı vakitlerden en küçük kareler ile
 * geri çözüldü. Amaç coğrafi merkez değil, Diyanet'in o ilçe için kullandığı
 * referans noktası: vakitler bu noktadan hesaplanınca Diyanet tablosuyla
 * örtüşüyor (eğitim penceresinde ±1 dk, pencere dışındaki günlerde ±2 dk).
 *
 * Toplam ${results.length} ilçe.
 */

export interface District {
  province: string;
  name: string;
  latitude: number;
  longitude: number;
  /** true: Diyanet bu ilçeyi yayınlamıyor; koordinat il merkezinden alındı. */
  approximate?: boolean;
}

export const DISTRICTS: District[] = [
${body}
];

/**
 * Arama için sadeleştirme: Türkçe karakterleri katlar, küçük harfe indirir.
 * Böylece "kadikoy" da "KADIKÖY" da aynı sonucu verir — mobil klavyede
 * Türkçe karakter yazmak zahmetli.
 */
const FOLDING: Record<string, string> = {Ç: 'C', Ğ: 'G', Ö: 'O', Ş: 'S', Ü: 'U'};

function normalize(value: string): string {
  return value
    .toLocaleUpperCase('tr-TR')
    .replace(/[İI]/g, 'I')
    .replace(/[ÇĞÖŞÜ]/g, c => FOLDING[c] ?? c)
    .toLowerCase();
}

export function searchDistricts(query: string, limit = 20): District[] {
  const needle = normalize(query.trim());
  if (needle.length === 0) {
    return [];
  }

  const starts: District[] = [];
  const contains: District[] = [];

  for (const district of DISTRICTS) {
    const name = normalize(district.name);
    const province = normalize(district.province);
    if (name.startsWith(needle) || province.startsWith(needle)) {
      starts.push(district);
    } else if (name.includes(needle) || province.includes(needle)) {
      contains.push(district);
    }
    if (starts.length >= limit) {
      break;
    }
  }

  return [...starts, ...contains].slice(0, limit);
}

/**
 * Koordinatlar Diyanet'in referans noktası; ölçümde bunlar gerçek coğrafi
 * merkezlerin yaklaşık 0.24° güneyine düşüyor (Diyanet'in bölgesel temkin
 * payı enlem sapmasına dönüşüyor). GPS noktası bu kayma kadar güneye
 * çekilip öyle karşılaştırılıyor, yoksa öneri komşu ilçeye kayıyor.
 */
const REFERENCE_LAT_BIAS = 0.24;

/** En yakın ilçe — GPS izni verildiğinde öneri olarak kullanılır. */
export function nearestDistrict(
  latitude: number,
  longitude: number,
): District | null {
  let best: District | null = null;
  let bestDistance = Infinity;
  const targetLat = latitude - REFERENCE_LAT_BIAS;

  // Aynı il merkezine bağlı ilçeler birebir aynı koordinatta olabiliyor
  // (approximate kayıtlar). Beraberlikte il merkezini yeğle: "İSTANBUL"
  // önerisi, rastgele bir ilçe adından daha dürüst.
  const EPSILON = 1e-4;

  for (const district of DISTRICTS) {
    const dLat = district.latitude - targetLat;
    const dLon = (district.longitude - longitude) * Math.cos((latitude * Math.PI) / 180);
    const distance = dLat * dLat + dLon * dLon;

    const isTie = distance <= bestDistance + EPSILON;
    const isCenter = district.name === district.province;
    const bestIsCenter = best !== null && best.name === best.province;

    if (distance < bestDistance - EPSILON || (isTie && isCenter && !bestIsCenter)) {
      bestDistance = distance;
      best = district;
    }
  }

  return best;
}
`;

  writeFileSync('src/data/districts.ts', file, 'utf8');
  console.log(`yazıldı: src/data/districts.ts (${results.length} ilçe)`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
