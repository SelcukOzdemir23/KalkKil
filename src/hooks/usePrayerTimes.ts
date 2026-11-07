import {useState, useEffect, useCallback} from 'react';
import {
  DailyTimes,
  PrayerEntry,
  buildEntries,
  calculateDailyTimes,
  computeKerahatWindows,
  deserializeTimes,
  findLastPassedIndex,
  findNextEntry,
  isSameDay,
  serializeTimes,
} from '../domain/prayer';
import {getDateKey} from '../utils/format';
import {getLocation, saveCachedPrayerTimes, getCachedPrayerTimes} from '../services/storage';
import {useAppContext} from '../context/AppContext';

interface UsePrayerTimesResult {
  entries: PrayerEntry[];
  nextPrayer: PrayerEntry | null;
  currentIndex: number;
  dailyTimes: DailyTimes | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

type StoredLocation = {latitude: number; longitude: number};

function sameLocation(a: StoredLocation, b: StoredLocation): boolean {
  // Kaba eşitlik yeterli: önbellek yalnızca aynı ilçe için geçerli olmalı.
  return (
    Math.abs(a.latitude - b.latitude) < 1e-3 &&
    Math.abs(a.longitude - b.longitude) < 1e-3
  );
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [entries, setEntries] = useState<PrayerEntry[]>([]);
  const [dailyTimes, setDailyTimes] = useState<DailyTimes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const {refreshKey: contextRefreshKey, setKerahatWindows, setSunTimes} =
    useAppContext();

  const refresh = useCallback(() => {
    setLocalRefresh(k => k + 1);
  }, []);

  /** Önbellek aynı gün + aynı konum için geçerliyse onu, değilse yeni hesap. */
  const timesForDate = useCallback(
    (date: Date, location: StoredLocation): DailyTimes => {
      const dateKey = getDateKey(date);
      const cached = getCachedPrayerTimes();
      if (cached && cached.date === dateKey && sameLocation(cached, location)) {
        const restored = deserializeTimes(cached.times);
        if (restored) {
          return restored;
        }
      }

      const times = calculateDailyTimes(location.latitude, location.longitude, date);
      saveCachedPrayerTimes(
        serializeTimes(times),
        dateKey,
        location.latitude,
        location.longitude,
      );
      return times;
    },
    [],
  );

  const publish = useCallback(
    (times: DailyTimes, nextEntries: PrayerEntry[]) => {
      setDailyTimes(times);
      setKerahatWindows(computeKerahatWindows(times));
      setSunTimes({sunrise: times.sunrise, sunset: times.sunset});
      setEntries(nextEntries);
      setError(null);
    },
    [setKerahatWindows, setSunTimes],
  );

  const loadPrayerTimes = useCallback(() => {
    setIsLoading(true);
    const location = getLocation();
    if (!location) {
      setError('Konum bilgisi bulunamadı. Ayarlardan konum seçin.');
      setEntries([]);
      setDailyTimes(null);
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const todayTimes = timesForDate(now, location);
    const todayEntries = buildEntries(todayTimes, now);

    if (findNextEntry(todayEntries)) {
      publish(todayTimes, todayEntries);
      setIsLoading(false);
      return;
    }

    // Yatsıdan sonra: aynı ekran açılışında yarının İmsak vaktine geç.
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = timesForDate(tomorrow, location);
    publish(tomorrowTimes, buildEntries(tomorrowTimes, now));
    setIsLoading(false);
  }, [publish, timesForDate]);

  useEffect(() => {
    try {
      loadPrayerTimes();
    } catch {
      setError('Vakitler hesaplanırken hata oluştu');
      setIsLoading(false);
    }
  }, [contextRefreshKey, localRefresh, loadPrayerTimes]);

  useEffect(() => {
    if (!dailyTimes) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const updated = buildEntries(dailyTimes, now);

      // Gün değiştiyse veya gösterilen günün tüm vakitleri geçtiyse baştan yükle.
      if (!findNextEntry(updated) || !isSameDay(now, dailyTimes.fajr)) {
        loadPrayerTimes();
        return;
      }

      setEntries(updated);
    }, 15_000);

    return () => clearInterval(interval);
  }, [dailyTimes, loadPrayerTimes]);

  return {
    entries,
    nextPrayer: findNextEntry(entries),
    currentIndex: findLastPassedIndex(entries),
    dailyTimes,
    isLoading,
    error,
    refresh,
  };
}
