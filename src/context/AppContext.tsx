import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getNotificationTiming,
  setNotificationTiming,
  getPrayerNotificationEnabled,
  setPrayerNotificationEnabled,
  getPrayerMode,
  setPrayerMode,
  getLocation,
} from '../services/storage';
import {KerahatVakti} from '../services/prayerTimes';

interface PrayerNotificationToggles {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

interface AppContextType {
  notificationsEnabled: boolean;
  toggleNotifications: () => void;
  notificationTiming: number;
  setNotificationTiming: (minutes: number) => void;
  prayerNotifications: PrayerNotificationToggles;
  setPrayerNotification: (prayerName: string, enabled: boolean) => void;
  hasLocation: boolean;
  refreshLocationStatus: () => void;
  requestRefresh: () => void;
  refreshKey: number;
  kerahatTimes: KerahatVakti[];
  setKerahatTimes: (times: KerahatVakti[]) => void;
  prayerMode: boolean;
  togglePrayerMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({children}: {children: ReactNode}) {
  const [prayerMode, setPrayerModeState] = useState(getPrayerMode());
  const [notificationsEnabled, setNotifState] = useState(getNotificationsEnabled());
  const [notificationTiming, setNotifTiming] = useState(getNotificationTiming());
  const [prayerNotifications, setPrayerNotifs] = useState<PrayerNotificationToggles>(() => ({
    fajr: getPrayerNotificationEnabled('fajr'),
    sunrise: getPrayerNotificationEnabled('sunrise'),
    dhuhr: getPrayerNotificationEnabled('dhuhr'),
    asr: getPrayerNotificationEnabled('asr'),
    maghrib: getPrayerNotificationEnabled('maghrib'),
    isha: getPrayerNotificationEnabled('isha'),
  }));
  const [hasLocation, setHasLocation] = useState(!!getLocation());
  const [refreshKey, setRefreshKey] = useState(0);
  const [kerahatTimes, setKerahatTimes] = useState<KerahatVakti[]>([]);

  const requestRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const refreshLocationStatus = useCallback(() => {
    setHasLocation(!!getLocation());
  }, []);

  const togglePrayerMode = useCallback(() => {
    const newVal = !prayerMode;
    setPrayerModeState(newVal);
    setPrayerMode(newVal);
  }, [prayerMode]);

  const toggleNotifications = useCallback(() => {
    const newVal = !notificationsEnabled;
    setNotifState(newVal);
    setNotificationsEnabled(newVal);
  }, [notificationsEnabled]);

  const handleSetTiming = useCallback((minutes: number) => {
    setNotifTiming(minutes);
    setNotificationTiming(minutes);
  }, []);

  const handleSetPrayerNotification = useCallback((prayerName: string, enabled: boolean) => {
    setPrayerNotifs(prev => ({...prev, [prayerName]: enabled}));
    setPrayerNotificationEnabled(prayerName, enabled);
  }, []);

  return (
    <AppContext.Provider
      value={{
        notificationsEnabled,
        toggleNotifications,
        notificationTiming,
        setNotificationTiming: handleSetTiming,
        prayerNotifications,
        setPrayerNotification: handleSetPrayerNotification,
        hasLocation,
        refreshLocationStatus,
        requestRefresh,
        refreshKey,
        kerahatTimes,
        setKerahatTimes,
        prayerMode,
        togglePrayerMode,
      }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
