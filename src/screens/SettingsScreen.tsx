import React, {useCallback, useState} from 'react';
import {View, Switch, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {AppText} from '../components/AppText';
import {AlertModal} from '../components/AlertModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {getCurrentLocation, reverseGeocode} from '../services/location';
import {requestNotificationPermission, sendTestNotification} from '../services/notifications';
import {saveLocation, setLocationPermissionGranted, getLocationLabel, getLocation} from '../services/storage';
import {Bell, BellOff, Clock, Moon, MapPin, Navigation, Info, AlertTriangle} from 'lucide-react-native';
import {radius} from '../theme/tokens';
import {useTheme} from '../theme/ThemeProvider';

const TIMING_OPTIONS = [
  {label: 'Tam vaktinde', value: 0},
  {label: '5 dk önce', value: 5},
  {label: '15 dk önce', value: 15},
  {label: '30 dk önce', value: 30},
];

// ─── Bölüm Başlığı ─────────────────────────────────────────────

function SectionHeader({title, icon}: {title: string; icon?: React.ReactNode}) {
  const {palette} = useTheme();

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 4}}>
      {icon}
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: palette.accentMuted,
          letterSpacing: 0.4,
        }}>
        {title}
      </AppText>
    </View>
  );
}

// ─── Kart Bileşeni ─────────────────────────────────────────────

function Card({children}: {children: React.ReactNode}) {
  const {palette} = useTheme();

  return (
    <View
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: palette.hairline,
        marginBottom: 24,
        backgroundColor: palette.surface,
      }}>
      {children}
    </View>
  );
}

// ─── Toggle Satırı ─────────────────────────────────────────────

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
}) {
  const {palette} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 18,
        gap: 14,
        opacity: disabled ? 0.4 : 1,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: value ? palette.accentSoft : 'rgba(244, 241, 234, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{flex: 1}}>
        <AppText style={{fontSize: 16, fontWeight: '600', color: palette.ink}}>
          {title}
        </AppText>
        {subtitle && (
          <AppText style={{fontSize: 12, color: palette.inkMuted, marginTop: 2}}>
            {subtitle}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: 'rgba(244,241,234,0.1)', true: palette.accentSoft}}
        thumbColor={value ? palette.accent : 'rgba(244,241,234,0.4)'}
      />
    </View>
  );
}

// ─── Seçenek Chip ──────────────────────────────────────────────

function OptionChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const {palette} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => ({
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: radius.md,
        backgroundColor: selected
          ? palette.accentSoft
          : pressed
          ? palette.surfaceMuted
          : 'rgba(244,241,234,0.04)',
        borderWidth: 1.5,
        borderColor: selected ? palette.accent : palette.hairline,
      })}>
      <AppText
        style={{
          fontSize: 14,
          fontWeight: selected ? '800' : '600',
          color: selected ? palette.accent : palette.inkMuted,
        }}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ─── Ana Ekran ─────────────────────────────────────────────────

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

  const {palette} = useTheme();
  const insets = useSafeAreaInsets();
  const [locationLoading, setLocationLoading] = useState(false);
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: React.ReactNode;
  }>({visible: false, title: '', message: ''});

  const savedLocation = getLocation();
  const locationLabel = savedLocation ? getLocationLabel() : 'Konum ayarlanmadı';

  const showAlert = useCallback((title: string, message: string, icon?: React.ReactNode) => {
    setAlertState({visible: true, title, message, icon});
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
        'Konum Güncellendi',
        `Konum: ${getLocationLabel()}\n\nVakitler yeniden hesaplanacaktır.`,
        <MapPin size={24} color={palette.accent} />,
      );
    } else {
      showAlert('Konum Alınamadı', result.error, <AlertTriangle size={24} color={palette.accent} />);
    }
    setLocationLoading(false);
  }, [requestRefresh, showAlert, palette.accent]);

  const handleTestNotification = useCallback(async () => {
    setTestNotifLoading(true);
    try {
      // Önce izin kontrolü yap
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          'Bildirim İzni Yok',
          'Test bildirimi göndermek için bildirim izni gereklidir. Telefonunuzun ayarlarından uygulamaya bildirim izni verin.',
          <AlertTriangle size={24} color={palette.accent} />,
        );
        setTestNotifLoading(false);
        return;
      }
      await sendTestNotification();
      showAlert(
        'Bildirim Gönderildi',
        'Bildirim çubuğunu kontrol edin. Eğer bildirim görmediyseniz, telefonunuzun bildirim izinlerini kontrol edin.',
        <Bell size={24} color={palette.accent} />,
      );
    } catch {
      showAlert(
        'Bildirim Gönderilemedi',
        'Bir hata oluştu. Bildirim izinlerini kontrol edin.',
        <AlertTriangle size={24} color={palette.accent} />,
      );
    }
    setTestNotifLoading(false);
  }, [showAlert, palette.accent]);

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          'Bildirim İzni Gerekli',
          'Ezan bildirimlerini alabilmek için bildirim iznini vermelisiniz. İzni daha önce reddettiyseniz telefon ayarlarından tekrar açabilirsiniz.',
          <Bell size={24} color={palette.accent} />,
        );
        return;
      }
    }
    toggleNotifications();
  }, [notificationsEnabled, showAlert, toggleNotifications, palette.accent]);

  return (
    <>
      <ScrollView
        style={{flex: 1, backgroundColor: palette.background}}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}>


        {/* Başlık */}
        <View style={{marginBottom: 32}}>
          <AppText style={{fontSize: 32, fontWeight: '800', color: palette.ink, letterSpacing: -0.5}}>
            Ayarlar
          </AppText>
          <AppText style={{fontSize: 14, color: palette.inkMuted, marginTop: 4}}>
            Uygulama tercihlerini düzenleyin
          </AppText>
        </View>

        {/* ── KONUM ── */}
        <SectionHeader title="Konum" icon={<MapPin size={16} color={palette.accentMuted} />} />
        <Card>
          <View style={{padding: 18}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: palette.successSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Navigation size={20} color={palette.success} />
              </View>
              <View style={{flex: 1}}>
                <AppText style={{fontSize: 16, fontWeight: '700', color: palette.ink}}>
                  {locationLabel}
                </AppText>
                {savedLocation && (
                  <AppText style={{fontSize: 11, color: palette.inkSubtle, marginTop: 1}}>
                    {savedLocation.latitude.toFixed(4)}, {savedLocation.longitude.toFixed(4)}
                  </AppText>
                )}
              </View>
            </View>

            <Pressable
              onPress={handleRefreshLocation}
              disabled={locationLoading}
              style={({pressed}) => ({
                backgroundColor: pressed ? palette.accentSoft : palette.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.hairline,
                paddingVertical: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: locationLoading ? 0.7 : 1,
              })}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={palette.accent} />
              ) : (
                <>
                  <Navigation size={14} color={palette.accent} />
                  <AppText style={{fontSize: 14, fontWeight: '600', color: palette.accent}}>
                    GPS ile Güncelle
                  </AppText>
                </>
              )}
            </Pressable>
          </View>
        </Card>

        {/* ── BİLDİRİMLER ── */}
        <SectionHeader title="Bildirimler" icon={<Bell size={16} color={palette.accentMuted} />} />
        <Card>
          <ToggleRow
            icon={
              notificationsEnabled ? (
                <Bell size={18} color={palette.accent} />
              ) : (
                <BellOff size={18} color={palette.inkSubtle} />
              )
            }
            title="Vakit bildirimleri"
            subtitle="Ezan öncesi veya tam vaktinde hatırlatma"
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />

          {/* Zamanlama — sadece bildirimler açıksa */}
          {notificationsEnabled && (
            <View style={{borderTopWidth: 1, borderTopColor: palette.hairline}}>
              <View style={{paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14}}>
                  <Clock size={14} color={palette.accentMuted} />
                  <AppText style={{fontSize: 12, fontWeight: '700', color: palette.accentMuted, letterSpacing: 0.4}}>
                    Ne kadar önce?
                  </AppText>
                </View>

                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                  {TIMING_OPTIONS.map(opt => (
                    <OptionChip
                      key={opt.value}
                      label={opt.label}
                      selected={notificationTiming === opt.value}
                      onPress={() => setNotificationTiming(opt.value)}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Test bildirimi — her zaman görünür */}
          <View style={{borderTopWidth: 1, borderTopColor: palette.hairline}}>
            <Pressable
              onPress={handleTestNotification}
              disabled={testNotifLoading}
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 18,
                gap: 14,
                opacity: testNotifLoading ? 0.5 : pressed ? 0.7 : 1,
              })}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(244, 241, 234, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {testNotifLoading ? (
                  <ActivityIndicator size="small" color={palette.accent} />
                ) : (
                  <Bell size={18} color={palette.inkMuted} />
                )}
              </View>
              <View style={{flex: 1}}>
                <AppText style={{fontSize: 16, fontWeight: '600', color: palette.ink}}>
                  Test bildirimi gönder
                </AppText>
                <AppText style={{fontSize: 12, color: palette.inkMuted, marginTop: 2}}>
                  Anında bir bildirim alıp test edin
                </AppText>
              </View>
            </Pressable>
          </View>

          {/* Namazdayım — sadece bildirimler açıksa */}
          {notificationsEnabled && (
            <View style={{borderTopWidth: 1, borderTopColor: palette.hairline}}>
              <ToggleRow
                icon={<Moon size={18} color={prayerMode ? palette.accent : palette.inkSubtle} />}
                title="Namazdayım Modu"
                subtitle="Vakit girdiğinde bildirimleri 15 dk susturur"
                value={prayerMode}
                onValueChange={togglePrayerMode}
              />
            </View>
          )}
        </Card>

        {/* ── HAKKINDA ── */}
        <SectionHeader title="Hakkında" icon={<Info size={16} color={palette.accentMuted} />} />
        <Card>
          <View style={{paddingHorizontal: 18, paddingVertical: 16}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
              <AppText style={{fontSize: 14, color: palette.inkMuted}}>Versiyon</AppText>
              <AppText style={{fontSize: 14, fontWeight: '600', color: palette.ink}}>0.0.1</AppText>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <AppText style={{fontSize: 14, color: palette.inkMuted}}>Hesaplama yöntemi</AppText>
              <AppText style={{fontSize: 14, fontWeight: '600', color: palette.ink}}>Diyanet</AppText>
            </View>
          </View>
        </Card>

        {/* Footer */}
        <View style={{alignItems: 'center', paddingTop: 4, paddingBottom: 16}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center'}}>
              <AppText style={{fontSize: 10, fontWeight: '800', color: palette.background}}>K</AppText>
            </View>
            <AppText style={{fontSize: 13, fontWeight: '700', color: palette.ink}}>KalkKıl</AppText>
          </View>
          <AppText style={{fontSize: 11, color: palette.inkSubtle}}>
            Reklamsız · Açık Kaynak
          </AppText>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        icon={alertState.icon}
        onClose={hideAlert}
      />
    </>
  );
}
