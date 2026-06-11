import React, {useState, useEffect, useRef} from 'react';
import {View, Animated, Vibration, Dimensions} from 'react-native';
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

const SCREEN_W = Dimensions.get('window').width;
const COMPASS_SIZE = Math.min(SCREEN_W - 48, 300);

export function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [isAligned, setIsAligned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef(0);
  const compassRotation = useRef(new Animated.Value(0)).current;
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

  // Magnetometer — pusulayı döndür
  useEffect(() => {
    if (!sensorAvailable) return;

    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 80);
    } catch {}

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const rawHeading = magnetometerToHeading(x, y);
        const smoothed = smoothCompass(rawHeading, headingRef.current, 0.15);
        headingRef.current = smoothed;

        // Pusula dairesini cihaz yönünün tersine döndür
        // Böylece "K" her zaman manyetik kuzeyi gösterir
        Animated.spring(compassRotation, {
          toValue: -smoothed,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();

        // Kıbleye hizalanma kontrolü
        // targetAngle: cihazın şu anki yönü ile kıble arasındaki fark
        const targetAngle = ((qiblaBearing - smoothed) % 360 + 360) % 360;
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
          if (now - lastVibrationRef.current > 1500) {
            lastVibrationRef.current = now;
            Vibration.vibrate(80);
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
  }, [qiblaBearing, compassRotation, alignedAnim, sensorAvailable]);

  // ── Konum yok ──
  if (!latitude || !longitude) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.borderStrong}}>
          <AppText style={{fontSize: 40}}>🕋</AppText>
        </View>
        <AppText style={{fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
          Kıble Bulucu
        </AppText>
        <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22}}>
          Kıbleyi göstermek için{'\n'}Ayarlar'dan bir konum kaydedin.
        </AppText>
      </View>
    );
  }

  // ── Sensör yok ──
  if (!sensorAvailable) {
    return (
      <View style={{flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(217, 135, 95, 0.26)'}}>
          <AppText style={{fontSize: 40}}>🧭</AppText>
        </View>
        <AppText style={{fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 8}}>
          Pusula Kullanılamıyor
        </AppText>
        <AppText style={{fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22}}>
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
          radius: 7, fillColor: '#7BAE8D', color: '#F4F1EA', weight: 2, fillOpacity: 1,
        }).addTo(map);
        L.marker([kaabaLat, kaabaLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="font-size:28px;text-align:center;line-height:1">🕋</div>',
            iconSize: [28, 28], iconAnchor: [14, 14],
          })
        }).addTo(map);
        L.polyline([[userLat, userLng], [kaabaLat, kaabaLng]], {
          color: '#D6B46A', weight: 2.5, opacity: 0.5, dashArray: '10, 8',
        }).addTo(map);
      </script>
    </body>
    </html>
  `;

  const R = COMPASS_SIZE / 2;

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 80,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

        {/* Üst bilgi */}
        <View style={{alignItems: 'center', paddingTop: 8}}>
          <AppText style={{fontSize: 13, fontWeight: '700', color: colors.accentMuted, textTransform: 'uppercase', letterSpacing: 2}}>
            Kıble Pusulası
          </AppText>
        </View>

        {/* ── PUSULA ── */}
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <View
            style={{
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}>

            {/* Dış halka — sabit */}
            <View
              style={{
                position: 'absolute',
                width: COMPASS_SIZE,
                height: COMPASS_SIZE,
                borderRadius: R,
                borderWidth: 2,
                borderColor: isAligned ? 'rgba(123, 174, 141, 0.4)' : colors.borderStrong,
              }}
            />

            {/* Dönen pusula katmanı */}
            <Animated.View
              style={{
                width: COMPASS_SIZE,
                height: COMPASS_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{rotate: compassRotation.interpolate({
                  inputRange: [-360, 0, 360],
                  outputRange: ['360deg', '0deg', '-360deg'],
                })}],
              }}>

              {/* derece çizgileri */}
              {Array.from({length: 72}).map((_, i) => {
                const isMajor = i % 6 === 0;
                const isMed = i % 3 === 0;
                return (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      width: isMajor ? 2.5 : 1,
                      height: isMajor ? 16 : isMed ? 10 : 5,
                      backgroundColor: isMajor
                        ? colors.accent
                        : isMed
                        ? 'rgba(214, 180, 106, 0.35)'
                        : 'rgba(214, 180, 106, 0.12)',
                      top: 10,
                      left: R - 1,
                      transformOrigin: `0px ${R - 10}px`,
                      transform: [{rotate: `${i * 5}deg`}],
                    }}
                  />
                );
              })}

              {/* Kardinal yön harfleri — dönen katmanda */}
              {([
                {deg: 0, label: 'K', color: colors.compassNorth, size: 18, weight: '900' as const},
                {deg: 90, label: 'D', color: colors.textMuted, size: 15, weight: '700' as const},
                {deg: 180, label: 'G', color: colors.compassSouth, size: 15, weight: '700' as const},
                {deg: 270, label: 'B', color: colors.textMuted, size: 15, weight: '700' as const},
              ]).map(c => {
                const rad = ((c.deg - 90) * Math.PI) / 180;
                const dist = R - 30;
                const x = R + Math.cos(rad) * dist - 12;
                const y = R + Math.sin(rad) * dist - 12;
                return (
                  <View
                    key={c.label}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: y,
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <AppText style={{fontSize: c.size, fontWeight: c.weight, color: c.color}}>
                      {c.label}
                    </AppText>
                  </View>
                );
              })}

              {/* Kıble çizgisi — merkezden dışa, dönen katmanda */}
              <View
                style={{
                  position: 'absolute',
                  width: 3,
                  height: R - 40,
                  backgroundColor: colors.qiblaGold,
                  bottom: R,
                  left: R - 1.5,
                  borderRadius: 1.5,
                  opacity: 0.9,
                  shadowColor: colors.qiblaGold,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.6,
                  shadowRadius: 6,
                }}
              />
              {/* Kıble ucu — küçük daire */}
              <View
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.qiblaGold,
                  top: 18,
                  left: R - 5,
                  shadowColor: colors.qiblaGold,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                }}
              />
            </Animated.View>

            {/* Sabit üst gösterge — "şurası ileri" */}
            <View
              style={{
                position: 'absolute',
                top: 2,
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderTopWidth: 14,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: isAligned ? '#7BAE8D' : colors.accent,
              }}
            />

            {/* Merkez nokta */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isAligned ? '#7BAE8D' : colors.accent,
                shadowColor: isAligned ? '#7BAE8D' : colors.accent,
                shadowOffset: {width: 0, height: 0},
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }}
            />
          </View>
        </View>

        {/* Alt bilgi bölgesi */}
        <View style={{alignItems: 'center', gap: 8, paddingBottom: 8}}>
          {/* Kıble açısı */}
          <AppText style={{fontSize: 32, fontWeight: '800', color: colors.qiblaGold, fontVariant: ['tabular-nums']}}>
            {formatQiblaDirection(qiblaBearing)}
          </AppText>

          {/* Durum */}
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: isAligned
                ? 'rgba(123, 174, 141, 0.15)'
                : 'rgba(214, 180, 106, 0.08)',
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isAligned
                ? 'rgba(123, 174, 141, 0.3)'
                : colors.border,
            }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isAligned ? '#7BAE8D' : colors.textMuted,
              }}
            />
            <AppText style={{fontSize: 13, fontWeight: '600', color: isAligned ? '#7BAE8D' : colors.textMuted}}>
              {isAligned ? 'Kıbleye dönük' : 'Döndürmeye devam edin'}
            </AppText>
          </Animated.View>

          {/* Mini harita */}
          <View
            style={{
              width: SCREEN_W - 48,
              height: 100,
              borderRadius: radius.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
              marginTop: 8,
            }}>
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
      </View>
    </View>
  );
}
