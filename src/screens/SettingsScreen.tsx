import React, {useCallback, useRef, useState} from 'react';
import {View, Switch, ScrollView, Pressable, ActivityIndicator, Animated} from 'react-native';
import {AppText} from '../components/AppText';
import {AlertModal} from '../components/AlertModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {GlassView} from '../components/GlassView';
import {getCurrentLocation, reverseGeocode} from '../services/location';
import {requestNotificationPermission, sendTestNotification} from '../services/notifications';
import {saveLocation, setLocationPermissionGranted, getLocationLabel} from '../services/storage';
import {Navigation, Bell, BellOff, Clock, Moon, Sunrise, Sun, Cloud, Sunset, Star, CloudMoon} from 'lucide-react-native';
import {colors, radius, shadows, spacing} from '../theme/tokens';

const TIMING_OPTIONS = [
  {label: 'Tam vaktinde', short: 'Vaktinde', value: 0},
  {label: '5 dk önce', short: '5 dk', value: 5},
  {label: '15 dk önce', short: '15 dk', value: 15},
  {label: '30 dk önce', short: '30 dk', value: 30},
];

const PRAYERS: {name: string; label: string; Icon: typeof Sunrise}[] = [
  {name: 'fajr', label: 'İmsak', Icon: CloudMoon},
  {name: 'sunrise', label: 'Güneş', Icon: Sunrise},
  {name: 'dhuhr', label: 'Öğle', Icon: Sun},
  {name: 'asr', label: 'İkindi', Icon: Cloud},
  {name: 'maghrib', label: 'Akşam', Icon: Sunset},
  {name: 'isha', label: 'Yatsı', Icon: Star},
];

// ─── Atom bileşenler ──────────────────────────────────────────────

function RowIcon({children, active = true}: {children: React.ReactNode; active?: boolean}) {
  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        backgroundColor: active ? colors.accentSoft : 'rgba(244, 241, 234, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: active ? colors.borderStrong : 'transparent',
      }}>
      {children}
    </View>
  );
}

function Divider() {
  return <View style={{height: 1, backgroundColor: colors.border, marginVertical: 2}} />;
}

function SectionLabel({text}: {text: string}) {
  return (
    <AppText
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSubtle,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
        marginLeft: 4,
      }}>
      {text}
    </AppText>
  );
}

/** Tek satır ayar satırı — ikon + başlık/açıklama + sağ eleman */
function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  active = true,
  onPress,
  noBorder,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  noBorder?: boolean;
}) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: noBorder ? 0 : 1,
        borderTopColor: colors.border,
      }}>
      <RowIcon active={active}>{icon}</RowIcon>
      <View style={{flex: 1}}>
        <AppText style={{fontSize: 15, fontWeight: '700', color: colors.text}}>{title}</AppText>
        {subtitle ? (
          <AppText style={{fontSize: 12, color: colors.textMuted, marginTop: 1, lineHeight: 17}}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
        {content}
      </Pressable>
    );
  }
  return content;
}

/** Gruplu kart — birden fazla SettingsRow için */
function SettingsCard({children}: {children: React.ReactNode}) {
  return (
    <GlassView
      intensity="medium"
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        marginBottom: 24,
        ...shadows.subtle,
      }}>
      {children}
    </GlassView>
  );
}

// ─── Ana ekran ────────────────────────────────────────────────────

export function SettingsScreen() {
  const {
    notificationsEnabled,
    toggleNotifications,
    notificationTiming,
    setNotificationTiming,
    prayerNotifications,
    setPrayerNotification,
    requestRefresh,
    prayerMode,
    togglePrayerMode,
  } = useAppContext();

  const insets = useSafeAreaInsets();
  const [locationLoading, setLocationLoading] = useState(false);
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
  }>({visible: false, title: '', message: ''});

  // Bildirim detay expand animasyonu
  const expandAnim = useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const prevEnabled = useRef(notificationsEnabled);

  if (prevEnabled.current !== notificationsEnabled) {
    prevEnabled.current = notificationsEnabled;
    Animated.timing(expandAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }

  const showAlert = useCallback((title: string, message: string, icon?: string) => {
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
      const label = getLocationLabel();
      showAlert('Konum Güncellendi', `Konum: ${label}\n\nVakitler yeniden hesaplanacaktır.`, '📍');
    } else {
      showAlert('Konum Alınamadı', result.error, '⚠️');
    }
    setLocationLoading(false);
  }, [requestRefresh, showAlert]);

  const handleToggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        showAlert(
          'Bildirim İzni Gerekli',
          'Ezan bildirimlerini alabilmek için bildirim iznini vermelisiniz. İzni daha önce reddettiyseniz telefon ayarlarından tekrar açabilirsiniz.',
          '🔔',
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
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 106,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}>

        {/* Arka plan dekor */}
        <View
          style={{
            position: 'absolute',
            top: -100,
            right: -120,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: colors.accentSoft,
          }}
        />

        {/* Başlık */}
        <AppText style={{fontSize: 36, fontWeight: '700', color: colors.text, marginBottom: 2}}>
          Ayarlar
        </AppText>
        <AppText style={{fontSize: 13, color: colors.textSubtle, marginBottom: 28}}>
          KalkKıl'ı kişiselleştir
        </AppText>

        {/* ── KONUM ── */}
        <SectionLabel text="Konum" />
        <SettingsCard>
          <SettingsRow
            noBorder
            icon={<Navigation size={18} color={colors.accent} />}
            title="Kayıtlı konum"
            subtitle="Her açılışta GPS aramaz, son kaydedilen konumla çalışır."
            right={null}
          />
          <Divider />
          <View style={{paddingVertical: 12}}>
            <Pressable
              onPress={handleRefreshLocation}
              disabled={locationLoading}
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: pressed ? colors.accentSoft : colors.surfaceSoft,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: pressed ? colors.accent : colors.borderStrong,
                paddingVertical: 13,
                opacity: locationLoading ? 0.7 : 1,
                transform: [{scale: pressed ? 0.97 : 1}],
              })}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Navigation size={15} color={colors.accent} strokeWidth={2.5} />
              )}
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: locationLoading ? colors.textMuted : colors.accent,
                  letterSpacing: 0.2,
                }}>
                {locationLoading ? 'Konum alınıyor…' : 'Konumu güncelle'}
              </AppText>
            </Pressable>
          </View>
        </SettingsCard>

        {/* ── BİLDİRİMLER ── */}
        <SectionLabel text="Bildirimler" />
        <SettingsCard>
          {/* Ana toggle */}
          <SettingsRow
            noBorder
            icon={
              notificationsEnabled ? (
                <Bell size={18} color={colors.accent} />
              ) : (
                <BellOff size={18} color={colors.textSubtle} />
              )
            }
            active={notificationsEnabled}
            title="Vakit bildirimleri"
            subtitle="Her ezan öncesi veya tam vaktinde hatırlatma."
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}}
                thumbColor={notificationsEnabled ? colors.accent : 'rgba(244,241,234,0.45)'}
              />
            }
          />

          {/* Expand animasyonlu bölüm */}
          <Animated.View
            style={{
              overflow: 'hidden',
              maxHeight: expandAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 900],
              }),
              opacity: expandAnim,
            }}>
            <Divider />

            {/* Zamanlama — Namazdayım Modu aynı bölümde */}
            <View style={{paddingTop: 14, paddingBottom: 6}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10}}>
                <Clock size={14} color={colors.accentMuted} />
                <AppText
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors.accentMuted,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                  }}>
                  Ne kadar önce?
                </AppText>
              </View>

              {/* Segmented chip seçimi */}
              <View style={{flexDirection: 'row', gap: 6}}>
                {TIMING_OPTIONS.map(opt => {
                  const isActive = notificationTiming === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNotificationTiming(opt.value)}
                      style={({pressed}) => ({
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 9,
                        borderRadius: radius.md,
                        backgroundColor: isActive
                          ? colors.accentSoft
                          : pressed
                          ? colors.surfaceMuted
                          : 'rgba(244,241,234,0.05)',
                        borderWidth: 1,
                        borderColor: isActive ? colors.borderStrong : colors.border,
                      })}>
                      <AppText
                        style={{
                          fontSize: 12,
                          fontWeight: '700',
                          color: isActive ? colors.accent : colors.textMuted,
                        }}>
                        {opt.short}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Divider />

            {/* Namazdayım modu — bildirimle ilgili olduğu için buraya taşındı */}
            <SettingsRow
              icon={<Moon size={17} color={prayerMode ? colors.accent : colors.textSubtle} />}
              active={prayerMode}
              title="Namazdayım Modu"
              subtitle="Vakit girdiğinde bildirimleri 15 dk susturur."
              right={
                <Switch
                  value={prayerMode}
                  onValueChange={togglePrayerMode}
                  trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}}
                  thumbColor={prayerMode ? colors.accent : 'rgba(244,241,234,0.45)'}
                />
              }
            />

            <Divider />

            {/* Vakit bazında togglelar */}
            <View style={{paddingTop: 12, paddingBottom: 4}}>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.textSubtle,
                  textTransform: 'uppercase',
                  letterSpacing: 1.6,
                  marginBottom: 4,
                }}>
                Vakit bazında
              </AppText>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8}}>
                {PRAYERS.map(prayer => {
                  const enabled =
                    prayerNotifications[prayer.name as keyof typeof prayerNotifications];
                  const {Icon} = prayer;
                  return (
                    <Pressable
                      key={prayer.name}
                      onPress={() => setPrayerNotification(prayer.name, !enabled)}
                      style={({pressed}) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.md,
                        backgroundColor: enabled
                          ? colors.accentSoft
                          : pressed
                          ? colors.surfaceMuted
                          : 'rgba(244,241,234,0.05)',
                        borderWidth: 1,
                        borderColor: enabled ? colors.borderStrong : colors.border,
                      })}>
                      <Icon
                        size={14}
                        color={enabled ? colors.accent : colors.textSubtle}
                        strokeWidth={2.2}
                      />
                      <AppText
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: enabled ? colors.accent : colors.textMuted,
                        }}>
                        {prayer.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Divider />

            {/* Test bildirimi — kart altında, ayrı kart değil */}
            <View style={{paddingVertical: 12}}>
              <Pressable
                onPress={async () => {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    showAlert(
                      'Bildirim İzni Gerekli',
                      'Test bildirimi gönderebilmek için bildirim iznini vermelisiniz.',
                      '🔔',
                    );
                    return;
                  }
                  await sendTestNotification();
                  showAlert(
                    'Bildirim Gönderildi',
                    'Test bildirimi gönderildi. Bildirim çekmecesini kontrol edin.',
                    '✅',
                  );
                }}
                style={({pressed}) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: pressed ? colors.accentSoft : 'transparent',
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  paddingVertical: 12,
                })}>
                <Bell size={15} color={colors.accent} />
                <AppText style={{fontSize: 14, fontWeight: '600', color: colors.accent}}>
                  Test bildirimi gönder
                </AppText>
              </Pressable>
            </View>
          </Animated.View>
        </SettingsCard>

        {/* Footer */}
        <View style={{alignItems: 'center', paddingTop: 4, paddingBottom: 8}}>
          <AppText style={{fontSize: 11, color: colors.textSubtle, textAlign: 'center'}}>
            Reklamsız · Diyanet İşleri Başkanlığı metodu
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
