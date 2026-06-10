# Settings Redesign + Qibla Finder — Specification

> **Date:** 2025-06-10
> **Status:** Approved for implementation
> **Author:** Buffy (after user interview)

---

## 1. Overview

Radical redesign of the Settings screen with improved UI/UX, a new Qibla compass section, and a cleaned-up README.

### Goals
- Deliver a premium, modern settings experience that matches the app's minimalist identity
- Add a functional Qibla direction finder with compass + map
- Keep the information architecture focused and uncluttered
- Update README to be clean and professional

### Non-Goals
- No expand/collapse animations in settings (all sections visible on scroll)
- No new features beyond those specified (no manual city selection, no theme switching, no hijri calendar for now)
- No changes to HomeScreen or other parts of the app

---

## 2. Design Language

### Color Palette (Shift to Navy/Deep Blue)

| Token | Current Value | New Value | Usage |
|-------|--------------|-----------|-------|
| `background` | `#101612` (koyu yeşil) | `#0D111F` (lacivert) | App background |
| `surface` | `#17201A` | `#161B2B` | Card/surface background |
| `surfaceSoft` | `#1D2A22` | `#1A2035` | Elevated surfaces |
| `surfaceMuted` | `#121A15` | `#111624` | Muted surfaces |
| `accent` | `#D6B46A` | **KEEP** `#D6B46A` | Primary accent (gold) |
| `accentSoft` | `rgba(214,180,106,0.12)` | **KEEP** | Accent background |
| `accentMuted` | `rgba(214,180,106,0.62)` | **KEEP** | Accent secondary |

> **Note:** Gold accent stays. Only the dark base colors shift from green to navy. All other tokens remain unchanged.

### Typography
- **Font:** Alegreya (— same as current)
- **Section headers:** uppercase, 11px, 700 weight, `color.textSubtle`, 2px letter-spacing
- **Row titles:** 15px, 700 weight
- **Row subtitles:** 12px, muted
- **Qibla degrees:** large monospace or bold 700

### Component Architecture

Component hierarchy for Settings:

```
SettingsScreen (ScrollView)
├── BackgroundDecoration (absolute circle)
├── PageHeader ("Ayarlar" + subtitle)
├── SectionLabel("Konum")
├── SettingsCard
│   ├── SettingsRow (location info)
│   └── ActionButton ("Konumu Güncelle")
├── SectionLabel("Kıble")
├── SettingsCard
│   └── QiblaCompassCard
│       ├── CompassCircle (animated rotation)
│       │   ├── North indicator (N)
│       │   ├── Kabe direction needle (gold/red)
│       │   └── Degree text overlay
│       ├── DirectionInfo (text: "Kıble: 157° GD")
│       └── MapMinimap (small react-native-maps view with Kabe pin)
├── SectionLabel("Bildirimler")
├── SettingsCard
│   ├── SettingsRow (main toggle: Bell/BellOff)
│   ├── Divider
│   ├── TimingSection
│   │   ├── Label ("Ne kadar önce?")
│   │   └── SegmentedChips (Vaktinde / 5dk / 15dk / 30dk)
│   ├── Divider
│   ├── SettingsRow (Namazdayım Modu toggle)
│   ├── Divider
│   ├── PrayerTogglesSection
│   │   └── ChipGrid (6 prayer chips with icons)
│   ├── Divider
│   └── TestNotificationButton
├── SectionLabel(null) — no label for last section
└── SettingsCard
    └── AboutSection
        ├── Row: "Versiyon" → "0.0.1"
        └── Row: "Hesaplama" → "Diyanet İşleri Başkanlığı"
```

---

## 3. Section: Konum (Location)

**Purpose:** Show current saved location and allow GPS refresh.

### States
| State | Handling |
|-------|----------|
| **Location saved** | Show location label (city, district). Button says "Konumu Güncelle" |
| **No location** | Show "Konum ayarlanmadı". Button says "Konum Al" |
| **Loading** | Disabled button, spinner, "Konum alınıyor…" text |
| **Error** | Alert modal with GPS error message |

### Implementation Notes
- Use existing `getLocation()`, `getLocationLabel()` from storage
- `handleRefreshLocation` already exists — reuse pattern
- Remove the subtitle text about "Her açılışta GPS aramaz" — keep it clean
- Remove the `Divider` + `ActionButton` wrapping: the action button should be INSIDE the card, styled as a full-width secondary button

---

## 4. Section: Kıble (Qibla Compass)

**Purpose:** Show the direction of the Kaaba in Mecca using the device's magnetometer.

### Technical Requirements
- **Library for compass:** `react-native-sensors` (bare RN, provides magnetometer + accelerometer streams via RxJS)
- **Library for maps:** `react-native-maps` (for the minimap)
- **Qibla calculation:** Calculate bearing from current location to Kaaba coordinates (21.4225°N, 39.8262°E) using the `adhan` library's built-in Qibla calculation or a manual formula:
  ```
  qiblaDirection = atan2(
    sin(lon_kaba - lon_user),
    cos(lat_user) * tan(lat_kaba) - sin(lat_user) * cos(lon_kaba - lon_user)
  )
  ```
  Then convert to degrees and normalize.
- **Sensor smoothing:** Apply a low-pass filter to raw magnetometer data to prevent needle jitter
- **Tilt compensation:** Use accelerometer data for tilt compensation (so compass works even if phone isn't flat)

### UI Components

#### CompassCircle
- **Size:** ~200x200dp
- **Design:** Classic compass face
  - Outer ring with N/S/E/W markers (Turkish: K/G/D/B optional? — No, keep standard N/S/E/W for compass, it's universal)
  - Tick marks every 30 or 45 degrees
  - Dark background (`surface`), gold accents
- **Rotation:** The entire compass face OR just the needle rotates based on device heading
- **Needle:** Gold/red arrow pointing to Qibla direction
- **Center dot:** Small gold circle
- **Overlay text:** Degrees (e.g., "157°")

#### DirectionInfo
- Below the compass: "Kıble: 157° Güneydoğu"
- Cardinal direction mapping: 0=N, 90=E, 180=S, 270=W

#### MapMinimap
- Small map view (maybe 150h x full-width)
- Shows user's current location + a line/arc pointing toward Mecca
- Kaaba pin at Mecca coordinates
- The map should NOT be interactive (scrollEnabled=false, zoomEnabled=false)
- Purple/gold pin for Kabe

### States
| State | Handling |
|-------|----------|
| **Location available + sensor ready** | Full compass + map showing |
| **No location** | "Kıbleyi göstermek için konum gereklidir" message |
| **Sensor unavailable** | "Cihazınız pusula desteği sağlamıyor" fallback |
| **Permission denied (location)** | "Konum izni olmadan kıble hesaplanamaz" |
| **Calibrating** | "Pusula kalibre ediliyor... Telefonu 8 şeklinde hareket ettirin" |

### Data Flow
1. Read user's saved location from storage (lat/lng)
2. Calculate Qibla bearing from current location to Kaaba
3. Subscribe to magnetometer + accelerometer via `react-native-sensors`
4. Apply low-pass filter to heading
5. Render compass with: `rotation = (qiblaBearing - deviceHeading + 360) % 360`
6. Map: show user location + Kaaba pin

---

## 5. Section: Bildirimler (Notifications)

**Purpose:** Full notification management.

### Sub-elements (in order)

1. **Main toggle** — Bell/BellOff icon + "Vakit bildirimleri" title + Switch
   - Turning ON: request permission if not granted
   - Turning OFF: show alert? — No, just disable silently

2. **Divider**

3. **Timing selector** — "Ne kadar önce?" label + 4 segmented chips (Vaktinde / 5dk / 15dk / 30dk)
   - Active chip: gold background (`accentSoft`) + gold border + gold text
   - Inactive chip: subtle dark background + muted text

4. **Divider**

5. **Namazdayım Modu** — Moon icon + "Namazdayım Modu" title + Switch
   - Subtitle: "Vakit girdiğinde bildirimleri 15 dk susturur"

6. **Divider**

7. **Vakit Bazında Togglelar** — 6 chip buttons in a 3x2 grid
   - Each: icon + label (İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı)
   - Icons: CloudMoon, Sunrise, Sun, Cloud, Sunset, Star
   - Active state: gold background + gold border
   - Inactive state: dark background + subtle border
   - Press: toggle individual prayer notification

8. **Divider**

9. **Test notification button** — Full-width button with bell icon
   - On press: request permission if needed → send test notification → show success alert

### States
| State | Handling |
|-------|----------|
| **Notifications ON** | Full expanded view with all options |
| **Notifications OFF** | Only the main toggle row visible — rest hidden (or very dimmed) |
| **Permission denied (first time)** | Request permission via `requestNotificationPermission()` |
| **Permission denied (blocked)** | Show alert: "Telefon ayarlarından bildirim iznini açın" |
| **All prayers enabled (default)** | All chips gold/active |

---

## 6. Section: Hakkında (About)

**Purpose:** Minimal - just show version.

### Content
- **Versiyon:** `0.0.1` (read from package.json or hardcoded)
- **Hesaplama:** `Diyanet İşleri Başkanlığı metodu`
- Maybe a small "Reklamsız · Açık Kaynak" footer text

---

## 7. Qibla Compass: Technical Details

### Kaaba Coordinates
```typescript
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
```

### Bearing Calculation
```typescript
function calculateQiblaDirection(userLat: number, userLng: number): number {
  const lat1 = toRadians(userLat);
  const lng1 = toRadians(userLng);
  const lat2 = toRadians(KAABA_LAT);
  const lng2 = toRadians(KAABA_LNG);

  const dLng = lng2 - lng1;
  const y = Math.sin(dLng);
  const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(dLng);
  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}
```

### Sensor Smoothing (Low-pass filter)
```typescript
// Alpha = 0.1-0.3 for smooth response
const filteredHeading = alpha * rawHeading + (1 - alpha) * previousFilteredHeading;
```

### Compass Rotation
The compass face stays fixed. The needle rotates:
```
needleRotation = qiblaBearing - deviceHeading;
```

Or alternatively, the compass face rotates to always show north at top, and a fixed marker shows Qibla direction. The latter is more intuitive.

**Decision:** Rotate the compass face so North = device heading. The Qibla direction is marked with a fixed golden indicator at `qiblaBearing` degrees from North.

### Map Configuration
- Provider: Google Maps (via `react-native-maps`)
- Shows user location (blue dot)
- Shows Kaaba location (custom gold pin)
- Camera centered between user and Kaaba with appropriate zoom
- Non-interactive (scrollEnabled=false, zoomEnabled=false, rotateEnabled=false)

---

## 8. README Update

### Content Structure

```markdown
# KalkKıl - Ezan Vakti

[One-line description: Minimalist, reklamsız namaz vakti uygulaması]

## Özellikler
- [Short bullet list of features]

## Başlarken
- Gereksinimler
- npm install
- npm run android / ios

## Katkıda Bulunma (optional)
## Lisans
```

**Guidelines:**
- All text in Turkish
- No English sections (remove the duplicate English content at the bottom)
- No screenshots (user will add later)
- Professional tone
- Include prerequisites and basic run commands
- Include APK build instructions
- Remove the old complete English documentation at the bottom
- Keep it to ~50-80 lines max

---

## 9. Implementation Plan

### Phase 1: Theme Update
1. Update `src/theme/tokens.ts` — change background/surface colors to navy tones
2. Verify no visual regressions on HomeScreen with new colors

### Phase 2: Settings Layout Refactor
1. Remove `SectionLabel` from Konum section subtitle
2. Move action button style to full-width secondary button
3. Ensure 4-card layout works (Konum, Kıble, Bildirimler, Hakkında)
4. Remove expand animation from notifications (not needed since no expand)
5. Clean up unused code

### Phase 3: Kıble Compass
1. Install `react-native-sensors` + `react-native-maps`
2. Create `QiblaCompass` component
3. Implement bearing calculation (`calculateQiblaDirection`)
4. Implement compass (magnetometer stream + low-pass filter)
5. Implement minimap with Kaaba pin
6. Add SectionLabel("Kıble") + SettingsCard wrapper to SettingsScreen

### Phase 4: Hakkında Section
1. Add minimal About card with version info

### Phase 5: README
1. Rewrite README.md to be clean, professional, Turkish-only

### Phase 6: Polish + Build
1. TypeScript check
2. Code review
3. Debug + Release build
4. Push

---

## 10. Packages to Install

| Package | Purpose |
|---------|---------|
| `react-native-sensors` | Magnetometer + accelerometer access for compass |
| `react-native-maps` | Map minimap for Kible section |

---

## 11. Open Questions / Future Considerations

- **Qibla calibration:** Should we add a "Kalibrasyon" prompt when sensor data is noisy? → Postponed to future
- **Haptic feedback:** When phone aligns with Qibla, should it vibrate? → Nice-to-have, add if time permits
- **Map style:** Light/dark map to match app theme? → Use dark map style for consistency
- **iOS compass permission:** iOS requires `NSLocationWhenInUseUsageDescription` for maps and Core Location for CLHeading. Already handled.
- **Multiple calculation methods:** Not requested. Diyanet only for now.
