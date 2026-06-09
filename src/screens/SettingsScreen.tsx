import React, {useCallback, useState} from 'react';
import {View, Switch, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {AppText} from '../components/AppText';
import {AlertModal} from '../components/AlertModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {GlassView} from '../components/GlassView';
import {getCurrentLocation} from '../services/location';
import {requestNotificationPermission, sendTestNotification} from '../services/notifications';
import {saveLocation, setLocationPermissionGranted} from '../services/storage';
import {Navigation, Bell, BellOff, Clock, Sunrise, Moon} from 'lucide-react-native';
import {colors, radius, shadows} from '../theme/tokens';

const TIMING_OPTIONS = [
  {label: 'Vaktinde', value: 0},
  {label: '5 dk', value: 5},
  {label: '15 dk', value: 15},
  {label: '30 dk', value: 30},
];

const PRAYERS = [
  {name: 'fajr', label: 'İmsak'},
  {name: 'sunrise', label: 'Güneş'},
  {name: 'dhuhr', label: 'Öğle'},
  {name: 'asr', label: 'İkindi'},
  {name: 'maghrib', label: 'Akşam'},
  {name: 'isha', label: 'Yatsı'},
];

function GlassCard({children}: {children: React.ReactNode}) {
  return (
    <GlassView
      intensity="medium"
      style={{
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 18,
        padding: 18,
        ...shadows.subtle,
      }}>
      {children}
    </GlassView>
  );
}

function SectionTitle({text}: {text: string}) {
  return (
    <AppText style={{fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 10, marginTop: 2}}>
      {text}
    </AppText>
  );
}

function RowIcon({children, active = true}: {children: React.ReactNode; active?: boolean}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: active ? colors.accentSoft : 'rgba(244, 241, 234, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const {notificationsEnabled, toggleNotifications, notificationTiming, setNotificationTiming, prayerNotifications, setPrayerNotification, requestRefresh, prayerMode, togglePrayerMode} = useAppContext();
  const insets = useSafeAreaInsets();
  const [locationLoading, setLocationLoading] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; icon?: string}>({visible: false, title: '', message: ''});

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
      saveLocation(result.latitude, result.longitude);
      setLocationPermissionGranted(true);
      requestRefresh();
      showAlert('Konum Güncellendi', 'Vakitler kayıtlı konuma göre yeniden hesaplanacaktır.', '📍');
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
        contentContainerStyle={{paddingTop: insets.top + 20, paddingBottom: insets.bottom + 106, paddingHorizontal: 16}}
        showsVerticalScrollIndicator={false}>
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

        <AppText style={{fontSize: 36, fontWeight: '700', color: colors.text, marginBottom: 2}}>Ayarlar</AppText>
        <AppText style={{fontSize: 13, color: colors.textSubtle, marginBottom: 26}}>KalkKıl deneyimini sade şekilde düzenleyin</AppText>

        <SectionTitle text="Konum" />
        <GlassCard>
          <View style={{flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 14}}>
            <RowIcon>
              <Navigation size={18} color={colors.accent} />
            </RowIcon>
            <View style={{flex: 1}}>
              <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>Kayıtlı konum</AppText>
              <AppText style={{fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 2}}>
                Uygulama her açılışta GPS aramaz; kayıtlı konumla vakitleri hesaplar.
              </AppText>
            </View>
          </View>

          <Pressable
            onPress={handleRefreshLocation}
            disabled={locationLoading}
            style={({pressed}) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingVertical: 13,
              opacity: locationLoading ? 0.6 : 1,
            })}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Navigation size={16} color={colors.accent} />
            )}
            <AppText style={{fontSize: 15, fontWeight: '600', color: locationLoading ? colors.textMuted : colors.accent}}>
              {locationLoading ? 'Konum alınıyor…' : 'Konumu yenile'}
            </AppText>
          </Pressable>
        </GlassCard>

        <SectionTitle text="Namaz Modu" />
        <GlassCard>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <RowIcon active={prayerMode}>
                <Moon size={18} color={prayerMode ? colors.accent : colors.textSubtle} />
              </RowIcon>
              <View style={{flex: 1}}>
                <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>Namazdayım Modu</AppText>
                <AppText style={{fontSize: 13, color: colors.textMuted, lineHeight: 18, marginTop: 2}}>
                  Vakit girdiğinde bildirimleri kısa süre susturur.
                </AppText>
              </View>
            </View>
            <Switch value={prayerMode} onValueChange={togglePrayerMode} trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}} thumbColor={prayerMode ? colors.accent : 'rgba(244,241,234,0.45)'} />
          </View>
        </GlassCard>

        <SectionTitle text="Bildirimler" />
        <GlassCard>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: notificationsEnabled ? 18 : 0}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
              <RowIcon active={notificationsEnabled}>
                {notificationsEnabled ? <Bell size={18} color={colors.accent} /> : <BellOff size={18} color={colors.textSubtle} />}
              </RowIcon>
              <View style={{flex: 1}}>
                <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>Vakit bildirimleri</AppText>
                <AppText style={{fontSize: 13, color: colors.textMuted, marginTop: 2}}>Tüm bildirimleri aç veya kapat.</AppText>
              </View>
            </View>
            <Switch value={notificationsEnabled} onValueChange={handleToggleNotifications} trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}} thumbColor={notificationsEnabled ? colors.accent : 'rgba(244,241,234,0.45)'} />
          </View>

          {notificationsEnabled && (
            <>
              <View style={{height: 1, backgroundColor: colors.border, marginBottom: 14}} />

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12}}>
                <RowIcon>
                  <Clock size={18} color={colors.accent} />
                </RowIcon>
                <View>
                  <AppText style={{fontSize: 16, fontWeight: '700', color: colors.text}}>Bildirim zamanı</AppText>
                  <AppText style={{fontSize: 13, color: colors.textMuted, marginTop: 2}}>Vakit girmeden ne kadar önce?</AppText>
                </View>
              </View>

              {/* Vakit seçimi — radio listesi */}
              <View style={{gap: 6, marginBottom: 20}}>
                {TIMING_OPTIONS.map(opt => {
                  const isActive = notificationTiming === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNotificationTiming(opt.value)}
                      style={({pressed}) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 14,
                        borderRadius: radius.sm,
                        backgroundColor: isActive
                          ? colors.accentSoft
                          : pressed
                            ? colors.surfaceMuted
                            : 'transparent',
                        borderWidth: 1,
                        borderColor: isActive ? colors.borderStrong : 'transparent',
                      })}>
                      {/* Radio indicator */}
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isActive ? colors.accent : colors.textSubtle,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {isActive && (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: colors.accent,
                            }}
                          />
                        )}
                      </View>
                      {/* Label + description */}
                      <View style={{flex: 1}}>
                        <AppText
                          style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: isActive ? colors.accent : colors.text,
                          }}>
                          {opt.label}
                        </AppText>
                        <AppText
                          style={{
                            fontSize: 11,
                            color: colors.textSubtle,
                            marginTop: 1,
                          }}>
                          {opt.value === 0
                            ? 'Bildirim vakit girdiğinde gönderilir'
                            : `Vakit girmeden ${opt.value} dakika önce bildirim gelir`}
                        </AppText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <AppText style={{fontSize: 12, fontWeight: '700', color: colors.textSubtle, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8}}>Vakit bazında</AppText>
              {PRAYERS.map(prayer => {
                const enabled = prayerNotifications[prayer.name as keyof typeof prayerNotifications];
                return (
                  <View key={prayer.name} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                      <RowIcon active={enabled}>
                        <Sunrise size={16} color={enabled ? colors.accent : colors.textSubtle} />
                      </RowIcon>
                      <AppText style={{fontSize: 15, fontWeight: '600', color: colors.text}}>{prayer.label}</AppText>
                    </View>
                    <Switch value={enabled} onValueChange={v => setPrayerNotification(prayer.name, v)} trackColor={{false: 'rgba(244,241,234,0.12)', true: colors.accentSoft}} thumbColor={enabled ? colors.accent : 'rgba(244,241,234,0.45)'} />
                  </View>
                );
              })}
            </>
          )}
        </GlassCard>

        <SectionTitle text="Test" />
        <GlassCard>
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
              showAlert('Bildirim Gönderildi', 'Bir test bildirimi gönderildi. Bildirim çekmecesini kontrol edin.', '✅');
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
              paddingVertical: 13,
            })}>
            <Bell size={16} color={colors.accent} />
            <AppText style={{fontSize: 15, fontWeight: '600', color: colors.accent}}>
              Test bildirimi gönder
            </AppText>
          </Pressable>
        </GlassCard>

        <View style={{alignItems: 'center', paddingTop: 6, paddingBottom: 12}}>
          <AppText style={{fontSize: 12, color: colors.textSubtle, textAlign: 'center'}}>
            Reklamsız · Diyanet İşleri Başkanlığı metodu
          </AppText>
        </View>
      </ScrollView>
      <AlertModal visible={alertState.visible} title={alertState.title} message={alertState.message} icon={alertState.icon} onClose={hideAlert} />
    </>
  );
}
