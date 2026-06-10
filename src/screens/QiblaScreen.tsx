import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Animated, Modal, Pressable, Vibration, SafeAreaView} from 'react-native';
import {WebView} from 'react-native-webview';
import {magnetometer, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';
import {AppText} from '../components/AppText';
import {colors, radius} from '../theme/tokens';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  smoothCompass,
  formatQiblaDirection,
  KAABA_COORDS,
} from '../utils/qibla';
import {getLocation} from '../services/storage';

interface QiblaScreenProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen kıble pusulası modalı.
 *
 * Harita + pusula ibresi BİRLEŞİK:
 * - Tam ekran OpenStreetMap haritası
 * - Ortada yarı-saydam pusula ibresi (Kâbe yönünü gösterir)
 * - Telefon Kâbe'ye dönünce: yeşil ışıma + titreşim + "Kıbleye dönük!" yazısı
 */
export function QiblaScreen({visible, onClose}: QiblaScreenProps) {
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [isAligned, setIsAligned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef(0);
  const prevNeedleRef = useRef(0);
  const needleRotation = useRef(new Animated.Value(0)).current;
  const alignedAnim = useRef(new Animated.Value(0)).current;
  const lastVibrationRef = useRef(0);

  const savedLocation = getLocation();
  const latitude = savedLocation?.latitude;
  const longitude = savedLocation?.longitude;

  // Qibla bearing hesapla
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setQiblaBearing(calculateQiblaBearing(latitude, longitude));
    }
  }, [latitude, longitude]);

  // Modal açılınca sensörü başlat, kapanınca temizle
  useEffect(() => {
    if (!visible) return;

    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 80);
    } catch {}

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const rawHeading = magnetometerToHeading(x, y);
        const smoothed = smoothCompass(rawHeading, headingRef.current, 0.12);
        headingRef.current = smoothed;

        const targetAngle = ((qiblaBearing - smoothed) % 360 + 360) % 360;

        // 360° sarım düzeltmesi
        let from = prevNeedleRef.current;
        let to = targetAngle;
        let diff = to - from;
        if (diff > 180) to -= 360;
        else if (diff < -180) to += 360;
        prevNeedleRef.current = targetAngle;

        Animated.spring(needleRotation, {
          toValue: to,
          friction: 6,
          tension: 35,
          useNativeDriver: true,
        }).start();

        // Kıbleye dönük mü? (ibre ±5° içindeyse)
        const aligned = targetAngle < 5 || targetAngle > 355;
        setIsAligned(aligned);

        if (aligned) {
          Animated.spring(alignedAnim, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }).start();

          // Titreşim (saniyede 1'den fazla değil)
          const now = Date.now();
          if (now - lastVibrationRef.current > 1000) {
            lastVibrationRef.current = now;
            Vibration.vibrate(100);
          }
        } else {
          Animated.timing(alignedAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      },
      error: () => {
        setSensorAvailable(false);
        setError('Pusula sensörü bulunamadı');
      },
    });

    return () => {
      subscription.unsubscribe();
      setIsAligned(false);
      alignedAnim.setValue(0);
    };
  }, [visible, qiblaBearing, needleRotation, alignedAnim]);

  const handleClose = useCallback(() => {
    setIsAligned(false);
    alignedAnim.setValue(0);
    onClose();
  }, [onClose, alignedAnim]);

  // OSM harita HTML'si
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        *{margin:0;padding:0}
        html,body{width:100%;height:100%;background:#0D111F}
        #map{width:100%;height:100%}
        .leaflet-control-zoom{display:none!important}
        .leaflet-control-attribution{display:none!important}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var userLat = ${latitude ?? 0};
        var userLng = ${longitude ?? 0};
        var kaabaLat = ${KAABA_COORDS.latitude};
        var kaabaLng = ${KAABA_COORDS.longitude};

        var centerLat = (userLat + kaabaLat) / 2;
        var centerLng = (userLng + kaabaLng) / 2;

        var map = L.map('map', {
          center: [centerLat, centerLng],
          zoom: 4,
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          keyboard: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
        }).addTo(map);

        // Kullanıcı
        L.circleMarker([userLat, userLng], {
          radius: 8,
          fillColor: '#7BAE8D',
          color: '#F4F1EA',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map).bindTooltip('Konumunuz', {permanent: false});

        // Kâbe
        L.marker([kaabaLat, kaabaLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="font-size:32px;text-align:center;line-height:1">🕋</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        }).addTo(map).bindTooltip('Kâbe', {permanent: false});

        // Kullanıcı ile Kâbe arasına çizgi
        L.polyline([[userLat, userLng], [kaabaLat, kaabaLng]], {
          color: '#D6B46A',
          weight: 2,
          opacity: 0.5,
          dashArray: '8, 8',
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  // Kıbleye dönük değil
  if (!visible) return null;

  // Konum yok
  if (!latitude || !longitude) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32}}>
            <AppText style={{fontSize: 48, marginBottom: 16}}>🕋</AppText>
            <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
              Kıble bulucu
            </AppText>
            <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32}}>
              Kıbleyi göstermek için önce Ayarlar'dan bir konum kaydedin.
            </AppText>
            <Pressable
              onPress={handleClose}
              style={({pressed}) => ({
                backgroundColor: pressed ? colors.accentSoft : colors.surfaceSoft,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: pressed ? 0.8 : 1,
              })}>
              <AppText style={{fontSize: 15, fontWeight: '700', color: colors.accent}}>Geri</AppText>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Sensör yok
  if (!sensorAvailable) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32}}>
            <AppText style={{fontSize: 48, marginBottom: 16}}>🧭</AppText>
            <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
              Pusula kullanılamıyor
            </AppText>
            <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32}}>
              {error || 'Cihazınız pusula desteği sağlamıyor.'}
            </AppText>
            <Pressable
              onPress={handleClose}
              style={({pressed}) => ({
                backgroundColor: pressed ? colors.accentSoft : colors.surfaceSoft,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: pressed ? 0.8 : 1,
              })}>
              <AppText style={{fontSize: 15, fontWeight: '700', color: colors.accent}}>Geri</AppText>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
        {/* HARİTA (tam ekran) */}
        <View style={{flex: 1}}>
          <WebView
            source={{html: mapHtml}}
            style={{flex: 1, backgroundColor: 'transparent'}}
            scrollEnabled={false}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            androidLayerType="hardware"
          />

          {/* PUSULA İBRESİ (harita üzerinde ortalanmış) */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
            {/* Kıbleye dönük ışıması (yeşil halka) */}
            <Animated.View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                borderWidth: 3,
                borderColor: isAligned ? '#7BAE8D' : 'transparent',
                opacity: alignedAnim,
                transform: [{scale: alignedAnim.interpolate({inputRange: [0, 1], outputRange: [0.8, 1.1]})}],
                shadowColor: '#7BAE8D',
                shadowOffset: {width: 0, height: 0},
                shadowRadius: 24,
              }}
            />

            {/* Pusula ibresi — döner, Kâbe yönünü gösterir */}
            <View
              style={{
                position: 'absolute',
                width: 6,
                height: 140,
                alignItems: 'center',
                top: 100 - 140,
                left: 100 - 3,
              }}>
              <Animated.View
                style={{
                  width: 6,
                  height: 140,
                  backgroundColor: colors.qiblaGold,
                  borderRadius: 3,
                  transform: [
                    {translateY: 70},
                    {rotate: needleRotation.interpolate({
                      inputRange: [-360, 0, 360],
                      outputRange: ['-360deg', '0deg', '360deg'],
                    })},
                    {translateY: -70},
                  ],
                  shadowColor: colors.qiblaGold,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              />
              {/* İbre ucu */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: -6,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: isAligned ? '#7BAE8D' : colors.compassNorth,
                  opacity: alignedAnim.interpolate({inputRange: [0, 1], outputRange: [1, 0.8]}),
                  shadowColor: isAligned ? '#7BAE8D' : colors.compassNorth,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              />
            </View>
          </View>
        </View>

        {/* ÜST KAPATMA BUTONU */}
        <Pressable
          onPress={handleClose}
          style={({pressed}) => ({
            position: 'absolute',
            top: 16,
            left: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? 'rgba(244,241,234,0.15)' : 'rgba(13,17,31,0.75)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(244,241,234,0.12)',
          })}>
          <AppText style={{fontSize: 20, color: colors.text}}>✕</AppText>
        </Pressable>

        {/* ALT BİLGİ PANELİ */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 40,
            alignItems: 'center',
          }}>
          {/* Kıbleye dönük göstergesi */}
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: isAligned
                ? 'rgba(123, 174, 141, 0.18)'
                : 'rgba(214, 180, 106, 0.12)',
              borderRadius: radius.lg,
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderWidth: 1,
              borderColor: isAligned
                ? 'rgba(123, 174, 141, 0.35)'
                : colors.borderStrong,
            }}>
            <AppText style={{fontSize: 24}}>
              {isAligned ? '✅' : '🕋'}
            </AppText>
            <View>
              <AppText
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isAligned ? '#7BAE8D' : colors.qiblaGold,
                }}>
                {isAligned ? 'Kıbleye dönük! 🌟' : formatQiblaDirection(qiblaBearing)}
              </AppText>
              <AppText
                style={{
                  fontSize: 12,
                  color: isAligned ? 'rgba(123, 174, 141, 0.8)' : colors.textMuted,
                  marginTop: 1,
                }}>
                {isAligned
                  ? 'Namazınızı kılabilirsiniz'
                  : 'Telefonu Kâbe yönüne çevirin'}
              </AppText>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
