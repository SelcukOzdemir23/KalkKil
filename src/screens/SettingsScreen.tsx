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
import {colors, radius, shadows} from '../theme/tokens';

const TIMING_OPTIONS = [
  {label: 'Tam vaktinde', value: 0},
  {label: '5 dk önce', value: 5},
  {label: '15 dk önce', value: 15},
  {label: '30 dk önce', value: 30},
];

// ─── Bölüm Başlığı ─────────────────────────────────────────────

function SectionHeader({title, icon}: {title: string; icon?: React.ReactNode}) {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 4}}>
      {icon}
      <AppText
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: colors.accentMuted,
          letterSpacing: 0.4,
        }}>
        {title}
      </AppText>
    </View>
  );
}

// ─── Kart Bileşeni ─────────────────────────────────────────────

function Card({children}: {children: React.ReactNode}) {
  return (
    <View
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
        backgroundColor: colors.surface,
        ...shadows.subtle,
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
          backgroundColor: value ? colors.accentSoft : 'rgba(244, 241, 234, 0.05)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {icon}
      </View>
      <View style={{flex: 1}}>
        <AppText style={{fontSize: 16, fontWeight: '600', color: colors.text}}>
          {title}
        </AppText>
        {subtitle && (
          <AppText style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>
            {subtitle}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: 'rgba(244,241,234,0.1)', true: colors.accentSoft}}
        thumbColor={value ? colors.accent : 'rgba(244,241,234,0.4)'}
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
          ? colors.accentSoft
          : pressed
          ? colors.surfaceMuted
          : 'rgba(244,241,234,0.04)',
        borderWidth: 1.5,
        borderColor: selected ? colors.accent : colors.border,
      })}>
      <AppText
        style={{
          fontSize: 14,
          fontWeight: selected ? '800' : '600',
          color: selected ? colors.accent : colors.textMuted,
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
        <MapPin size={24} color={colors.accent} />,
      );
    } else {
      showAlert('Konum Alınamadı', result.error, <AlertTriangle size={24} color={colors.danger} />);
    }
    setLocationLoading(false);
  }, [requestRefresh, showAlert]);

  const handleTestNotification = useCallback(async () => {
    setTestNotifLoading(true);
    try {
      await sendTestNotification();
      showAlert(
        'Bildirim Gönderildi',
        'Bildirim çubuğunu kontrol edin. Eğer bildirim görmediyseniz, telefonunuzun bildirim izinlerini kontrol edin.',
        <Bell size={24} color={colors.accent} />,
      );
    } catch {
      showAlert(
        'Bildirim Gönderilemedi',
        'Bir hata oluştu. Bildirim izinlerini kontrol edin.',
        <AlertTriangle size={24} color={colors.danger} />,
      );
    }
    setTestNotifLoading(false);
  }, [showAlert]);

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          'Bildirim İzni Gerekli',
          'Ezan bildirimlerini alabilmek için bildirim iznini vermelisiniz. İzni daha önce reddettiyseniz telefon ayarlarından tekrar açabilirsiniz.',
          <Bell size={24} color={colors.accent} />,
        );
        return;
      }
    }
    toggleNotifications();
  }, [notificationsEnabled, showAlert, toggleNotifications]);

  return (
    <>
      <ScrollView
        style={{flex: 1, backgroundColor: colors.background}}
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}>


        {/* Başlık */}
        <View style={{marginBottom: 32}}>
          <AppText style={{fontSize: 32, fontWeight: '800', color: colors.text}}>
            Ayarlar
          </AppText>
          <AppText style={{fontSize: 14, color: colors.textMuted, marginTop: 4}}>
            Uygulama tercihlerini düzenleyin
          </AppText>
        </View>

        {/* ── KONUM ── */}
        <SectionHeader title="Konum" icon={<MapPin size={16} color={colors.accentMuted} />} />
        <Card>
          <View style={{padding: 18}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.greenSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Navigation size={20} color={colors.green} />
              </View>
              <View style={{flex: 1}}>
                <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>
                  {locationLabel}
                </AppText>
                {savedLocation && (
                  <AppText style={{fontSize: 11, color: colors.textSubtle, marginTop: 1}}>
                    {savedLocation.latitude.toFixed(4)}, {savedLocation.longitude.toFixed(4)}
                  </AppText>
                )}
              </View>
            </View>

            <Pressable
              onPress={handleRefreshLocation}
              disabled={locationLoading}
              style={({pressed}) => ({
                backgroundColor: pressed ? colors.accentSoft : colors.surfaceSoft,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 13,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: locationLoading ? 0.7 : 1,
              })}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Navigation size={14} color={colors.accent} />
                  <AppText style={{fontSize: 14, fontWeight: '600', color: colors.accent}}>
                    GPS ile Güncelle
                  </AppText>
                </>
              )}
            </Pressable>
          </View>
        </Card>

        {/* ── BİLDİRİMLER ── */}
        <SectionHeader title="Bildirimler" icon={<Bell size={16} color={colors.accentMuted} />} />
        <Card>
          <ToggleRow
            icon={
              notificationsEnabled ? (
                <Bell size={18} color={colors.accent} />
              ) : (
                <BellOff size={18} color={colors.textSubtle} />
              )
            }
            title="Vakit bildirimleri"
            subtitle="Ezan öncesi veya tam vaktinde hatırlatma"
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
          />

          {notificationsEnabled && (
            <>
              {/* Zamanlama */}
              <View style={{borderTopWidth: 1, borderTopColor: colors.border}}>
                <View style={{paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14}}>
                    <Clock size={14} color={colors.accentMuted} />
                    <AppText style={{fontSize: 12, fontWeight: '700', color: colors.accentMuted, letterSpacing: 0.4}}>
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

              {/* Test bildirimi */}
              <View style={{borderTopWidth: 1, borderTopColor: colors.border}}>
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
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Bell size={18} color={colors.textMuted} />
                    )}
                  </View>
                  <View style={{flex: 1}}>
                    <AppText style={{fontSize: 16, fontWeight: '600', color: colors.text}}>
                      Test bildirimi gönder
                    </AppText>
                    <AppText style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>
                      Anında bir bildirim alıp test edin
                    </AppText>
                  </View>
                </Pressable>
              </View>

              {/* Namazdayım */}
              <View style={{borderTopWidth: 1, borderTopColor: colors.border}}>
                <ToggleRow
                  icon={<Moon size={18} color={prayerMode ? colors.accent : colors.textSubtle} />}
                  title="Namazdayım Modu"
                  subtitle="Vakit girdiğinde bildirimleri 15 dk susturur"
                  value={prayerMode}
                  onValueChange={togglePrayerMode}
                />
              </View>
            </>
          )}
        </Card>

        {/* ── HAKKINDA ── */}
        <SectionHeader title="Hakkında" icon={<Info size={16} color={colors.accentMuted} />} />
        <Card>
          <View style={{paddingHorizontal: 18, paddingVertical: 16}}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
              <AppText style={{fontSize: 14, color: colors.textMuted}}>Versiyon</AppText>
              <AppText style={{fontSize: 14, fontWeight: '600', color: colors.text}}>0.0.1</AppText>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
              <AppText style={{fontSize: 14, color: colors.textMuted}}>Hesaplama yöntemi</AppText>
              <AppText style={{fontSize: 14, fontWeight: '600', color: colors.text}}>Diyanet</AppText>
            </View>
          </View>
        </Card>

        {/* Footer */}
        <View style={{alignItems: 'center', paddingTop: 4, paddingBottom: 16}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center'}}>
              <AppText style={{fontSize: 10, fontWeight: '800', color: colors.background}}>K</AppText>
            </View>
            <AppText style={{fontSize: 13, fontWeight: '700', color: colors.text}}>KalkKıl</AppText>
          </View>
          <AppText style={{fontSize: 11, color: colors.textSubtle}}>
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
