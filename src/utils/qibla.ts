/**
 * Kıble yönü hesaplama araçları.
 *
 * Kâbe koordinatları: 21.4225°N, 39.8262°E
 * Kullanıcının konumuna göre Kâbe'ye olan açıyı (bearing) hesaplar.
 * Ayrıca magnetometer'dan gelen ham veriyi heading'e çevirir.
 */

export const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
};

/**
 * Kullanıcının bulunduğu koordinattan Kâbe'ye olan açıyı (bearing) derece cinsinden hesaplar.
 * 0° = Kuzey, 90° = Doğu, 180° = Güney, 270° = Batı
 *
 * Formül: Haversine bearing formülü
 */
export function calculateQiblaBearing(
  userLat: number,
  userLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(userLat);
  const lng1 = toRad(userLng);
  const lat2 = toRad(KAABA_COORDS.latitude);
  const lng2 = toRad(KAABA_COORDS.longitude);

  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Magnetometer'dan gelen ham x, y, z değerlerini cihazın baş yönüne (heading) çevirir.
 * 0° = Kuzey, 90° = Doğu, 180° = Güney, 270° = Batı
 *
 * Not: Bu basit dönüşüm cihazın düz (flat) tutulduğunu varsayar.
 * Tilt compensation için accelerometer verisi de gerekir — MVP'de atlanabilir.
 */
export function magnetometerToHeading(x: number, y: number): number {
  const heading = Math.atan2(y, x) * (180 / Math.PI);
  return (heading + 360) % 360;
}

/**
 * Pusula verisine low-pass filter uygulayarak titreşimi (jitter) azaltır.
 *
 * @param alpha Smoothing faktörü (0-1). Düşük = daha yumuşak, yüksek = daha hızlı tepki.
 *   Önerilen: 0.15 - 0.3
 */
export function smoothCompass(
  rawHeading: number,
  previousHeading: number,
  alpha: number = 0.2,
): number {
  // 360° geçişini düzgün işle (örn: 359° → 0°)
  let diff = rawHeading - previousHeading;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  return (((previousHeading + alpha * diff) % 360) + 360) % 360;
}

/**
 * Açıyı kardinal yön metnine çevirir.
 * 0° = K (Kuzey), 90° = D (Doğu), 180° = G (Güney), 270° = B (Batı)
 */
export function bearingToCardinal(degrees: number): string {
  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

/**
 * Kıble yönünü okunabilir metin olarak döndürür.
 * Örn: "157° Güneydoğu"
 */
export function formatQiblaDirection(degrees: number): string {
  const cardinal = bearingToCardinal(degrees);
  return `${Math.round(degrees)}° ${cardinal}`;
}
