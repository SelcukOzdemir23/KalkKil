# KalkKıl - Ezan Vakti

Minimalist, reklamsız namaz vakti uygulaması. Konumunuza göre günlük namaz vakitlerini gösterir, bir sonraki vakte geri sayım yapar ve Android ana ekran widget'ı içerir.

## Özellikler

- **Günlük Namaz Vakitleri**: Diyanet yöntemiyle çevrimdışı hesaplanan 6 vakit (İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı)
- **Geri Sayım**: Bir sonraki vakte canlı geri sayım
- **Bildirimler**: Her vakit öncesi isteğe bağlı yerel bildirimler
- **Android Widget**: Ana ekranda bir sonraki vakit ve geri sayım
- **Koyu/Açık Tema**: Sistem temasını takip eder veya manuel seçim
- **Çevrimdışı Çalışma**: Tüm vakitler `adhan` kütüphanesi ile yerel olarak hesaplanır
- **Türkçe Arayüz**: Tüm UI metinleri Türkçe

## Teknik Altyapı

- **React Native** 0.76 + TypeScript
- **adhan** - Çevrimdışı namaz vakti hesaplama (Diyanet)
- **@notifee/react-native** - Yerel bildirimler
- **@react-native-community/geolocation** - GPS konumu
- **react-native-permissions** - İzin yönetimi
- **@react-navigation** - Alt sekme navigasyonu
- **Native Kotlin** - Android widget (AppWidgetProvider)

## Proje Yapısı

```
src/
  components/       UI bileşenleri (CountdownTimer, PrayerCard, PrayerList)
  context/          AppContext (tema, bildirim, konum durumu)
  hooks/            Custom hook'lar (usePrayerTimes, useCountdown)
  screens/          HomeScreen, SettingsScreen
  services/         prayerTimes, location, notifications, storage, widget
  theme/            Açık/koyu renk tanımları
  utils/            Biçimlendirme araçları
android/
  app/src/main/java/com/kalkkil/
    widget/         PrayerWidgetProvider (Kotlin)
    bridge/         WidgetBridgeModule (React Native <-> Native)
```

## Başlarken

### Gereksinimler

- Node.js >= 18
- Android SDK (API 24+)
- Xcode 14+ (iOS için)
- CocoaPods (iOS için)

### Bağımlılıkları Yükleme

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

### Metro Bundler'ı Başlatma

```bash
npm start
```

## Android Widget

Ana ekran widget'ı şunları gösterir:
- Bir sonraki vakit adı ve saati
- Canlı geri sayım
- Tüm günlük vakitler (kompakt formatta)

### Widget Ekleme

1. Ana ekranda boş bir alana uzun basın
2. "Widget'lar" seçin
3. "KalkKıl" widget'ını bulun
4. Ana ekrana sürükleyip bırakın

Widget, uygulama her açıldığında otomatik güncellenir. Ayrıca sistem AppWidgetProvider üzerinden her 30 dakikada bir yenilenir.

### Widget Mimarisi

- **PrayerWidgetProvider.kt** - Widget yaşam döngüsünü yönetir (onUpdate, onEnabled)
- **WidgetBridgeModule.kt** - React Native native module, namaz vakitlerini SharedPreferences'e yazar ve widget güncellemesini tetikler
- **widget_prayer_times.xml** - Widget için RemoteViews layout'u

## Bildirimler

Aktif edildiğinde (varsayılan: açık), uygulama yerel bildirimler planlar:
- Her vaktin 5 dakika öncesi
- Vakit tam girdiğinde

Bildirimler Ayarlar ekranından açılıp kapatılabilir.

## Namaz Vakti Hesaplama

Vakitler `adhan` kütüphanesi ile **Türkiye (Diyanet)** hesaplama yöntemi kullanılarak hesaplanır:
- İmsak açısı: 18 derece
- Yatsı açısı: 17 derece
- İkindi: Standart (Şafii)

Uygulama, konumunuza göre vakit hesaplamak için konum izni ister. İzin verilmezse hata mesajı gösterilir.

## Bilinen Sınırlamalar

- iOS widget henüz yok (MVP kapsamı dışı)
- Manuel şehir seçimi henüz yok (sadece GPS)
- Hicri takvim henüz desteklenmiyor
- Sadece Türkçe dil desteği

## Production Build

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

```bash
cd ios
xcodebuild -workspace KalkKil.xcworkspace -scheme KalkKil -configuration Release
```

## Lisans

MIT


## Getting Started

### Prerequisites

- Node.js >= 18
- Android SDK (API 24+)
- Xcode 14+ (for iOS)
- CocoaPods (for iOS)

### Install Dependencies

```bash
npm install
```

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
cd ios && pod install && cd ..
npm run ios
```

### Start Metro Bundler

```bash
npm start
```

## Android Widget

The app includes a home screen widget that shows:
- Next prayer name and time
- Live countdown
- All daily prayer times in compact format

### Adding the Widget

1. Long-press on an empty area of your home screen
2. Select "Widgets"
3. Find "Ezan Vakti" widget
4. Drag and drop to your home screen

The widget updates automatically when the app is opened. It also refreshes every 30 minutes via the system's AppWidgetProvider.

### Widget Architecture

- **PrayerWidgetProvider.kt** - Handles widget lifecycle (onUpdate, onEnabled)
- **WidgetBridgeModule.kt** - React Native native module that writes prayer data to SharedPreferences and triggers widget updates
- **widget_prayer_times.xml** - RemoteViews layout for the widget

## Notifications

When enabled (default: on), the app schedules local notifications:
- 5 minutes before each prayer time
- At the exact prayer time

Notifications can be toggled from the Settings screen.

## Prayer Time Calculation

Prayer times are calculated using the `adhan` library with the **Turkey (Diyanet)** calculation method. This method uses:
- Fajr angle: 18 degrees
- Isha angle: 17 degrees
- Asr: Standard (Shafi'i)

The app requires location permission to calculate times for your area. If permission is denied, you'll see an error message.

## Known Limitations

- iOS widget not implemented (MVP scope)
- Manual city selection not yet available (GPS only)
- Hijri calendar not yet supported
- Only Turkish language

## Build for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

```bash
cd ios
xcodebuild -workspace PrayerTimes.xcworkspace -scheme PrayerTimes -configuration Release
```

## License

MIT
