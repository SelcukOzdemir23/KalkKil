# Değişiklikler

Biçim: [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/),
Sürümleme: [Semantic Versioning](https://semver.org/lang/tr/).

## [0.1.0] — 2026-11-07

İlk çalışan sürüm. Play Store'a yüklenmez; imzalı APK GitHub Releases ile
dağıtılacak.

### Eklendi

- Diyanet yöntemiyle cihazda hesaplanan vakitler; kerahat pencereleri.
- 1076 ilçelik konum listesi. Koordinatlar Diyanet'in yayınladığı saatlerden
  en küçük karelerle çözüldü; eğitim penceresinde ±1 dk, pencere dışında ±2 dk.
- Üç adımlı onboarding: karşılama, ilçe seçimi (GPS önerisi + arama), bildirim
  izni.
- **Gün Çizgisi**: günü dikey, zamanla orantılı eksen olarak gösteren ana ekran.
- Bildirimler: vakit bazında aç/kapa, 5/15/30 dk önce, 7 günlük yuvarlanan plan.
- Android widget: `Chronometer` ile canlı geri sayım, `AlarmManager` ile vakit
  geçişi. Kalıcı bildirim ve foreground servis yok.
- Kıble pusulası; hizalanma titreşimi.
- Gün doğumu/gün batımına göre otomatik açık-karanlık tema.
- Tasarım sistemi: palet, tipografi ölçeği, `ui/` primitifleri, `docs/DESIGN.md`.
- Test altyapısı ve CI: 73 test, typecheck, lint.
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
