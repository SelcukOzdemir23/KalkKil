# Kararlar

Bu dosya, geri dönülmesi pahalı olan kararları ve dayandıkları ölçümleri tutar.
Yeni bir karar eklerken tarih, bağlam ve sonucu yazın.

---

## 1. Vakitler cihazda hesaplanır, ilçe koordinatına çapalanır

**Karar.** Vakitler `adhan` kütüphanesiyle cihazda hesaplanır. Konum modeli GPS
değil **ilçedir**: kullanıcı 973 ilçeden birini seçer (GPS yalnızca öneri sunar),
vakitler o ilçenin Diyanet referans koordinatından hesaplanır.

**Ölçüm (03.11.2026, Diyanet'in yayınladığı saatlerle):**

| Koordinat | Sapma |
|---|---|
| İlçenin kendi referans noktası | 0 – 1 dk |
| İl merkezi koordinatı | ±2 dk |
| Yanlış şehir (ör. İstanbul ↔ Kars) | ~59 dk |

Sonuç: yöntem (açılar + temkin payları) zaten doğru, hata **koordinatta**. Bu
yüzden Diyanet'in 365 günlük tablosunu gömmek (≈4 MB) gerekmiyor; ~70 KB'lık
ilçe koordinatı yeterli.

**Kazançlar.** Çevrimdışı çalışır. Dış servise koordinat gitmez (reverse geocode
olarak Nominatim kullanımı kaldırılacak). Yıllık tablo güncellemesi gerekmez.
Diyanet verisi yeniden dağıtılmış olmaz.

**Doğrulama.** `__tests__/domain/diyanet.test.ts` — her fixture için tüm
vakitler ±1 dk içinde olmalı. Hesap parametrelerine dokunan her değişiklik bu
testi geçmek zorunda.

---

## 2. Widget canlı sayacı `Chronometer` ile, kalıcı bildirim olmadan

**Bağlam.** Mevcut widget'ın canlı geri sayımı `PrayerForegroundService`'e bağlı:
servis her saniye dönüp hem bildirimi hem widget'ı güncelliyor. Kalıcı bildirimi
kaldırınca widget da ölüyor. Ayrıca widget verisi JS'ten geliyor; uygulama iki gün
açılmazsa widget boşalıyor.

**Karar.** Widget sayacı `RemoteViews` içinde `Chronometer`
(`setCountDown` + `setBase`) kullanır; sayaç Android tarafında akar, servis
çalışmaz. Vakit geçişinde `AlarmManager` ile widget bir sonraki vakte çevrilir.
Kalıcı bildirim ve foreground service kaldırılır.

**Sonuç.** Pil tüketimi düşer, kalıcı bildirim gitmiş olur, widget uygulama hiç
açılmasa da doğru kalır.

**Uygulandı.** `PrayerForegroundService` silindi; `FOREGROUND_SERVICE*` izinleri
kaldırıldı. Widget 7 günlük planı JS'ten tek seferde alır (`syncSchedule`),
sayacı `Chronometer` çizer, vakit geçişinde `AlarmManager` alarmı widget'ı çevirir.
`BootReceiver` reboot sonrası Chronometer base'ini yeniden hesaplar.

---

## 3. Tek stil yolu: `src/theme/tokens.ts` + `StyleSheet`

**Bağlam.** Projede NativeWind/Tailwind kuruluydu (Babel preset, Metro sarmalayıcı,
`global.css`, tailwind config, `react-native-css-interop` yaması) ama hiçbir ekran
`className` kullanmıyordu; stiller inline objelerle yazılıyordu. İki sistem yarım
yarım duruyordu.

**Karar.** NativeWind tamamen kaldırıldı. Tasarım değerleri tek yerde
(`tokens.ts`), bileşen stilleri `StyleSheet` ile.

---

## 4. Test ve CI zorunlu

`npm run typecheck`, `npm run lint -- --quiet`, `npm test` ve Android derlemesi
CI'da çalışır (`.github/workflows/ci.yml`). Vakit hesabı, kerahat, bildirim
planlama gibi "sessizce yanlış olabilecek" mantık domain katmanında ve
testlidir. UI testleri tasarım yenilendiğinde eklenecek.

---

## 5. Dağıtım: APK, mağazasız

Uygulama Play Store'a yüklenmeyecek; imzalı APK GitHub Releases üzerinden
yayınlanacak. Sonuçları:

- Android `USE_EXACT_ALARM` izni kullanılabiliyor (tam zamanlı bildirim).
- Play'in `targetSdk` dayatması yok; yine de `targetSdk 34` güncellenmeli.
- Release derlemesi hâlâ debug anahtarıyla imzalanıyor; gerçek keystore ve
  imzalama adımı **yayın öncesi zorunlu**.
