import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Animated, Pressable, Vibration} from 'react-native';
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
  KAABA_COORDS,
} from '../utils/qibla';
import {getLocation} from '../services/storage';
import {Compass} from 'lucide-react-native';

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
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

  // Magnetometer aboneliği
  useEffect(() => {
    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 80);
    } catch {}

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const rawHeading = magnetometerToHeading(x, y);
        const smoothed = smoothCompass(rawHeading, headingRef.current, 0.12);
        headingRef.current = smoothed;

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

  // Konum yok
  if (!latitude || !longitude) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.borderStrong}}>
          <AppText style={{fontSize: 36}}>🕋</AppText>
        </View>
        <AppText style={{fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
          Kıble bulucu
        </AppText>
        <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21}}>
          Kıbleyi göstermek için önce Ayarlar'dan bir konum kaydedin.
        </AppText>
      </View>
    );
  }

  // Sensör yok
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
          radius: 8,
          fillColor: '#7BAE8D',
          color: '#F4F1EA',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map).bindTooltip('Konumunuz', {permanent: false});

        L.marker([kaabaLat, kaabaLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="font-size:32px;text-align:center;line-height:1">🕋</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        }).addTo(map).bindTooltip('Kabe', {permanent: false});

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

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* HARİTA */}
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

        {/* PUSULA İBRESİ */}
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

      {/* ALT BİLGİ PANELİ */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: insets.bottom + 90,
          alignItems: 'center',
        }}>
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
    </View>
  );
}
