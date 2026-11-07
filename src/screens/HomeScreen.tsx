import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, ScrollView, ActivityIndicator} from 'react-native';
import {Bell, MapPin, Moon} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useAppContext} from '../context/AppContext';
import {usePrayerTimes} from '../hooks/usePrayerTimes';
import {useCountdown} from '../hooks/useCountdown';
import {AlertModal} from '../components/AlertModal';
import {EmptyState} from '../ui/EmptyState';
import {DayTimeline} from '../features/prayer-times/DayTimeline';
import {NextPrayerHero} from '../features/prayer-times/NextPrayerHero';
import {findActiveKerahat, isSameDay} from '../domain/prayer';
import {KERAHAT_LABELS, PRAYER_LABELS} from '../i18n/tr';
import {useTheme} from '../theme/ThemeProvider';
import {Text} from '../ui/Text';
import {getGreeting} from '../utils/format';
import {
  schedulePrayerNotifications,
  cancelAllNotifications,
  requestNotificationPermission,
} from '../services/notifications';
import {syncWidget} from '../services/widget';
import {getLocation, getLocationLabel, getPrayerMode} from '../services/storage';

export function HomeScreen() {
  const {
    notificationsEnabled,
    kerahatWindows,
    notificationTiming,
    prayerNotifications,
  } = useAppContext();
  const insets = useSafeAreaInsets();
  // Sekme adları App.tsx'te tanımlı; boş durumdan Ayarlar'a yönlendirmek için.
  const navigation = useNavigation<BottomTabNavigationProp<Record<string, undefined>>>();
  const {palette, spacing} = useTheme();
  const {entries, nextPrayer, dailyTimes, isLoading, error} = usePrayerTimes();
  const {countdown} = useCountdown(nextPrayer ? nextPrayer.time : null);
  const prevNextPrayerName = useRef<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: React.ReactNode;
  }>({visible: false, title: '', message: ''});

  const showAlert = useCallback(
    (title: string, message: string, icon?: React.ReactNode) => {
      setAlertState({visible: true, title, message, icon});
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({...prev, visible: false}));
  }, []);

  // Konum onboarding'de seçilir; burada yalnızca okunur.
  useEffect(() => {
    const cached = getLocation();
    if (cached) {
      setLocationInfo(getLocationLabel());
    }
    requestNotificationPermission().catch(() => {});
    setLocationLoading(false);
  }, []);

  // Vakit değişince kullanıcıyı uygulama içinde de uyar.
  useEffect(() => {
    if (!nextPrayer) {
      return;
    }
    if (
      prevNextPrayerName.current !== null &&
      prevNextPrayerName.current !== nextPrayer.key
    ) {
      const timeStr = `${nextPrayer.time.getHours().toString().padStart(2, '0')}:${nextPrayer.time.getMinutes().toString().padStart(2, '0')}`;
      const prayerLabel = PRAYER_LABELS[nextPrayer.key];

      if (getPrayerMode()) {
        if (dailyTimes) {
          schedulePrayerNotifications(dailyTimes, 15);
        }
        showAlert(
          `${prayerLabel} vakti girdi`,
          `Namazdayım modu aktif. Bildirimler 15 dakika susturuldu.\n\n${prayerLabel} - ${timeStr}`,
          <Moon size={22} color={palette.accent} />,
        );
      } else {
        showAlert(
          `${prayerLabel} vakti girdi`,
          `Saat ${timeStr} itibarıyla ${prayerLabel} vakti başladı.`,
          <Bell size={22} color={palette.accent} />,
        );
      }
    }
    prevNextPrayerName.current = nextPrayer.key;
  }, [nextPrayer, showAlert, dailyTimes, palette.accent]);

  // Widget tek seferde 7 günlük plan alır ve geri sayımı kendi çizer.
  // Bu yüzden saniye başı değil, gün/konum değişince senkronlanır.
  useEffect(() => {
    if (dailyTimes) {
      syncWidget(dailyTimes);
    }
  }, [dailyTimes]);

  useEffect(() => {
    let cancelled = false;

    const updateNotifications = async () => {
      if (dailyTimes && notificationsEnabled) {
        const granted = await requestNotificationPermission();
        if (!cancelled && granted) {
          await schedulePrayerNotifications(dailyTimes);
        }
      } else if (!notificationsEnabled) {
        await cancelAllNotifications();
      }
    };

    updateNotifications();
    return () => {
      cancelled = true;
    };
  }, [dailyTimes, notificationsEnabled, notificationTiming, prayerNotifications]);

  const now = new Date();
  const activeKerahat = findActiveKerahat(kerahatWindows, now);
  const dateStr = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (!isLoading && entries.length === 0) {
    return (
      <EmptyState
        title="Konum gerekli"
        body="Vakitler seçtiğiniz yere göre hesaplanır. Konum seçtiğinizde bugünün vakitleri burada görünecek."
        actionLabel="Ayarlara git"
        onAction={() => navigation.navigate('Ayarlar')}
      />
    );
  }

  if (locationLoading || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={palette.accent} />
        <Text variant="caption" tone="muted" style={{marginTop: spacing.lg}}>
          Vakitler hazırlanıyor
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: palette.background}}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 110,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: spacing.md,
          }}>
          <View style={{flex: 1}}>
            <Text variant="label" tone="accent">
              {dateStr}
            </Text>
            <Text variant="title" style={{marginTop: spacing.xs}}>
              {getGreeting()}
            </Text>
          </View>

          {locationInfo && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: spacing.xs,
                maxWidth: 150,
              }}>
              <MapPin size={12} color={palette.inkSubtle} />
              <Text variant="label" tone="muted" numberOfLines={1}>
                {locationInfo}
              </Text>
            </View>
          )}
        </View>

        {error ? (
          <Text variant="caption" tone="accent" style={{marginTop: spacing.lg}}>
            {error}
          </Text>
        ) : null}

        <View style={{marginTop: 40}}>
          <NextPrayerHero nextPrayer={nextPrayer} countdown={countdown} />
        </View>

        <View style={{marginTop: spacing.xxl}}>
          {!isSameDay(now, dailyTimes ? dailyTimes.fajr : now) && (
            <Text variant="label" tone="accent" style={{marginBottom: spacing.md}}>
              Yarın
            </Text>
          )}
          <DayTimeline
            entries={entries}
            kerahatWindows={kerahatWindows}
            now={now}
          />
        </View>

        {activeKerahat && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginTop: spacing.lg,
            }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 99,
                backgroundColor: palette.accent,
              }}
            />
            <Text variant="caption" tone="accent">
              Kerâhet vakti — {KERAHAT_LABELS[activeKerahat.reason]}
            </Text>
          </View>
        )}


        <Text
          variant="label"
          tone="muted"
          style={{marginTop: spacing.xxl, textAlign: 'center'}}>
          Vakitler cihazınızda hesaplanır · Diyanet yöntemi
        </Text>
      </ScrollView>

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
