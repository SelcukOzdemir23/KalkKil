# Değişiklikler

Biçim: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/),
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [0.2.0] — 2026-11-07

Arayüz baştan kuruldu. İşlev aynı; görsel kimlik, tipografi ve gezinme değişti.

### Değişti

- **Tipografi:** Alegreya (serif) tamamen kaldırıldı. Başlık ve gövde **Archivo**,
  bütün sayılar ve küçük etiketler **IBM Plex Mono**. Sayılar mono olduğu için
  saatler alt alta aynı genişlikte duruyor.
- **Palet:** krem kâğıt + kızıl yerine soğuk taş-yeşil zemin + **çini yeşili**
  vurgu. Köşe yarıçapları 12–26'dan 2–8'e indi; düğümler yuvarlak değil kare.
- **Alt gezinme ikonsuz:** üç sütun mono etiket, seçili sekmede üst çizgi.
- **Gün Çizgisi** cetvel gibi okunuyor: çift saatler mono numaralı, çentikler
  eksenin soluna uzanıyor.
- **Kıble:** derece mono ölçüm ölçeğinde, iğne kadran kenarına kadar uzanıyor,
  yön adı etiket ölçeğinde.
- Ana ekrandaki selamlama ve "Diyanet yöntemi" altlığı kaldırıldı; ekranın üst
  hattı artık yer + tarih.

### Düzeltildi

- `fontVariant: ['tabular-nums']` Android'de özel fontu eziyordu; sayılar mono
  yerine Archivo'da çiziliyordu. Kaldırıldı.
- **GPS belirgin şekilde hızlandı:** kaba (ağ) ve hassas (GPS) konum istekleri
  artık **paralel** yarışıyor, ilk cevap veren kullanılıyor. Önceki sürüm önce
  6 sn kaba konumu bekliyordu. Ölçüm: soğuk açılışta onboarding ~4 sn'den
  ~2 sn'nin altına indi.
- Ayarlar'daki "GPS" düğmesi "Yenile" oldu ve sabit `borderRadius: 12` yerine
  tema yarıçapını kullanıyor.
- İlçe adı il adıyla aynıysa ana ekranda "İSTANBUL, İSTANBUL" yazmıyor.

### Kaldırıldı

- Alegreya font dosyaları (5 adet), lucide tab ikonları, ana ekran altlığı.

## [0.1.0] — 2026-11-07

İlk çalışan sürüm. Play Store'a yüklenmez; imzalı APK GitHub Releases ile
dağıtılacak.

### Eklendi

- Diyanet yöntemiyle cihazda hesaplanan vakitler; kerahat pencereleri.
- 1076 ilçelik konum listesi. Koordinatlar Diyanet'in yayınladığı saatlerden
  en küçük karelerle çözüldü; eğitim penceresinde ±1 dk, pencere dışında ±2 dk.
- Tek ekranlık onboarding: GPS kendiliğinden ilçeyi önerir ve o ilçenin bugünkü
  vakitlerini gösterir; tek dokunuşla başlanır. Ne GPS ne bildirim izni akışı
  bekletir.
- GPS önerisindeki sistematik enlem kayması düzeltildi (12 gerçek noktada
  doğru il: 1/12 → 10/12).
- **Gün Çizgisi**: günü dikey, zamanla orantılı eksen olarak gösteren ana ekran.
- Bildirimler: vakit bazında aç/kapa, 5/15/30 dk önce, 7 günlük yuvarlanan plan.
- Android widget: `Chronometer` ile canlı geri sayım, `AlarmManager` ile vakit
  geçişi. Kalıcı bildirim ve foreground servis yok.
- Kıble pusulası; hizalanma titreşimi.
- Gün doğumu/gün batımına göre otomatik açık-karanlık tema.
- Tasarım sistemi: palet, tipografi ölçeği, `ui/` primitifleri, `docs/DESIGN.md`.
- Test altyapısı ve CI: 84 test, typecheck, lint.
- GitHub Release iş akışı; imza doğrulaması (`apksigner`).

### Kaldırıldı

- NativeWind/Tailwind (hiç kullanılmıyordu).
- Foreground servis ve kalıcı bildirim.
- OpenStreetMap Nominatim ile ters geocode: gizlilik vaadiyle çelişiyordu.
- Kart tabanlı eski arayüzler, kullanılmayan bileşenler ve ölü veri dosyaları.

### Bilinen eksikler

- Release imzalaması için gerçek keystore gerekli ([docs/RELEASE.md](docs/RELEASE.md)).
- Koordinat çözümü tek mevsimlik pencereye dayanıyor; yazın sapma büyüyebilir.
- Namaz takibi, hicri tarih, ezan sesi v2'ye bırakıldı.
