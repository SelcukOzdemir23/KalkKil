import {useState, useEffect, useCallback} from 'react';
import {
  calculatePrayerTimes,
  getPrayerTimeEntries,
  getNextPrayer,
  getCurrentPrayerIndex,
  calculateKerahatTimes,
  isTimeInKerahat,
  DailyPrayerTimes,
  PrayerTimeEntry,
  getPrayerTimesAsStrings,
  isSameDay,
} from '../services/prayerTimes';
import {getDateKey} from '../utils/format';
import {getLocation, saveCachedPrayerTimes, getCachedPrayerTimes} from '../services/storage';
import {useAppContext} from '../context/AppContext';

interface UsePrayerTimesResult {
  entries: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
  currentIndex: number;
  dailyTimes: DailyPrayerTimes | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

function parseTimeString(timeStr: string, referenceDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(referenceDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function addKerahat(entries: PrayerTimeEntry[], times: DailyPrayerTimes) {
  const kerahatList = calculateKerahatTimes(times);
  const entriesWithKerahat = entries.map(e => {
    const k = isTimeInKerahat(e.time, kerahatList);
    return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
  });
  return {kerahatList, entriesWithKerahat};
}

function readCachedTimesForDate(date: Date): DailyPrayerTimes | null {
  const cached = getCachedPrayerTimes();
  const dateKey = getDateKey(date);
  if (!cached || cached.date !== dateKey) {
    return null;
  }

  return {
    fajr: parseTimeString(cached.times.fajr, date),
    sunrise: parseTimeString(cached.times.sunrise, date),
    dhuhr: parseTimeString(cached.times.dhuhr, date),
    asr: parseTimeString(cached.times.asr, date),
    maghrib: parseTimeString(cached.times.maghrib, date),
    isha: parseTimeString(cached.times.isha, date),
  };
}

function calculateAndCache(latitude: number, longitude: number, date: Date): DailyPrayerTimes {
  const times = calculatePrayerTimes(latitude, longitude, date);
  saveCachedPrayerTimes(getPrayerTimesAsStrings(times), getDateKey(date));
  return times;
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [entries, setEntries] = useState<PrayerTimeEntry[]>([]);
  const [dailyTimes, setDailyTimes] = useState<DailyPrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const {refreshKey: contextRefreshKey, setKerahatTimes} = useAppContext();

  const refresh = useCallback(() => {
    setLocalRefresh(k => k + 1);
  }, []);

  const loadForDate = useCallback((date: Date, now: Date): {times: DailyPrayerTimes; entries: PrayerTimeEntry[]} | null => {
    const location = getLocation();
    if (!location) {
      return null;
    }

    let times = readCachedTimesForDate(date);
    if (!times) {
      times = calculateAndCache(location.latitude, location.longitude, date);
    }

    return {
      times,
      entries: getPrayerTimeEntries(times, now),
    };
  }, []);

  const publish = useCallback((times: DailyPrayerTimes, nextEntries: PrayerTimeEntry[]) => {
    const {kerahatList, entriesWithKerahat} = addKerahat(nextEntries, times);
    setDailyTimes(times);
    setKerahatTimes(kerahatList);
    setEntries(entriesWithKerahat);
    setError(null);
  }, [setKerahatTimes]);

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
    const todayResult = loadForDate(now, now);
    if (!todayResult) {
      setError('Konum bilgisi bulunamadı. Ayarlardan konum seçin.');
      setIsLoading(false);
      return;
    }

    const todayNext = getNextPrayer(todayResult.entries);
    if (todayNext) {
      publish(todayResult.times, todayResult.entries);
      setIsLoading(false);
      return;
    }

    // Yatsı sonrası: aynı ekran açılışında yarının İmsak vaktine geç.
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowResult = loadForDate(tomorrow, now);
    if (tomorrowResult) {
      publish(tomorrowResult.times, tomorrowResult.entries);
    } else {
      publish(todayResult.times, todayResult.entries);
    }
    setIsLoading(false);
  }, [loadForDate, publish]);

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

      // Gün değiştiyse veya mevcut dailyTimes'taki tüm vakitler geçtiyse baştan yükle.
      const updated = getPrayerTimeEntries(dailyTimes, now);
      const allPassed = updated.every(e => e.isPassed);
      if (allPassed || !isSameDay(now, dailyTimes.fajr)) {
        loadPrayerTimes();
        return;
      }

      const {kerahatList, entriesWithKerahat} = addKerahat(updated, dailyTimes);
      setKerahatTimes(kerahatList);
      setEntries(entriesWithKerahat);
    }, 15_000);

    return () => clearInterval(interval);
  }, [dailyTimes, loadPrayerTimes, setKerahatTimes]);

  const nextPrayer = getNextPrayer(entries);
  const currentIndex = getCurrentPrayerIndex(entries);

  return {entries, nextPrayer, currentIndex, dailyTimes, isLoading, error, refresh};
}
