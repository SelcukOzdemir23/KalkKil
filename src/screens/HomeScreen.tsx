import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, ActivityIndicator, ScrollView} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useCountdown} from '../hooks/useCountdown';
import {CountdownTimer} from '../components/CountdownTimer';
import {PrayerList} from '../components/PrayerList';
import {AlertModal} from '../components/AlertModal';
import {AppText} from '../components/AppText';
import {getGreeting} from '../utils/format';
import {schedulePrayerNotifications, cancelAllNotifications, requestNotificationPermission} from '../services/notifications';
import {updateWidget, startPrayerForegroundService, stopPrayerForegroundService} from '../services/widget';
import {getCurrentLocation, requestLocationPermission, checkLocationPermission, reverseGeocode} from '../services/location';
import {saveLocation, setLocationPermissionGranted, getLocation, getLocationLabel, getPrayerMode} from '../services/storage';
import {colors, radius} from '../theme/tokens';

export function HomeScreen() {
  const {notificationsEnabled, kerahatTimes, requestRefresh, notificationTiming, prayerNotifications} = useAppContext();
  const insets = useSafeAreaInsets();
  const {entries, nextPrayer, dailyTimes, isLoading, error} = usePrayerTimes();
  const {countdown} = useCountdown(nextPrayer ? nextPrayer.time : null);
  const initDone = useRef(false);
  const prevNextPrayerName = useRef<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{type: 'gps'; label: string} | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; icon?: React.ReactNode}>({visible: false, title: '', message: ''});

  const showAlert = useCallback((title: string, message: string, icon?: React.ReactNode) => {
    setAlertState({visible: true, title, message, icon});
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({...prev, visible: false}));
  }, []);

  // ── İlk açılış: konum izni + GPS + bildirim izni ──
  // Sonraki açılışlarda: sadece cache'teki konumu yükle, asla otomatik GPS yok
  useEffect(() => {
    const init = async () => {
      // Cache'te kayıtlı konum varsa her açılışta hemen yükle
      const cached = getLocation();
      if (cached) {
        setLocationInfo({type: 'gps', label: getLocationLabel()});
      }

      // ── SADECE İLK AÇILIŞ: permission + GPS ──
      if (!initDone.current) {
        initDone.current = true;

        const hasPerm = await checkLocationPermission();
        if (!hasPerm) {
          // İzin yoksa dialog göster, kullanıcı görsün
          setLocationLoading(!cached);
          const granted = await requestLocationPermission();
          if (granted && !cached) {
            const result = await getCurrentLocation();
            if (result.success) {
              // Konum adresini çöz
              const geo = await reverseGeocode(result.latitude, result.longitude);
              const label = geo.success ? geo.label : 'GPS konumu';
              saveLocation(result.latitude, result.longitude, geo.success ? geo.city : undefined, geo.success ? geo.district : undefined);
              setLocationPermissionGranted(true);
              requestRefresh();
              setLocationInfo({type: 'gps', label});
            }
          }
        } else if (!cached) {
          // İzin var ama cached konum yok → GPS dene
          setLocationLoading(true);
          const result = await getCurrentLocation();
          if (result.success) {
            const geo = await reverseGeocode(result.latitude, result.longitude);
            const label = geo.success ? geo.label : 'GPS konumu';
            saveLocation(result.latitude, result.longitude, geo.success ? geo.city : undefined, geo.success ? geo.district : undefined);
            setLocationPermissionGranted(true);
            requestRefresh();
            setLocationInfo({type: 'gps', label});
          }
        }

        // Bildirim iznini ilk açılışta bir kere iste
        requestNotificationPermission().catch(() => {});
      }

      // Loading'i her durumda kapat (cache var veya yok)
      setLocationLoading(false);
    };

    init();
  }, [requestRefresh]);

  useEffect(() => {
    const loc = getLocation();
    if (!loc) {
      setLocationInfo(null);
      return;
    }
    setLocationInfo({type: 'gps', label: getLocationLabel()});
  }, []);

  useEffect(() => {
    if (!nextPrayer) return;
    if (prevNextPrayerName.current !== null && prevNextPrayerName.current !== nextPrayer.name) {
      const timeStr = `${nextPrayer.time.getHours().toString().padStart(2, '0')}:${nextPrayer.time.getMinutes().toString().padStart(2, '0')}`;

      if (getPrayerMode()) {
        // Namazdayım: sadece sıradaki vakit için bildirimleri 15dk ertele
        if (dailyTimes) schedulePrayerNotifications(dailyTimes, 15);
        showAlert(
          `${nextPrayer.nameTr} vakti girdi`,
          `Namazdayım modu aktif. Bildirimler 15 dakika susturuldu.\n\n${nextPrayer.nameTr} - ${timeStr}`,
          <AppText style={{fontSize: 22}}>☾</AppText>,
        );
      } else {
        showAlert(
          `${nextPrayer.nameTr} vakti girdi`,
          `Saat ${timeStr} itibarıyla ${nextPrayer.nameTr} vakti başladı.`,
          <AppText style={{fontSize: 22}}>🕋</AppText>,
        );
      }
    }
    prevNextPrayerName.current = nextPrayer.name;
  }, [nextPrayer, showAlert, dailyTimes]);

  useEffect(() => {
    if (entries.length > 0) {
      updateWidget(nextPrayer, countdown, entries);
    }
  }, [nextPrayer, countdown, entries]);

  useEffect(() => {
    let cancelled = false;

    const updateNotifications = async () => {
      if (dailyTimes && notificationsEnabled) {
        const granted = await requestNotificationPermission();
        if (!cancelled && granted) {
          await schedulePrayerNotifications(dailyTimes);
          startPrayerForegroundService();
        }
      } else if (!notificationsEnabled) {
        stopPrayerForegroundService();
        await cancelAllNotifications();
      }
    };

    updateNotifications();
    return () => {
      cancelled = true;
    };
  }, [dailyTimes, notificationsEnabled, notificationTiming, prayerNotifications]);

  const activeKerahat = kerahatTimes.find(k => {
    const now = Date.now();
    return now >= k.start.getTime() && now < k.end.getTime();
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('tr-TR', {weekday: 'long', day: 'numeric', month: 'long'});

  if (locationLoading || isLoading) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.borderStrong,
          }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
        <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6, textAlign: 'center'}}>
          Vakitler hazırlanıyor
        </AppText>
        <AppText style={{fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20}}>
          Konum ve namaz vakitleri kontrol ediliyor.
        </AppText>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90, paddingHorizontal: 16}}
        showsVerticalScrollIndicator={false}>

        <View style={{marginBottom: 18}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
            <View style={{flex: 1}}>
              <AppText style={{fontSize: 13, color: colors.accentMuted, fontWeight: '700', letterSpacing: 0.4}}>
                {dateStr}
              </AppText>
              <AppText style={{fontSize: 34, fontWeight: '700', color: colors.text, marginTop: 2}}>
                {getGreeting()}
              </AppText>
            </View>
            {locationInfo && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radius.sm,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxWidth: 150,
                }}>
                <MapPin size={13} color={colors.textMuted} />
                <AppText style={{fontSize: 12, color: colors.textMuted, fontWeight: '600'}} numberOfLines={1}>
                  {locationInfo.label}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {error ? (
          <View
            style={{
              marginBottom: 12,
              borderRadius: radius.md,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(217, 135, 95, 0.24)',
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: colors.surfaceSoft,
            }}>
            <AppText style={{fontSize: 13, fontWeight: '600', color: colors.danger}}>{error}</AppText>
          </View>
        ) : null}

        <View style={{marginBottom: 18}}>
          <CountdownTimer nextPrayer={nextPrayer} countdown={countdown} kerahatActive={!!activeKerahat} kerahatLabel={activeKerahat?.label} />
        </View>

        <PrayerList entries={entries} nextPrayer={nextPrayer} />
      </ScrollView>

      <AlertModal visible={alertState.visible} title={alertState.title} message={alertState.message} icon={alertState.icon} onClose={hideAlert} />
    </View>
  );
}
