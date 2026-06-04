# Ezan Vakti - Prayer Times

Minimalist, ad-free prayer times app built with React Native. Shows daily prayer times based on your location, provides countdown to the next prayer, and includes an Android home screen widget.

## Features

- **Daily Prayer Times**: Displays all 6 prayer times (Imsak, Gunes, Ogle, Ikindi, Aksam, Yatsi) calculated offline using the Diyanet (Turkey) method
- **Countdown Timer**: Live countdown to the next prayer
- **Notifications**: Optional local notifications 5 minutes before and at each prayer time
- **Android Widget**: Home screen widget showing next prayer time and countdown
- **Dark/Light Theme**: Follows system theme or manual selection
- **Offline Support**: Prayer times are calculated locally using the `adhan` library - no internet required after initial setup
- **Turkish Localization**: All UI text in Turkish

## Tech Stack

- **React Native** 0.76 with TypeScript
- **adhan** - Offline prayer time calculation (Diyanet method)
- **@notifee/react-native** - Local notifications
- **@react-native-community/geolocation** - GPS location
- **react-native-mmkv** - Fast local storage
- **react-native-permissions** - Permission management
- **@react-navigation** - Bottom tab navigation
- **Native Kotlin** - Android widget (AppWidgetProvider)

## Project Structure

```
src/
  components/       UI components (CountdownTimer, PrayerCard, PrayerList)
  context/          AppContext (theme, notifications, location state)
  hooks/            Custom hooks (usePrayerTimes, useCountdown)
  screens/          HomeScreen, SettingsScreen
  services/         prayerTimes, location, notifications, storage, widget
  theme/            Light/dark color definitions
  utils/            Formatting utilities
android/
  app/src/main/java/com/prayertimes/
    widget/         PrayerWidgetProvider (Kotlin)
    bridge/         WidgetBridgeModule (React Native <-> Native)
```

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
