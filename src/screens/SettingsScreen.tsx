import React, {useCallback, useState} from 'react';
import {View, Switch, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {AppText} from '../components/AppText';
import {AlertModal} from '../components/AlertModal';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppContext} from '../context/AppContext';
import {GlassView} from '../components/GlassView';
import {getCurrentLocation} from '../services/location';
import {saveLocation, setLocationPermissionGranted} from '../services/storage';
import {Navigation, Bell, BellOff, Clock, Sunrise, Moon} from 'lucide-react-native';

const TIMING_OPTIONS = [
  {label: 'Vaktinde', value: 0},
  {label: '5dk', value: 5},
  {label: '15dk', value: 15},
  {label: '30dk', value: 30},
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
    <GlassView intensity="medium" style={{borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', marginBottom: 16, padding: 20}}>
      {children}
    </GlassView>
  );
}

function SectionTitle({text}: {text: string}) {
  return (
    <AppText style={{fontSize: 11, fontWeight: '700', color: 'rgba(0, 212, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 10, marginTop: 4}}>
      {text}
    </AppText>
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
      showAlert('Konum Güncellendi', 'Vakitler bulunduğunuz konuma göre hesaplanacaktır.', '📍');
    } else {
      showAlert('Konum Alınamadı', result.error, '⚠️');
    }
    setLocationLoading(false);
  }, [requestRefresh, showAlert]);

  const accent = '#00D4FF';

  return (
    <>
    <ScrollView style={{flex: 1, backgroundColor: '#0A0E1A'}}
      contentContainerStyle={{paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100, paddingHorizontal: 16}}
      showsVerticalScrollIndicator={false}>

      <AppText style={{fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4}}>Ayarlar</AppText>
      <AppText style={{fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24}}>KalkKıl v1.0.0</AppText>

      {/* LOCATION */}
      <SectionTitle text="KONUM" />
      <GlassCard>
        <AppText style={{fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 18}}>
          Uygulama, namaz vakitlerini bulunduğunuz konuma göre otomatik hesaplar.
        </AppText>

        {/* Refresh location button */}
        <Pressable
          onPress={handleRefreshLocation}
          disabled={locationLoading}
          style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0, 212, 255, 0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0, 212, 255, 0.15)', paddingVertical: 14}}>
          {locationLoading ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <Navigation size={16} color={accent} />
          )}
          <AppText style={{fontSize: 14, fontWeight: '600', color: locationLoading ? 'rgba(255,255,255,0.3)' : accent}}>
            {locationLoading ? 'Konum alınıyor...' : 'GPS ile Konum Al'}
          </AppText>
        </Pressable>
      </GlassCard>

      {/* PRAYER MODE */}
      <SectionTitle text="NAMAZ MODU" />
      <GlassCard>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
            <View style={{width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 212, 255, 0.08)', alignItems: 'center', justifyContent: 'center'}}>
              <Moon size={16} color={prayerMode ? accent : 'rgba(255,255,255,0.3)'} />
            </View>
            <View>
              <AppText style={{fontSize: 14, fontWeight: '500', color: '#FFFFFF'}}>Namazdayım Modu</AppText>
              <AppText style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, maxWidth: 200}}>
                Vakit girdiğinde bildirimleri 15 dk susturur
              </AppText>
            </View>
          </View>
          <Switch value={prayerMode} onValueChange={togglePrayerMode} trackColor={{false: 'rgba(255,255,255,0.1)', true: `${accent}50`}} thumbColor={prayerMode ? accent : 'rgba(255,255,255,0.3)'} />
        </View>
      </GlassCard>

      {/* NOTIFICATIONS */}
      <SectionTitle text="BİLDİRİMLER" />
      <GlassCard>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
            <View style={{width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 212, 255, 0.08)', alignItems: 'center', justifyContent: 'center'}}>
              {notificationsEnabled ? <Bell size={16} color={accent} /> : <BellOff size={16} color="rgba(255,255,255,0.3)" />}
            </View>
            <View>
              <AppText style={{fontSize: 14, fontWeight: '500', color: '#FFFFFF'}}>Ezan Bildirimleri</AppText>
              <AppText style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1}}>Tüm bildirimleri aç/kapa</AppText>
            </View>
          </View>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} trackColor={{false: 'rgba(255,255,255,0.1)', true: `${accent}50`}} thumbColor={notificationsEnabled ? accent : 'rgba(255,255,255,0.3)'} />
        </View>

        {notificationsEnabled && (
          <>
            <AppText style={{fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 16, marginBottom: 8}}>Vakit Bazında</AppText>
            {PRAYERS.map(prayer => (
              <View key={prayer.name} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)'}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                  <View style={{width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 212, 255, 0.08)', alignItems: 'center', justifyContent: 'center'}}>
                    <Sunrise size={14} color={prayerNotifications[prayer.name as keyof typeof prayerNotifications] ? accent : 'rgba(255,255,255,0.2)'} />
                  </View>
                  <AppText style={{fontSize: 14, fontWeight: '500', color: '#FFFFFF'}}>{prayer.label}</AppText>
                </View>
                <Switch value={prayerNotifications[prayer.name as keyof typeof prayerNotifications]} onValueChange={v => setPrayerNotification(prayer.name, v)} trackColor={{false: 'rgba(255,255,255,0.1)', true: `${accent}50`}} thumbColor={prayerNotifications[prayer.name as keyof typeof prayerNotifications] ? accent : 'rgba(255,255,255,0.3)'} />
              </View>
            ))}

            {/* Timing presets */}
            <View style={{paddingVertical: 12, marginTop: 4}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10}}>
                <View style={{width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 212, 255, 0.08)', alignItems: 'center', justifyContent: 'center'}}>
                  <Clock size={16} color={accent} />
                </View>
                <View>
                  <AppText style={{fontSize: 14, fontWeight: '500', color: '#FFFFFF'}}>Bildirim Zamanı</AppText>
                  <AppText style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1}}>Vakit girmeden ne kadar önce?</AppText>
                </View>
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                {TIMING_OPTIONS.map(opt => {
                  const isActive = notificationTiming === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNotificationTiming(opt.value)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        alignItems: 'center',
                        backgroundColor: isActive ? accent : 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: isActive ? accent : 'rgba(255,255,255,0.06)',
                      }}>
                      <AppText style={{fontSize: 12, fontWeight: '600', color: isActive ? '#000' : 'rgba(255,255,255,0.6)'}}>
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </GlassCard>

      {/* APP INFO */}
      <View style={{alignItems: 'center', paddingTop: 8}}>
        <AppText style={{fontSize: 11, color: 'rgba(255, 255, 255, 0.2)', textAlign: 'center'}}>
          Diyanet İşleri Başkanlığı metodu
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
