/**
 * Tema, güneşe göre seçilir: gün doğumu ile gün batımı arası kâğıt (açık),
 * dışı mürekkep (karanlık). Uygulama açıkken gece yarısını geçmek için
 * periyodik olarak yeniden değerlendirilir.
 */

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

/**
 * Verilen anda gece mi?
 *
 * Vakitler henüz hesaplanmadıysa açık tema kalır — ilk açılışta ekranın
 * karanlığa düşüp sonra aydınlanması rahatsız edici olurdu.
 */
export function isNightAt(
  sunTimes: SunTimes | null,
  now: Date,
): boolean {
  if (!sunTimes) {
    return false;
  }
  const at = now.getTime();
  return at < sunTimes.sunrise.getTime() || at >= sunTimes.sunset.getTime();
}
