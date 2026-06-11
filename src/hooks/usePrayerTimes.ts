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
import {
  getLocation,
  saveCachedPrayerTimes,
  getCachedPrayerTimes,
} from '../services/storage';
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

export function usePrayerTimes(): UsePrayerTimesResult {
  const [entries, setEntries] = useState<PrayerTimeEntry[]>([]);
  const [dailyTimes, setDailyTimes] = useState<DailyPrayerTimes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);
  const {refreshKey: contextRefreshKey, requestRefresh, setKerahatTimes} = useAppContext();

  const refresh = useCallback(() => {
    setLocalRefresh(k => k + 1);
  }, []);

  useEffect(() => {
    const loadPrayerTimes = () => {
      const location = getLocation();
      if (!location) {
        setError('Konum bilgisi bulunamadı. Ayarlardan konum seçin.');
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const dateKey = getDateKey(now);

      const cached = getCachedPrayerTimes();
      if (cached && cached.date === dateKey) {
        const times: DailyPrayerTimes = {
          fajr: parseTimeString(cached.times.fajr, now),
          sunrise: parseTimeString(cached.times.sunrise, now),
          dhuhr: parseTimeString(cached.times.dhuhr, now),
          asr: parseTimeString(cached.times.asr, now),
          maghrib: parseTimeString(cached.times.maghrib, now),
          isha: parseTimeString(cached.times.isha, now),
        };

        setDailyTimes(times);

        const kerahatList = calculateKerahatTimes(times);
        setKerahatTimes(kerahatList);

        const prayerEntries = getPrayerTimeEntries(times, now);
        const entriesWithKerahat = prayerEntries.map(e => {
          const k = isTimeInKerahat(e.time, kerahatList);
          return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
        });
        setEntries(entriesWithKerahat);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const times = calculatePrayerTimes(
          location.latitude,
          location.longitude,
          now,
        );
        setDailyTimes(times);

        const kerahatList = calculateKerahatTimes(times);
        setKerahatTimes(kerahatList);

        const prayerEntries = getPrayerTimeEntries(times, now);
        const entriesWithKerahat = prayerEntries.map(e => {
          const k = isTimeInKerahat(e.time, kerahatList);
          return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
        });
        setEntries(entriesWithKerahat);

        saveCachedPrayerTimes(getPrayerTimesAsStrings(times), dateKey);
        setError(null);
      } catch {
        setError('Vakitler hesaplanırken hata oluştu');
      }
      setIsLoading(false);
    };

    loadPrayerTimes();
  }, [contextRefreshKey, localRefresh, setKerahatTimes]);

  useEffect(() => {
    if (!dailyTimes) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();

      // Önce tüm vakitlerin geçip geçmediğini kontrol et (Yatsı sonrası)
      const updated = getPrayerTimeEntries(dailyTimes, now);
      const allPassed = updated.every(e => e.isPassed);

      if (allPassed) {
        // Tüm vakitler geçmiş → yarının vakitlerine geç
        const location = getLocation();
        if (location) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          try {
            const tomorrowTimes = calculatePrayerTimes(
              location.latitude,
              location.longitude,
              tomorrow,
            );
            setDailyTimes(tomorrowTimes);

            const kerahatList = calculateKerahatTimes(tomorrowTimes);
            setKerahatTimes(kerahatList);

            const tomorrowEntries = getPrayerTimeEntries(tomorrowTimes, now);
            const entriesWithKerahat = tomorrowEntries.map(e => {
              const k = isTimeInKerahat(e.time, kerahatList);
              return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
            });
            setEntries(entriesWithKerahat);

            saveCachedPrayerTimes(
              getPrayerTimesAsStrings(tomorrowTimes),
              getDateKey(tomorrow),
            );
          } catch {
            // Hata olursa sessizce geç
          }
        }
        return;
      }

      // Gün değiştiyse ama henüz tüm vakitler geçmediyse (yeni günün ilk vakitleri)
      if (!isSameDay(now, dailyTimes.fajr)) {
        const location = getLocation();
        if (location) {
          try {
            const todayTimes = calculatePrayerTimes(
              location.latitude,
              location.longitude,
              now,
            );
            setDailyTimes(todayTimes);

            const kerahatList = calculateKerahatTimes(todayTimes);
            setKerahatTimes(kerahatList);

            const todayEntries = getPrayerTimeEntries(todayTimes, now);
            const entriesWithKerahat = todayEntries.map(e => {
              const k = isTimeInKerahat(e.time, kerahatList);
              return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
            });
            setEntries(entriesWithKerahat);

            saveCachedPrayerTimes(
              getPrayerTimesAsStrings(todayTimes),
              getDateKey(now),
            );
          } catch {
            // Hata olursa sessizce geç
          }
        }
        return;
      }

      // Aynı gün içinde — vakit güncelle
      const kerahatList = calculateKerahatTimes(dailyTimes);
      setKerahatTimes(kerahatList);

      const entriesWithKerahat = updated.map(e => {
        const k = isTimeInKerahat(e.time, kerahatList);
        return {...e, isKerahat: k.isKerahat, kerahatLabel: k.label};
      });
      setEntries(entriesWithKerahat);
    }, 30000);

    return () => clearInterval(interval);
  }, [dailyTimes, requestRefresh, setKerahatTimes]);

  const nextPrayer = getNextPrayer(entries);
  const currentIndex = getCurrentPrayerIndex(entries);

  return {entries, nextPrayer, currentIndex, dailyTimes, isLoading, error, refresh};
}

function parseTimeString(timeStr: string, referenceDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(referenceDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}
