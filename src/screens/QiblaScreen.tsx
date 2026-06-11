import React, {useState, useEffect, useRef} from 'react';
import {View, Animated, Pressable, Vibration, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {magnetometer, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';
import {AppText} from '../components/AppText';
import {colors, radius} from '../theme/tokens';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  smoothCompass,
  formatQiblaDirection,
  bearingToCardinal,
  KAABA_COORDS,
} from '../utils/qibla';
import {getLocation} from '../services/storage';

const SCREEN_W = Dimensions.get('window').width;
const COMPASS_SIZE = Math.min(SCREEN_W - 64, 280);
const COMPASS_CENTER = COMPASS_SIZE / 2;
const COMPASS_R = COMPASS_SIZE / 2 - 20;

const CARDINALS: {deg: number; label: string; color: string}[] = [
  {deg: 0, label: 'K', color: colors.compassNorth},
  {deg: 90, label: 'D', color: colors.textMuted},
  {deg: 180, label: 'G', color: colors.compassSouth},
  {deg: 270, label: 'B', color: colors.textMuted},
];

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [isAligned, setIsAligned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentHeading, setCurrentHeading] = useState(0);

  const headingRef = useRef(0);
  const prevNeedleRef = useRef(0);
  const needleRotation = useRef(new Animated.Value(0)).current;
  const alignedAnim = useRef(new Animated.Value(0)).current;
  const lastVibrationRef = useRef(0);

  const savedLocation = getLocation();
  const latitude = savedLocation?.latitude;
  const longitude = savedLocation?.longitude;

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setQiblaBearing(calculateQiblaBearing(latitude, longitude));
    }
  }, [latitude, longitude]);

  useEffect(() => {
    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 80);
    } catch {}

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const rawHeading = magnetometerToHeading(x, y);
        const smoothed = smoothCompass(rawHeading, headingRef.current, 0.12);
        headingRef.current = smoothed;
        setCurrentHeading(smoothed);

        const targetAngle = ((qiblaBearing - smoothed) % 360 + 360) % 360;

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

        const aligned = targetAngle < 5 || targetAngle > 355;
        setIsAligned(aligned);

        if (aligned) {
          Animated.spring(alignedAnim, {
            toValue: 1,
            friction: 4,
            tension: 60,
            useNativeDriver: true,
          }).start();

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
  }, [qiblaBearing, needleRotation, alignedAnim]);

  if (!latitude || !longitude) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.borderStrong}}>
          <AppText style={{fontSize: 36}}>🕋</AppText>
        </View>
        <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
          Kıble bulucu
        </AppText>
        <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21, marginBottom: 24}}>
          Kıbleyi göstermek için önce Ayarlar{'\n'}bölümünden bir konum kaydedin.
        </AppText>
      </View>
    );
  }

  if (!sensorAvailable) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(217, 135, 95, 0.26)'}}>
          <AppText style={{fontSize: 36}}>🧭</AppText>
        </View>
        <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
          Pusula kullanılamıyor
        </AppText>
        <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21}}>
          {error || 'Cihazınız pusula desteği sağlamıyor.'}
        </AppText>
      </View>
    );
  }

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
        var userLat = ${latitude};
        var userLng = ${longitude};
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
        L.circleMarker([userLat, userLng], {
          radius: 6, fillColor: '#7BAE8D', color: '#F4F1EA', weight: 2, fillOpacity: 1,
        }).addTo(map);
        L.marker([kaabaLat, kaabaLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="font-size:24px;text-align:center;line-height:1">🕋</div>',
            iconSize: [24, 24], iconAnchor: [12, 12],
          })
        }).addTo(map);
        L.polyline([[userLat, userLng], [kaabaLat, kaabaLng]], {
          color: '#D6B46A', weight: 2, opacity: 0.4, dashArray: '8, 8',
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <View style={{flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: insets.bottom + 80}}>
        {/* Başlık */}
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <AppText style={{fontSize: 13, fontWeight: '700', color: colors.accentMuted, textTransform: 'uppercase', letterSpacing: 2}}>
            Kıble Pusulası
          </AppText>
        </View>

        {/* PUSULA DAİRESİ */}
        <View style={{alignItems: 'center', marginBottom: 20}}>
          <View
            style={{
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              borderRadius: COMPASS_CENTER,
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {/* Dış halka — 360° çizgileri */}
            {Array.from({length: 36}).map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: 2,
                  height: i % 3 === 0 ? 12 : 6,
                  backgroundColor: i % 3 === 0 ? colors.borderStrong : 'rgba(214, 180, 106, 0.15)',
                  top: 8,
                  left: COMPASS_CENTER - 1,
                  transformOrigin: `0 ${COMPASS_CENTER - 8}px`,
                  transform: [{rotate: `${i * 10}deg`}],
                }}
              />
            ))}

            {/* Kardinal yönler */}
            {CARDINALS.map(c => {
              const rad = (c.deg * Math.PI) / 180;
              const x = COMPASS_CENTER + Math.sin(rad) * (COMPASS_R - 4) - 10;
              const y = COMPASS_CENTER - Math.cos(rad) * (COMPASS_R - 4) - 10;
              return (
                <View
                  key={c.label}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <AppText style={{fontSize: 14, fontWeight: '800', color: c.color}}>
                    {c.label}
                  </AppText>
                </View>
              );
            })}

            {/* Kıble ibresi — döner */}
            <View
              style={{
                position: 'absolute',
                width: 8,
                height: COMPASS_R * 1.4,
                alignItems: 'center',
                top: COMPASS_CENTER - COMPASS_R * 0.7,
                left: COMPASS_CENTER - 4,
              }}>
              <Animated.View
                style={{
                  width: 8,
                  height: COMPASS_R * 1.4,
                  borderRadius: 4,
                  backgroundColor: colors.qiblaGold,
                  transform: [
                    {translateY: COMPASS_R * 0.7},
                    {rotate: needleRotation.interpolate({
                      inputRange: [-360, 0, 360],
                      outputRange: ['-360deg', '0deg', '360deg'],
                    })},
                    {translateY: -COMPASS_R * 0.7},
                  ],
                  shadowColor: colors.qiblaGold,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.7,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              />
              {/* İbre ucu — kırmızı daire */}
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: isAligned ? '#7BAE8D' : colors.compassNorth,
                  shadowColor: isAligned ? '#7BAE8D' : colors.compassNorth,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              />
            </View>

            {/* Merkez nokta */}
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: colors.accent,
                zIndex: 10,
              }}
            />
          </View>
        </View>

        {/* Kıble yön bilgisi */}
        <View style={{alignItems: 'center', marginBottom: 16}}>
          <AppText style={{fontSize: 28, fontWeight: '800', color: colors.qiblaGold, fontVariant: ['tabular-nums']}}>
            {formatQiblaDirection(qiblaBearing)}
          </AppText>
          <AppText style={{fontSize: 13, color: colors.textMuted, marginTop: 4}}>
            {isAligned ? 'Kâbe yönündesiniz' : 'Telefonu Kâbe yönüne çevirin'}
          </AppText>
        </View>

        {/* Mini harita */}
        <View style={{width: '100%', height: 120, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border}}>
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
        </View>
      </View>

      {/* ALT DURUM KARTI */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 90,
          alignItems: 'center',
        }}>
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: isAligned
              ? 'rgba(123, 174, 141, 0.18)'
              : 'rgba(214, 180, 106, 0.12)',
            borderRadius: radius.xl,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: isAligned
              ? 'rgba(123, 174, 141, 0.35)'
              : colors.borderStrong,
            width: '100%',
          }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isAligned ? 'rgba(123, 174, 141, 0.2)' : colors.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <AppText style={{fontSize: 22}}>
              {isAligned ? '✅' : '🕋'}
            </AppText>
          </View>
          <View style={{flex: 1}}>
            <AppText
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: isAligned ? '#7BAE8D' : colors.qiblaGold,
              }}>
              {isAligned ? 'Kıbleye dönük!' : 'Kâbe yönünde değil'}
            </AppText>
            <AppText
              style={{
                fontSize: 12,
                color: isAligned ? 'rgba(123, 174, 141, 0.8)' : colors.textMuted,
                marginTop: 2,
              }}>
              {isAligned
                ? 'Namazınızı kılabilirsiniz'
                : 'Telefonu yavaşça Kâbe yönüne çevirin'}
            </AppText>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
