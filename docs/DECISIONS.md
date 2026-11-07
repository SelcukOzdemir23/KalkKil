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

**Koordinatlar nereden geldi.** Açık kaynaklarda ilçe koordinatı yok
(`turkiyeapi.dev` yalnızca il merkezini veriyor). Bu yüzden her ilçenin
koordinatı Diyanet'in o ilçe için yayınladığı saatlerden en küçük kareler ile
geri çözüldü: öğle vakti boylamı neredeyse tek başına belirliyor (4 dk/derece),
enlem ise 30 günlük pencerede farklı vakitlerden kestiriliyor.

- 868 ilçe çözüldü. Eğitim penceresinde 867'si ±1 dk, en kötüsü 2 dk.
- Aşırı-uyum kontrolü (ilk yarı ile eğit, ikinci yarıda test): medyan 1 dk,
  en kötü 2 dk.
- Kalan 208 ilçe (ör. İstanbul'da Kadıköy) Diyanet tarafından yayınlanmıyor;
  il merkezi koordinatına bağlandılar ve `approximate` ile işaretlendiler.
  Uydurma koordinat üretmektense dürüst olan bu.

Bilinen sınır: çözüm tek mevsimlik pencereye dayanıyor. Yazın sapma büyüyebilir;
yeni bir pencere toplandığında `tools/build-districts.mjs` tekrar çalıştırılıp
testler güncellenmeli.

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

## 6. Tasarım sistemi: tek tema, güneşe göre açık/karanlık

**Karar.** Arayüz "almanak" diline geçti: kâğıt zemin, mürekkep metin, tek
kızıl vurgu (elyazması geleneğindeki rubrik). Palet `src/theme/palette.ts`,
ölçekler `src/theme/tokens.ts`. Ekranlar ham renk/ölçü yazmaz; `src/ui/`
primitifleri (`Text`, `Surface`, `Divider`) ve `useTheme()` kullanır.

**Tema seçimi otomatik.** Gün doğumu–gün batımı arası açık, dışı karanlık
(`src/theme/sun.ts`, test edilmiş). Kullanıcı seçimi yok: v1'de tek kural.

**İmza bileşen.** `features/prayer-times/DayTimeline.tsx` — günü **dikey ve
zamanla orantılı** eksen olarak gösterir.

İlk deneme yatay bir şeritti; altı vakit etiketi sığmadığı için etiketler iki
satıra kaçırılıyordu. Bu bir tasarım değil, çakışma yamasıydı. Dikey eksende
sıkışma yok ve aralıklar gerçek zamana orantılı olduğu için günün yapısı
(imsak–güneş kısa, güneş–öğle uzun) doğrudan okunuyor. Uzun boşluklar "boşluk"
gibi görünmesin diye saate çentikleri eklendi. Kerahat aralıkları ince şerit;
düğümleri yutan geniş bant denemesi bırakıldı.

**Tipografi.** Başlıklar Alegreya, gövde ve zaman değerleri sistem sansı.
Zamanlar `tabular-nums`: geri sayım akarken metin zıplamaz.

**Bilinen geçiş borcu.** `QiblaScreen` ve `SettingsScreen` yeni temaya ve
palete bağlandı ve yeniden tasarlandı; eski `AppText` yardımcısı ve `Surface`
kartı bu geçişte silindi. `ui/` kümesi artık `Text`, `Divider`, `Chip`,
`Button`, `EmptyState`.

---

## 7. Arayüz metinleri ve palet disiplini

**Palet.** Açık tema "sıcak krem + pas kızılı" ailesine kayma riski taşıyor;
bu, mobil uygulamalarda en sık görülen yapay zekâ varsayılanı. Kızıl, elyazması
almanaklarındaki rubrik geleneğinden geliyor ve gerekçelendirilebilir, ama
zemin bilinçli olarak **nötr-taş** tarafında (#F3F1EB) tutuldu. Paleti
değiştirirken bu dengeyi koru.

**Metin kuralları.** Türkçe cümle düzeni kullanılır ("İyi günler", "Namazdayım
modu"); her kelimeyi büyütmek yok. Ekranlarda ham koordinat, sürüm numarası
gibi geliştirici bilgisi gösterilmez. Emoji yerine `lucide-react-native` ikonu
kullanılır; simge ailesi tek.

**Boş ve hata durumları.** Boş ekran bırakılmaz: `ui/EmptyState` ne olduğunu ve
ne yapılacağını söyler.

---

## 8. İlk açılış: tek ekran, kanıt olarak vakitler

**Sorun.** Üç adımlı akış (karşılama → ilçe → bildirim) hem yavaş hem boştu:
her adım "Devam" istiyordu, ilk ekran bilgi taşımıyordu ve GPS beklerken
ekran kilitleniyordu.

**Karar.** Onboarding tek ekran. GPS kendiliğinden denenir; kullanıcı beklemez
("İlçeyi kendim seçeceğim" her an açık, geç dönen GPS sonucu kullanıcının
seçimini ezmez). Bildirim izni `await` edilmez: istek başlatılır, geçiş hemen
yapılır. Seçim yapılır yapılmaz o ilçenin bugünkü altı vakti listelenir —
kurulumun ortasında ürünün çıktısı görünür.

**GPS önerisindeki sistematik kayma.** Çözülen koordinatlar Diyanet'in referans
noktası; coğrafi merkezlerin ~0.24° güneyine düşüyorlar. En yakın ilçe
araması bu kaymayı düzeltmezse İstanbul'un tamamı SULTANGAZİ'ye, Çankaya
KAHRAMANKAZAN'a düşüyordu. Ölçülen GPS noktası aynı kayma kadar güneye
çekilerek karşılaştırılıyor (`REFERENCE_LAT_BIAS`): 12 gerçek noktada doğru il
sayısı 1/12'den 10/12'ye çıktı; kalan ikisi aynı ilde komşu ilçe.

**İlçe adı yerine il merkezi.** Diyanet'in yayınlamadığı ilçeler (Kadıköy
dahil) il merkezi koordinatına bağlı. Aynı koordinatı paylaşan kayıtlarda
beraberliği il merkezine vermek, rastgele bir ilçe adı göstermekten dürüst:
kullanıcı "İSTANBUL" görür ve gerekirse "Değiştir" ile kendi ilçesini seçer.

---

## 5. Dağıtım: APK, mağazasız

Uygulama Play Store'a yüklenmeyecek; imzalı APK GitHub Releases üzerinden
yayınlanacak. Sonuçları:

- Android `USE_EXACT_ALARM` izni kullanılabiliyor (tam zamanlı bildirim).
- Play'in `targetSdk` dayatması yok; yine de `targetSdk 34` güncellenmeli.
- Release derlemesi hâlâ debug anahtarıyla imzalanıyor; gerçek keystore ve
  imzalama adımı **yayın öncesi zorunlu**.
