import React, {useCallback, useState} from 'react';
import {View, Switch, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {AppText} from '../components/AppText';
import {AlertModal} from '../components/AlertModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {GlassView} from '../components/GlassView';
import {QiblaScreen} from '../screens/QiblaScreen';
import {getCurrentLocation, reverseGeocode} from '../services/location';
import {requestNotificationPermission, sendTestNotification} from '../services/notifications';
import {saveLocation, setLocationPermissionGranted, getLocationLabel, getLocation} from '../services/storage';
import {Bell, BellOff, Clock, Moon, Sunrise, Sun, Cloud, Sunset, Star, CloudMoon} from 'lucide-react-native';
import {colors, radius, shadows} from '../theme/tokens';

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

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  noBorder?: boolean;
}

function SettingsRow({icon, title, subtitle, right, active = true, onPress, noBorder}: SettingsRowProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
        borderTopWidth: noBorder ? 0 : 1,
        borderTopColor: colors.border,
      }}>
      <RowIcon active={active}>{icon}</RowIcon>
      <View style={{flex: 1}}>
        <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>{title}</AppText>
        {subtitle ? (
          <AppText style={{fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18}}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
        {content}
      </Pressable>
    );
  }
  return content;
}

function SettingsCard({children}: {children: React.ReactNode}) {
  return (
    <GlassView
      intensity="medium"
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 18,
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
  const [qiblaVisible, setQiblaVisible] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; icon?: string}>({
    visible: false,
    title: '',
    message: '',
  });

  const savedLocation = getLocation();
  const locationLabel = savedLocation ? getLocationLabel() : 'Konum ayarlanmadı';

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
      showAlert('Konum Güncellendi', `Konum: ${getLocationLabel()}\n\nVakitler yeniden hesaplanacaktır.`, '📍');
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
        <AppText style={{fontSize: 36, fontWeight: '700', color: colors.text, marginBottom: 28}}>
          Ayarlar
        </AppText>

        {/* ── KONUM ── */}
        <SectionLabel text="Konum" />
        <SettingsCard>
          {/* Sade: ikonsuz, direkt konum adı */}
          <View style={{paddingTop: 16, paddingBottom: 4}}>
            <AppText style={{fontSize: 17, fontWeight: '700', color: colors.text}}>
              {locationLabel}
            </AppText>
            {savedLocation ? (
              <AppText style={{fontSize: 12, color: colors.textSubtle, marginTop: 2}}>
                {savedLocation.latitude.toFixed(4)}, {savedLocation.longitude.toFixed(4)}
              </AppText>
            ) : null}
          </View>

          {/* Sade buton — ikon yok, sadece yazı */}
          <View style={{paddingTop: 10, paddingBottom: 16}}>
            <Pressable
              onPress={handleRefreshLocation}
              disabled={locationLoading}
              style={({pressed}) => ({
                backgroundColor: pressed ? colors.accentSoft : colors.surfaceSoft,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: locationLoading ? 0.7 : 1,
              })}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <AppText style={{fontSize: 14, fontWeight: '600', color: colors.accent}}>
                  GPS ile Güncelle
                </AppText>
              )}
            </Pressable>
          </View>
        </SettingsCard>

        {/* ── KIBLE ── */}
        <SectionLabel text="Kıble" />
        <Pressable
          onPress={() => setQiblaVisible(true)}
          style={({pressed}) => ({
            backgroundColor: pressed ? colors.accentSoft : colors.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: pressed ? colors.borderStrong : colors.border,
            padding: 24,
            alignItems: 'center',
            marginBottom: 24,
            ...shadows.subtle,
            transform: [{scale: pressed ? 0.98 : 1}],
          })}>
          <AppText style={{fontSize: 40, marginBottom: 10}}>🕋</AppText>
          <AppText style={{fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4}}>
            Kıble Pusulası
          </AppText>
          <AppText style={{fontSize: 13, color: colors.textMuted, textAlign: 'center'}}>
            Kâbe yönünü bulmak için açın
          </AppText>
        </Pressable>

        {/* ── BİLDİRİMLER ── */}
        <SectionLabel text="Bildirimler" />
        <SettingsCard>
          {/* Ana toggle — ferah */}
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
            subtitle="Her ezan öncesi veya tam vaktinde hatırlatma"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}}
                thumbColor={notificationsEnabled ? colors.accent : 'rgba(244,241,234,0.45)'}
              />
            }
          />

          <View style={{opacity: notificationsEnabled ? 1 : 0.35}}>
            {/* Zamanlama — ferah */}
            <View style={{borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, paddingBottom: 8}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14}}>
                <Clock size={15} color={colors.accentMuted} />
                <AppText style={{fontSize: 12, fontWeight: '700', color: colors.accentMuted, textTransform: 'uppercase', letterSpacing: 1.8}}>
                  Ne kadar önce?
                </AppText>
              </View>

              {/* Timing chip'leri — 2x2 grid, daha geniş */}
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
                {TIMING_OPTIONS.map(opt => {
                  const isActive = notificationTiming === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNotificationTiming(opt.value)}
                      style={({pressed}) => ({
                        flex: 1,
                        minWidth: '45%',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        backgroundColor: isActive
                          ? colors.accentSoft
                          : pressed
                          ? colors.surfaceMuted
                          : 'rgba(244,241,234,0.05)',
                        borderWidth: 1,
                        borderColor: isActive ? colors.borderStrong : colors.border,
                      })}>
                      <AppText style={{fontSize: 13, fontWeight: '700', color: isActive ? colors.accent : colors.textMuted}}>
                        {opt.short}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Namazdayım modu */}
            <View style={{borderTopWidth: 1, borderTopColor: colors.border}}>
              <SettingsRow
                icon={<Moon size={17} color={prayerMode ? colors.accent : colors.textSubtle} />}
                active={prayerMode}
                title="Namazdayım Modu"
                subtitle="Vakit girdiğinde bildirimleri 15 dk susturur"
                right={
                  <Switch
                    value={prayerMode}
                    onValueChange={togglePrayerMode}
                    trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}}
                    thumbColor={prayerMode ? colors.accent : 'rgba(244,241,234,0.45)'}
                  />
                }
              />
            </View>

            {/* Vakit bazında toggle'lar — ferah 3x2 grid */}
            <View style={{borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, paddingBottom: 8}}>
              <AppText style={{fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 6}}>
                Vakit bazında
              </AppText>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 10}}>
                {PRAYERS.map(prayer => {
                  const enabled = prayerNotifications[prayer.name as keyof typeof prayerNotifications];
                  const {Icon} = prayer;
                  return (
                    <Pressable
                      key={prayer.name}
                      onPress={() => setPrayerNotification(prayer.name, !enabled)}
                      style={({pressed}) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: radius.md,
                        backgroundColor: enabled
                          ? colors.accentSoft
                          : pressed
                          ? colors.surfaceMuted
                          : 'rgba(244,241,234,0.05)',
                        borderWidth: 1,
                        borderColor: enabled ? colors.borderStrong : colors.border,
                      })}>
                      <Icon size={16} color={enabled ? colors.accent : colors.textSubtle} strokeWidth={2.2} />
                      <AppText style={{fontSize: 14, fontWeight: '700', color: enabled ? colors.accent : colors.textMuted}}>
                        {prayer.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Test butonu */}
            <View style={{borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 16}}>
              <Pressable
                onPress={async () => {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    showAlert('Bildirim İzni Gerekli', 'Test bildirimi gönderebilmek için bildirim iznini vermelisiniz.', '🔔');
                    return;
                  }
                  await sendTestNotification();
                  showAlert('Bildirim Gönderildi', 'Test bildirimi gönderildi. Bildirim çekmecesini kontrol edin.', '✅');
                }}
                style={({pressed}) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: pressed ? colors.accentSoft : 'transparent',
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  paddingVertical: 14,
                })}>
                <Bell size={16} color={colors.accent} />
                <AppText style={{fontSize: 14, fontWeight: '600', color: colors.accent}}>
                  Test bildirimi gönder
                </AppText>
              </Pressable>
            </View>
          </View>
        </SettingsCard>

        {/* ── HAKKINDA ── */}
        <SectionLabel text="Hakkında" />
        <SettingsCard>
          <SettingsRow
            noBorder
            icon={<View style={{width: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center'}}><AppText style={{fontSize: 11, fontWeight: '700', color: colors.background}}>K</AppText></View>}
            title="Versiyon"
            right={<AppText style={{fontSize: 14, color: colors.textMuted}}>0.0.1</AppText>}
          />
          <SettingsRow
            icon={<View style={{alignItems: 'center', justifyContent: 'center', width: 20}}><AppText style={{fontSize: 15}}>📖</AppText></View>}
            title="Hesaplama yöntemi"
            right={<AppText style={{fontSize: 14, color: colors.textMuted}}>Diyanet</AppText>}
          />
        </SettingsCard>

        {/* Footer */}
        <View style={{alignItems: 'center', paddingTop: 8, paddingBottom: 8}}>
          <AppText style={{fontSize: 11, color: colors.textSubtle, textAlign: 'center', lineHeight: 16}}>
            Reklamsız · Açık Kaynak
          </AppText>
        </View>
      </ScrollView>

      {/* Kıble full-screen modal */}
      <QiblaScreen visible={qiblaVisible} onClose={() => setQiblaVisible(false)} />

      <AlertModal visible={alertState.visible} title={alertState.title} message={alertState.message} icon={alertState.icon} onClose={hideAlert} />
    </>
  );
}
