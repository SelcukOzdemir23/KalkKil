export const KAABA_COORDS = {
  latitude: 21.4225,
  longitude: 39.8262,
} as const;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Kullanıcının koordinatından Kâbe'ye olan açı.
 * 0° = Kuzey, 90° = Doğu, 180° = Güney, 270° = Batı.
 */
export function calculateQiblaBearing(
  latitude: number,
  longitude: number,
): number {
  const lat1 = toRad(latitude);
  const lng1 = toRad(longitude);
  const lat2 = toRad(KAABA_COORDS.latitude);
  const lng2 = toRad(KAABA_COORDS.longitude);

  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Manyetometrenin ham x/y değerini cihaz yönüne çevirir.
 * Cihazın düz tutulduğu varsayılır (tilt telafisi yok).
 */
export function magnetometerToHeading(x: number, y: number): number {
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/**
 * Düşük geçiren filtre — pusula titremesini azaltır.
 * 360° ↔ 0° geçişini kısa yoldan ele alır.
 */
export function smoothCompass(
  rawHeading: number,
  previousHeading: number,
  alpha: number = 0.2,
): number {
  let diff = rawHeading - previousHeading;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  return (((previousHeading + alpha * diff) % 360) + 360) % 360;
}

/** Örn: "Kuzeydoğu" — kısaltma yerine okunur ad. */
export function bearingToCardinalName(degrees: number): string {
  const names = [
    'Kuzey',
    'Kuzeydoğu',
    'Doğu',
    'Güneydoğu',
    'Güney',
    'Güneybatı',
    'Batı',
    'Kuzeybatı',
  ];
  return names[Math.round(degrees / 45) % 8];
}

