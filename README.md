# KalkKıl — Ezan Vakti

Minimalist, reklamsız namaz vakti uygulaması. Konumunuza göre günlük namaz vakitlerini gösterir, bir sonraki vakte canlı geri sayım yapar, bildirim gönderir ve Android ana ekran widget'ı içerir.

## Özellikler

- **Namaz Vakitleri:** Diyanet yöntemiyle çevrimdışı hesaplanan 6 vakit (İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı)
- **Canlı Geri Sayım:** Bir sonraki vakte kalan süre (saniye hassasiyetinde)
- **Bildirimler:** Her vakit öncesi isteğe bağlı hatırlatma (vakit seçimi ve zamanlama ayarlanabilir)
- **Android Widget:** Ana ekranda bir sonraki vakit ve canlı geri sayım
- **Kalıcı Bildirim:** Uygulama kapalıyken bile bildirim çubuğunda vakit takibi
- **Kıble Pusulası:** Manyetik sensör ile Kâbe yönünü gösteren pusula
- **Çevrimdışı Çalışma:** Tüm vakitler `adhan` kütüphanesi ile yerel olarak hesaplanır
- **Türkçe Arayüz:** Tamamen Türkçe

## Başlarken

### Gereksinimler

- Node.js >= 18
- Android SDK (API 24+) veya Xcode 14+ (iOS)
- CocoaPods (iOS için)

### Kurulum

```bash
npm install
```

### Android'de Çalıştırma

```bash
npm run android
```

### iOS'te Çalıştırma

```bash
cd ios && pod install && cd ..
npm run ios
```

### Production Build

```bash
# Android
cd android && ./gradlew assembleRelease

# iOS
cd ios && xcodebuild -workspace KalkKil.xcworkspace -scheme KalkKil -configuration Release
```

## Proje Yapısı

```
src/
  components/      UI bileşenleri
  context/         Uygulama durumu (AppContext)
  hooks/           Custom hook'lar
  screens/         Ekranlar (HomeScreen, SettingsScreen)
  services/        Servis katmanı (prayerTimes, location, notifications, storage)
  theme/           Renk ve stil tanımları
  utils/           Yardımcı fonksiyonlar
android/
  app/src/main/java/com/kalkkil/
    widget/        Android widget (AppWidgetProvider)
    service/       Foreground servis
    bridge/        React Native ↔ Native köprüsü
```

## Lisans

MIT
