import React, {useCallback, useState, ReactNode} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ChevronRight} from 'lucide-react-native';
import {useAppContext} from '../context/AppContext';
import {AlertModal} from '../components/AlertModal';
import {Chip} from '../ui/Chip';
import {Divider} from '../ui/Divider';
import {Text} from '../ui/Text';
import {useTheme} from '../theme/ThemeProvider';
import {getCurrentLocation, reverseGeocode} from '../services/location';
import {
  requestNotificationPermission,
  sendTestNotification,
} from '../services/notifications';
import {
  saveLocation,
  setLocationPermissionGranted,
  getLocationLabel,
  getLocation,
} from '../services/storage';

/** package.json ile tek kaynak; elle güncellenen sürüm numarası tutulmaz. */
const {version: APP_VERSION} = require('../../package.json');

const TIMING_OPTIONS = [
  {label: 'Tam vaktinde', value: 0},
  {label: '5 dk önce', value: 5},
  {label: '15 dk önce', value: 15},
  {label: '30 dk önce', value: 30},
];

// ─── Yerel düzen parçaları ────────────────────────────────────

function Section({title, children}: {title: string; children: ReactNode}) {
  const {spacing} = useTheme();

  return (
    <View style={{marginTop: spacing.xxl}}>
      <Text variant="label" tone="muted" style={{marginBottom: spacing.xs}}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: () => void;
}) {
  const {palette, spacing} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg - 2,
      }}>
      <View style={{flex: 1}}>
        <Text variant="body">{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="muted" style={{marginTop: 2}}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: palette.hairline, true: palette.accentSoft}}
        thumbColor={value ? palette.accent : palette.inkSubtle}
      />
    </View>
  );
}

function ActionRow({
  title,
  subtitle,
  onPress,
  busy,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  busy?: boolean;
}) {
  const {palette, spacing} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg - 2,
        opacity: busy ? 0.5 : pressed ? 0.6 : 1,
      })}>
      <View style={{flex: 1}}>
        <Text variant="body">{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="muted" style={{marginTop: 2}}>
            {subtitle}
          </Text>
        )}
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={palette.accent} />
      ) : (
        <ChevronRight size={16} color={palette.inkSubtle} />
      )}
    </Pressable>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  const {spacing} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
      }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="caption">{value}</Text>
    </View>
  );
}

// ─── Ekran ────────────────────────────────────────────────────

export function SettingsScreen() {
  const {
    notificationsEnabled,
    toggleNotifications,
    notificationTiming,
    setNotificationTiming,
    prayerMode,
    togglePrayerMode,
    requestRefresh,
  } = useAppContext();

  const {palette, spacing} = useTheme();
  const insets = useSafeAreaInsets();
  const [locationLoading, setLocationLoading] = useState(false);
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const locationLabel = getLocationLabel();
  const savedLocation = getLocation();

  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({visible: false, title: '', message: ''});

  const showAlert = useCallback((title: string, message: string) => {
    setAlertState({visible: true, title, message});
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({...prev, visible: false}));
  }, []);

  const handleRefreshLocation = useCallback(async () => {
    setLocationLoading(true);
    const result = await getCurrentLocation();
    if (result.success) {
      const geo = await reverseGeocode(result.latitude, result.longitude);
      saveLocation(
        result.latitude,
        result.longitude,
        geo.success ? geo.city : undefined,
        geo.success ? geo.district : undefined,
      );
      setLocationPermissionGranted(true);
      requestRefresh();
      showAlert(
        'Konum güncellendi',
        `Vakitler ${getLocationLabel()} için yeniden hesaplandı.`,
      );
    } else {
      showAlert('Konum alınamadı', result.error);
    }
    setLocationLoading(false);
  }, [requestRefresh, showAlert]);

  const handleTestNotification = useCallback(async () => {
    setTestNotifLoading(true);
    const granted = await requestNotificationPermission();
    if (!granted) {
      showAlert(
        'Bildirim izni yok',
        'Test bildirimi için telefon ayarlarından uygulamaya bildirim izni verin.',
      );
      setTestNotifLoading(false);
      return;
    }

    await sendTestNotification();
    showAlert('Bildirim gönderildi', 'Bildirim çubuğunu kontrol edin.');
    setTestNotifLoading(false);
  }, [showAlert]);

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          'Bildirim izni gerekli',
          'Vakit bildirimleri için izin vermeniz gerekiyor.',
        );
        return;
      }
    }
    toggleNotifications();
  }, [notificationsEnabled, showAlert, toggleNotifications]);

  return (
    <View style={{flex: 1, backgroundColor: palette.background}}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}>
        <Text variant="title">Ayarlar</Text>

        <Section title="Konum">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingVertical: spacing.lg - 2,
            }}>
            <View style={{flex: 1}}>
              <Text variant="body">{locationLabel}</Text>
              <Text variant="caption" tone="muted" style={{marginTop: 2}}>
                {savedLocation
                  ? 'Vakitler bu konuma göre hesaplanıyor'
                  : 'Konum seçilmedi'}
              </Text>
            </View>

            <Pressable
              onPress={handleRefreshLocation}
              disabled={locationLoading}
              style={({pressed}) => ({
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: palette.hairlineStrong,
                opacity: locationLoading ? 0.5 : pressed ? 0.6 : 1,
              })}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={palette.accent} />
              ) : (
                <Text variant="label" tone="accent">
                  GPS
                </Text>
              )}
            </Pressable>
          </View>
        </Section>

        <Section title="Bildirimler">
          <SwitchRow
            title="Vakit bildirimleri"
            subtitle="Ezan öncesi veya tam vaktinde hatırlatma"
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />

          {notificationsEnabled && (
            <>
              <Divider />
              <View style={{paddingVertical: spacing.lg - 2}}>
                <Text variant="caption" tone="muted" style={{marginBottom: spacing.md}}>
                  Ne kadar önce?
                </Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
                  {TIMING_OPTIONS.map(option => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      selected={notificationTiming === option.value}
                      onPress={() => setNotificationTiming(option.value)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <Divider />
          <ActionRow
            title="Test bildirimi gönder"
            subtitle="Anında bir bildirim alıp deneyin"
            onPress={handleTestNotification}
            busy={testNotifLoading}
          />

          {notificationsEnabled && (
            <>
              <Divider />
              <SwitchRow
                title="Namazdayım modu"
                subtitle="Vakit girdiğinde bildirimleri 15 dk susturur"
                value={prayerMode}
                onValueChange={togglePrayerMode}
              />
            </>
          )}
        </Section>

        <Section title="Hakkında">
          <InfoRow label="Sürüm" value={APP_VERSION} />
          <Divider />
          <InfoRow label="Hesaplama yöntemi" value="Diyanet" />
        </Section>

        <Text
          variant="label"
          tone="muted"
          style={{textAlign: 'center', marginTop: spacing.xxxl}}>
          Reklamsız · Konum cihazınızda kalır
        </Text>
      </ScrollView>

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
      />
    </View>
  );
}
