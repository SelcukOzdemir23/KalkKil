import React, {useState, useEffect, useRef} from 'react';
import {View, Animated, Vibration, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {magnetometer, SensorTypes, setUpdateIntervalForType} from 'react-native-sensors';
import {AppText} from '../components/AppText';
import {Compass} from 'lucide-react-native';
import {radius} from '../theme/tokens';
import {useTheme} from '../theme/ThemeProvider';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  smoothCompass,
  formatQiblaDirection,
} from '../domain/qibla';
import {getLocation} from '../services/storage';

const SCREEN_W = Dimensions.get('window').width;
const COMPASS_SIZE = Math.min(SCREEN_W - 48, 300);

export function QiblaScreen() {
  const {palette} = useTheme();
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
  if (latitude === undefined || longitude === undefined) {
    return (
      <View style={{flex: 1, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: palette.hairlineStrong}}>
          <Compass size={40} color={palette.accent} />
        </View>
        <AppText style={{fontSize: 20, fontWeight: '700', color: palette.ink, textAlign: 'center', marginBottom: 8}}>
          Kıble Bulucu
        </AppText>
        <AppText style={{fontSize: 14, color: palette.inkMuted, textAlign: 'center', lineHeight: 22}}>
          Kıbleyi göstermek için{'\n'}Ayarlar'dan bir konum kaydedin.
        </AppText>
      </View>
    );
  }

  // ── Sensör yok ──
  if (!sensorAvailable) {
    return (
      <View style={{flex: 1, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}>
        <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(217, 135, 95, 0.26)'}}>
          <Compass size={40} color={palette.accent} />
        </View>
        <AppText style={{fontSize: 20, fontWeight: '700', color: palette.ink, textAlign: 'center', marginBottom: 8}}>
          Pusula Kullanılamıyor
        </AppText>
        <AppText style={{fontSize: 14, color: palette.inkMuted, textAlign: 'center', lineHeight: 22}}>
          {error || 'Cihazınız pusula desteği sağlamıyor.'}
        </AppText>
      </View>
    );
  }

  const R = COMPASS_SIZE / 2;

  return (
    <View style={{flex: 1, backgroundColor: palette.background}}>
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
          <AppText style={{fontSize: 13, fontWeight: '700', color: palette.accentMuted,            letterSpacing: 0.4}}>
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
                borderColor: isAligned ? 'rgba(123, 174, 141, 0.4)' : palette.hairlineStrong,
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
                        ? palette.accent
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
                {deg: 0, label: 'K', color: palette.compassNorth, size: 18, weight: '900' as const},
                {deg: 90, label: 'D', color: palette.inkMuted, size: 15, weight: '700' as const},
                {deg: 180, label: 'G', color: palette.compassSouth, size: 15, weight: '700' as const},
                {deg: 270, label: 'B', color: palette.inkMuted, size: 15, weight: '700' as const},
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
                  backgroundColor: palette.needle,
                  bottom: R,
                  left: R - 1.5,
                  borderRadius: 1.5,
                  opacity: 0.9,
                  shadowColor: palette.needle,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              />
              {/* Kıble ucu — küçük daire */}
              <View
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: palette.needle,
                  top: 18,
                  left: R - 5,
                  shadowColor: palette.needle,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.35,
                  shadowRadius: 3,
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
                borderTopColor: isAligned ? '#7BAE8D' : palette.accent,
              }}
            />

            {/* Merkez nokta */}
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isAligned ? '#7BAE8D' : palette.accent,
                shadowColor: isAligned ? '#7BAE8D' : palette.accent,
                shadowOffset: {width: 0, height: 0},
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
          </View>
        </View>

        {/* Alt bilgi bölgesi */}
        <View style={{alignItems: 'center', gap: 8, paddingBottom: 8}}>
          {/* Kıble açısı */}
          <AppText style={{fontSize: 32, fontWeight: '800', color: palette.needle, fontVariant: ['tabular-nums']}}>
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
              borderRadius: radius.sm,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: isAligned
                ? 'rgba(123, 174, 141, 0.3)'
                : palette.hairline,
            }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isAligned ? '#7BAE8D' : palette.inkMuted,
              }}
            />
            <AppText style={{fontSize: 13, fontWeight: '600', color: isAligned ? '#7BAE8D' : palette.inkMuted}}>
              {isAligned ? 'Kıbleye dönük' : 'Döndürmeye devam edin'}
            </AppText>
          </Animated.View>

        </View>
      </View>
    </View>
  );
}
