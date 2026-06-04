import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for synchronous reads
const cache = new Map<string, string>();

const KEYS = {
  LATITUDE: 'location.latitude',
  LONGITUDE: 'location.longitude',
  CITY: 'location.city',
  USE_MANUAL_CITY: 'location.useManual',
  NOTIFICATIONS_ENABLED: 'settings.notifications',
  NOTIFICATION_TIMING: 'settings.notifTiming',
  NOTIFICATION_FAJR: 'settings.notifFajr',
  NOTIFICATION_SUNRISE: 'settings.notifSunrise',
  NOTIFICATION_DHUHR: 'settings.notifDhuhr',
  NOTIFICATION_ASR: 'settings.notifAsr',
  NOTIFICATION_MAGHRIB: 'settings.notifMaghrib',
  NOTIFICATION_ISHA: 'settings.notifIsha',
  THEME_MODE: 'settings.theme',
  PRAYER_MODE: 'settings.prayerMode',
  CACHED_PRAYER_TIMES: 'cache.prayerTimes',
  CACHED_DATE: 'cache.date',
  LOCATION_PERMISSION: 'permissions.location',
} as const;

/**
 * Must be called once at app startup before any storage reads.
 * Loads all persisted data into the in-memory cache.
 */
export async function initializeStorage(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        cache.set(key, value);
      }
    }
  } catch {
    // Silently fail — cache stays empty, defaults will be used
  }
}

// ─── Sync readers (from in-memory cache) ───

export function getString(key: string): string | undefined {
  return cache.get(key);
}

export function getNumber(key: string): number | undefined {
  const val = cache.get(key);
  if (val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

export function getBoolean(key: string): boolean | undefined {
  const val = cache.get(key);
  if (val === undefined) return undefined;
  return val === 'true';
}

// ─── Async writers (cache + persist) ───

export async function setValue(key: string, value: string | number | boolean): Promise<void> {
  const strVal = String(value);
  cache.set(key, strVal);
  try {
    await AsyncStorage.setItem(key, strVal);
  } catch {
    // Silently fail
  }
}

export async function removeValue(key: string): Promise<void> {
  cache.delete(key);
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

// ─── App-specific helpers ───

export function saveLocation(lat: number, lng: number, city?: string): void {
  cache.set(KEYS.LATITUDE, String(lat));
  cache.set(KEYS.LONGITUDE, String(lng));
  if (city) {
    cache.set(KEYS.CITY, city);
  }
  // Fire-and-forget persist
  AsyncStorage.setItem(KEYS.LATITUDE, String(lat)).catch(() => {});
  AsyncStorage.setItem(KEYS.LONGITUDE, String(lng)).catch(() => {});
  if (city) {
    AsyncStorage.setItem(KEYS.CITY, city).catch(() => {});
  }
}

export function getLocation(): {latitude: number; longitude: number; city?: string} | null {
  const lat = getNumber(KEYS.LATITUDE);
  const lng = getNumber(KEYS.LONGITUDE);
  if (lat === undefined || lng === undefined) {
    return null;
  }
  return {
    latitude: lat,
    longitude: lng,
    city: getString(KEYS.CITY),
  };
}

export function getPrayerMode(): boolean {
  return getBoolean(KEYS.PRAYER_MODE) ?? false;
}

export function setPrayerMode(enabled: boolean): void {
  setValue(KEYS.PRAYER_MODE, enabled);
}

export function getNotificationsEnabled(): boolean {
  const val = getBoolean(KEYS.NOTIFICATIONS_ENABLED);
  return val === undefined ? true : val;
}

export function setNotificationsEnabled(enabled: boolean): void {
  setValue(KEYS.NOTIFICATIONS_ENABLED, enabled);
}

export function getNotificationTiming(): number {
  const raw = getString(KEYS.NOTIFICATION_TIMING);
  // Handles both old format ("5min") and new format ("5")
  if (raw !== undefined) {
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 0) return num;
  }
  return 5;
}

export function setNotificationTiming(minutes: number): void {
  setValue(KEYS.NOTIFICATION_TIMING, minutes);
}

const PRAYER_TOGGLE_KEYS: Record<string, string> = {
  fajr: KEYS.NOTIFICATION_FAJR,
  sunrise: KEYS.NOTIFICATION_SUNRISE,
  dhuhr: KEYS.NOTIFICATION_DHUHR,
  asr: KEYS.NOTIFICATION_ASR,
  maghrib: KEYS.NOTIFICATION_MAGHRIB,
  isha: KEYS.NOTIFICATION_ISHA,
};

export function getPrayerNotificationEnabled(prayerName: string): boolean {
  const key = PRAYER_TOGGLE_KEYS[prayerName];
  if (!key) return true;
  return getBoolean(key) ?? true;
}

export function setPrayerNotificationEnabled(prayerName: string, enabled: boolean): void {
  const key = PRAYER_TOGGLE_KEYS[prayerName];
  if (key) setValue(key, enabled);
}

export function getThemeMode(): 'light' | 'dark' | 'system' {
  const val = getString(KEYS.THEME_MODE);
  if (val === 'light' || val === 'dark' || val === 'system') {
    return val;
  }
  return 'system';
}

export function setThemeMode(mode: 'light' | 'dark' | 'system'): void {
  setValue(KEYS.THEME_MODE, mode);
}

export function saveCachedPrayerTimes(times: Record<string, string>, date: string): void {
  cache.set(KEYS.CACHED_PRAYER_TIMES, JSON.stringify(times));
  cache.set(KEYS.CACHED_DATE, date);
  AsyncStorage.setItem(KEYS.CACHED_PRAYER_TIMES, JSON.stringify(times)).catch(() => {});
  AsyncStorage.setItem(KEYS.CACHED_DATE, date).catch(() => {});
}

export function getCachedPrayerTimes(): {times: Record<string, string>; date: string} | null {
  const timesStr = getString(KEYS.CACHED_PRAYER_TIMES);
  const date = getString(KEYS.CACHED_DATE);
  if (!timesStr || !date) {
    return null;
  }
  try {
    return {times: JSON.parse(timesStr), date};
  } catch {
    return null;
  }
}

export function setLocationPermissionGranted(granted: boolean): void {
  setValue(KEYS.LOCATION_PERMISSION, granted);
}

export function getLocationPermissionGranted(): boolean {
  return getBoolean(KEYS.LOCATION_PERMISSION) ?? false;
}
