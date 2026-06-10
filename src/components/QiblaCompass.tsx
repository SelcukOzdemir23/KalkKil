import React, {useState, useEffect, useRef} from 'react';
import {View, Animated} from 'react-native';
import {WebView} from 'react-native-webview';
import {magnetometer, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {colors, radius} from '../theme/tokens';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  smoothCompass,
  formatQiblaDirection,
  KAABA_COORDS,
} from '../utils/qibla';

interface QiblaCompassProps {
  latitude?: number;
  longitude?: number;
}

/**
 * Kıble pusulası bileşeni.
 *
 * Magnetometer ile cihaz yönünü algılar, Kâbe yönünü pusulada gösterir.
 * Alt kısımda OpenStreetMap ile Kâbe konumunu gösteren mini harita.
 */
export function QiblaCompass({latitude, longitude}: QiblaCompassProps) {
  const [heading, setHeading] = useState(0);
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref'ler — subscription callback'inde güncel değerler için (dep array'de heading olmasın diye)
  const headingRef = useRef(0);
  const prevNeedleRef = useRef(0);

  // İbre rotasyonu için Animated.Value (ref olarak sabit kalır, dep'te olmamalı)
  const needleRotationRef = useRef(new Animated.Value(0));
  const needleRotation = needleRotationRef.current;

  // Qibla bearing'ini hesapla — sadece konum değişince çalışır
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      const bearing = calculateQiblaBearing(latitude, longitude);
      setQiblaBearing(bearing);
    }
  }, [latitude, longitude]);

  // Magnetometer aboneliği — sadece qiblaBearing değişince yeniden kurulur (çok nadir)
  useEffect(() => {
    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 100);
    } catch {
      // Eski API'lerde hata vermez
    }

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const rawHeading = magnetometerToHeading(x, y);
        const smoothed = smoothCompass(rawHeading, headingRef.current, 0.15);
        headingRef.current = smoothed;
        setHeading(smoothed); // sadece UI güncellemesi — re-render tetikler ama subscription yeniden kurulmaz

        // Kıble ibresinin açısı = Kıble yönü - cihaz baş yönü
        const targetAngle = ((qiblaBearing - smoothed) % 360 + 360) % 360;

        // 360° sarımını düzgün işle
        let from = prevNeedleRef.current;
        let to = targetAngle;
        let diff = to - from;
        if (diff > 180) {
          to -= 360;
        } else if (diff < -180) {
          to += 360;
        }

        prevNeedleRef.current = targetAngle;

        Animated.spring(needleRotation, {
          toValue: to,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
      error: () => {
        setSensorAvailable(false);
        setError('Pusula sensörü bulunamadı');
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [qiblaBearing]); // SADECE qiblaBearing — her 100ms'de değil!

  // ── Eksik konum ──
  if (latitude === undefined || longitude === undefined) {
    return (
      <GlassView intensity="medium" style={{borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center'}}>
        <AppText style={{fontSize: 36, marginBottom: 10}}>🕋</AppText>
        <AppText style={{fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4}}>Kıble yönü</AppText>
        <AppText style={{fontSize: 13, color: colors.textMuted, textAlign: 'center'}}>
          Kıbleyi göstermek için önce bir konum kaydedin.
        </AppText>
      </GlassView>
    );
  }

  // ── Sensör yok ──
  if (!sensorAvailable) {
    return (
      <GlassView intensity="medium" style={{borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center'}}>
        <AppText style={{fontSize: 36, marginBottom: 10}}>🧭</AppText>
        <AppText style={{fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4}}>Pusula kullanılamıyor</AppText>
        <AppText style={{fontSize: 13, color: colors.textMuted, textAlign: 'center'}}>
          {error || 'Cihazınız pusula desteği sağlamıyor.'}
        </AppText>
      </GlassView>
    );
  }

  // OSM harita HTML'si — Kâbe konumunu gösteren minimap
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        *{margin:0;padding:0}
        html,body{width:100%;height:100%;background:#161B2B}
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
        var latDiff = Math.abs(userLat - kaabaLat) * 2.5;
        var lngDiff = Math.abs(userLng - kaabaLng) * 2.5;

        var map = L.map('map', {
          center: [centerLat, centerLng],
          zoom: Math.min(
            Math.round(6 - Math.log2(Math.max(latDiff, lngDiff))),
            12
          ),
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

        // Kullanıcı işareti
        L.circleMarker([userLat, userLng], {
          radius: 6,
          fillColor: '#7BAE8D',
          color: '#F4F1EA',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 1,
        }).addTo(map).bindTooltip('Konumunuz', {permanent: false, direction: 'top'});

        // Kâbe işareti
        L.marker([kaabaLat, kaabaLng], {
          icon: L.divIcon({
            className: '',
            html: '<div style="font-size:24px;text-align:center;line-height:1">🕋</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })
        }).addTo(map).bindTooltip('Kâbe', {permanent: false, direction: 'top'});
      </script>
    </body>
    </html>
  `;

  return (
    <GlassView intensity="medium" style={{borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center'}}>
      {/* Pusula başlığı */}
      <AppText style={{fontSize: 12, fontWeight: '700', color: colors.accentMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16}}>
        🕋 Kıble Pusulası
      </AppText>

      {/* Pusula dairesi */}
      <View
        style={{
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.borderStrong,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
        {/* Kardinal yönler — sabit */}
        <AppText style={{position: 'absolute', top: 10, fontSize: 13, fontWeight: '700', color: colors.compassNorth}}>N</AppText>
        <AppText style={{position: 'absolute', bottom: 10, fontSize: 13, fontWeight: '700', color: colors.compassSouth}}>S</AppText>
        <AppText style={{position: 'absolute', right: 10, fontSize: 13, fontWeight: '700', color: colors.textMuted}}>D</AppText>
        <AppText style={{position: 'absolute', left: 10, fontSize: 13, fontWeight: '700', color: colors.textMuted}}>B</AppText>

        {/* Kıble ibresi — Animated.spring ile düzgün döner */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 4,
            height: 80,
            backgroundColor: colors.qiblaGold,
            borderRadius: 2,
            top: 100 - 80,
            left: 100 - 2,
            transform: [
              {translateY: 40},
              {rotate: needleRotation.interpolate({
                inputRange: [-360, 0, 360],
                outputRange: ['-360deg', '0deg', '360deg'],
              })},
            ],
            shadowColor: colors.qiblaGold,
            shadowOffset: {width: 0, height: 0},
            shadowOpacity: 0.6,
            shadowRadius: 6,
            elevation: 3,
          }}
        />
        {/* İbre ucu — kırmızı daire */}
        <View style={{position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.compassNorth, top: 100 - 4, left: 100 - 4}} />

        {/* Merkez nokta */}
        <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent}} />
      </View>

      {/* Kıble yön bilgisi */}
      <AppText style={{fontSize: 22, fontWeight: '700', color: colors.qiblaGold, fontVariant: ['tabular-nums']}}>
        {formatQiblaDirection(qiblaBearing)}
      </AppText>
      <AppText style={{fontSize: 12, color: colors.textMuted, marginTop: 2}}>
        Cihazı Kâbe'ye doğru çevirin
      </AppText>

      {/* OpenStreetMap mini harita */}
      <View style={{width: '100%', height: 130, borderRadius: radius.md, overflow: 'hidden', marginTop: 16, borderWidth: 1, borderColor: colors.border}}>
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
    </GlassView>
  );
}
