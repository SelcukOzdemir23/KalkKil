import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useCountdown} from '../hooks/useCountdown';
import {CountdownTimer} from '../components/CountdownTimer';
import {PrayerList} from '../components/PrayerList';
import {GlassView} from '../components/GlassView';
import {AlertModal} from '../components/AlertModal';
import {AppText} from '../components/AppText';
import {getGreeting} from '../utils/format';
import {schedulePrayerNotifications, cancelAllNotifications} from '../services/notifications';
import {updateWidget} from '../services/widget';
import {getCurrentLocation} from '../services/location';
import {
  saveLocation,
  setLocationPermissionGranted,
  getLocationPermissionGranted,
  getLocation,
  getPrayerMode,
} from '../services/storage';

export function HomeScreen() {
  const {notificationsEnabled, kerahatTimes, requestRefresh, prayerMode} = useAppContext();
  const insets = useSafeAreaInsets();
  const {entries, nextPrayer, dailyTimes, isLoading, error} = usePrayerTimes();
  const {countdown} = useCountdown(nextPrayer ? nextPrayer.time : null);
  const initDone = useRef(false);
  const prevNextPrayerName = useRef<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{
    type: 'gps';
    label: string;
  } | null>(null);

  // ── Alert state ──
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
  }>({visible: false, title: '', message: ''});

  const showAlert = useCallback(
    (title: string, message: string, icon?: string) => {
      setAlertState({visible: true, title, message, icon});
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({...prev, visible: false}));
  }, []);

  // ── Konum bilgisini güncelle: city varsa şehri, yoksa koordinatları göster ──
  useEffect(() => {
    const loc = getLocation();
    if (!loc) {
      setLocationInfo(null);
      return;
    }
    const latStr = loc.latitude.toFixed(2);
    const lngStr = loc.longitude.toFixed(2);
    setLocationInfo({
      type: 'gps',
      label: loc.city || `${latStr}°K, ${lngStr}°D`,
    });
  }, [entries]);

  // ── Vakit girdi Alert + Namazdayım modu ──
  useEffect(() => {
    if (!nextPrayer) return;
    if (
      prevNextPrayerName.current !== null &&
      prevNextPrayerName.current !== nextPrayer.name
    ) {
      const timeStr = `${nextPrayer.time.getHours().toString().padStart(2, '0')}:${nextPrayer.time.getMinutes().toString().padStart(2, '0')}`;
      
      if (getPrayerMode()) {
        // Namazdayım modu: bildirimleri 15dk ertele
        if (dailyTimes) schedulePrayerNotifications(dailyTimes, 15);
        showAlert(
          `${nextPrayer.nameTr} vakti girdi!`,
          `Namazdayım modu aktif. Bildirimler 15 dakika susturuldu.\n\n${nextPrayer.nameTr} - ${timeStr}`,
          '🌙',
        );
      } else {
        showAlert(
          `${nextPrayer.nameTr} vakti girdi!`,
          `Saat ${timeStr} itibarıyla ${nextPrayer.nameTr} vakti başladı.`,
          '🕌',
        );
      }
    }
    prevNextPrayerName.current = nextPrayer.name;
  }, [nextPrayer, showAlert, dailyTimes]);

  // ── Konum alma + bilgilendirme ──
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const initLocation = async () => {
      setLocationLoading(true);

      const result = await getCurrentLocation();
      if (result.success) {
        saveLocation(result.latitude, result.longitude);
        setLocationPermissionGranted(true);
        requestRefresh();
        // Konum bulundu → bilgiyi güncelle
        setLocationInfo({
          type: 'gps',
          label: 'GPS',
        });
        showAlert(
          'Konum Alındı',
          'Namaz vakitleri bulunduğunuz konuma göre hesaplanacaktır.',
          '📍',
        );
      }
      setLocationLoading(false);
    };
    initLocation();
  }, [requestRefresh, showAlert]);

  // ── Widget güncelleme ──
  useEffect(() => {
    if (entries.length > 0) {
      updateWidget(nextPrayer, countdown, entries);
    }
  }, [nextPrayer, countdown, entries]);

  // ── Bildirimleri güncelle ──
  useEffect(() => {
    if (dailyTimes && notificationsEnabled) {
      schedulePrayerNotifications(dailyTimes);
    } else if (!notificationsEnabled) {
      cancelAllNotifications();
    }
  }, [dailyTimes, notificationsEnabled]);

  const activeKerahat = kerahatTimes.find(k => {
    const now = Date.now();
    return now >= k.start.getTime() && now < k.end.getTime();
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ── Loading: konum alınırken ──
  if (locationLoading || isLoading) {
    return (
      <View style={{flex: 1, backgroundColor: '#0A0E1A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(0, 212, 255, 0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 255, 0.15)',
        }}>
          <ActivityIndicator size="large" color="#00D4FF" />
        </View>
        <AppText style={{fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 6, textAlign: 'center'}}>
          Konumunuz alınıyor
        </AppText>
        <AppText style={{fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', lineHeight: 18}}>
          Namaz vakitlerini hesaplamak için konumunuzu belirliyoruz...
        </AppText>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: '#0A0E1A'}}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 14,
        }}>

        {/* Header */}
        <View style={{marginBottom: 12}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <AppText style={{fontSize: 11, fontWeight: '600', color: 'rgba(0, 212, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 2}}>
              {dateStr.toUpperCase()}
            </AppText>
            {/* Location badge */}
            {locationInfo && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: 'rgba(0, 212, 255, 0.06)',
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}>
                <AppText style={{fontSize: 9}}>📍</AppText>
                <AppText style={{fontSize: 9, color: 'rgba(0, 212, 255, 0.7)', fontWeight: '500'}}>
                  {locationInfo.label}
                </AppText>
              </View>
            )}
          </View>
          <AppText style={{fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginTop: 2, marginBottom: 8}}>
            {getGreeting()}
          </AppText>
        </View>

        {/* Active kerahat banner */}
        {activeKerahat && !error && (
          <GlassView intensity="heavy" style={{marginBottom: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 107, 53, 0.2)', paddingHorizontal: 12, paddingVertical: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <AppText style={{fontSize: 12}}>⚠️</AppText>
              <AppText style={{fontSize: 11, fontWeight: '600', color: '#FF6B35', flex: 1}}>
                Kerâhet vakti — {activeKerahat.label.toLowerCase()}
              </AppText>
            </View>
          </GlassView>
        )}

        {/* Error banner */}
        {error ? (
          <GlassView intensity="heavy" style={{marginBottom: 10, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 179, 71, 0.2)', paddingHorizontal: 12, paddingVertical: 10}}>
            <AppText style={{fontSize: 12, fontWeight: '500', color: '#FFB347'}}>{error}</AppText>
          </GlassView>
        ) : null}

        {/* Countdown - full size */}
        <View style={{marginBottom: 14}}>
          <CountdownTimer
            nextPrayer={nextPrayer}
            kerahatActive={!!activeKerahat}
            kerahatLabel={activeKerahat?.label}
          />
        </View>

        {/* Prayer List - 2x3 grid */}
        <PrayerList entries={entries} nextPrayer={nextPrayer} />
      </View>

      {/* Custom Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        icon={alertState.icon}
        onClose={hideAlert}
      />
    </View>
  );
}
