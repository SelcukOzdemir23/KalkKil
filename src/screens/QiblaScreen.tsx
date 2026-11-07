import React, {useState, useEffect, useRef} from 'react';
import {View, Animated, Vibration, Dimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  magnetometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';
import {Compass} from 'lucide-react-native';
import {
  calculateQiblaBearing,
  magnetometerToHeading,
  smoothCompass,
  bearingToCardinalName,
} from '../domain/qibla';
import {getLocation, getLocationLabel} from '../services/storage';
import {useTheme} from '../theme/ThemeProvider';
import {EmptyState} from '../ui/EmptyState';
import {Text} from '../ui/Text';

const SCREEN_W = Dimensions.get('window').width;
const COMPASS_SIZE = Math.min(SCREEN_W - 72, 288);
const R = COMPASS_SIZE / 2;
/** Hizalanma toleransı (derece). */
const ALIGN_TOLERANCE = 5;

/**
 * Kıble pusulası.
 *
 * Kadran ve kardinal harfler cihaz yönünün tersine döner (kuzey hep kuzeyde
 * kalsın), iğne ise kıble yönünü gösterir. Sayısal okuma sans ve tabular:
 * pusulada rakamın kaymaması okumayı kolaylaştırıyor.
 */
export function QiblaScreen() {
  const {palette, spacing} = useTheme();
  const insets = useSafeAreaInsets();
  const [qiblaBearing, setQiblaBearing] = useState(0);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [isAligned, setIsAligned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingRef = useRef(0);
  const compassRotation = useRef(new Animated.Value(0)).current;
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
    if (!sensorAvailable) {
      return;
    }

    try {
      setUpdateIntervalForType(SensorTypes.magnetometer, 80);
    } catch {}

    const subscription = magnetometer.subscribe({
      next: ({x, y}) => {
        const smoothed = smoothCompass(
          magnetometerToHeading(x, y),
          headingRef.current,
          0.15,
        );
        headingRef.current = smoothed;

        Animated.spring(compassRotation, {
          toValue: -smoothed,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();

        const offset = (((qiblaBearing - smoothed) % 360) + 360) % 360;
        const aligned =
          offset < ALIGN_TOLERANCE || offset > 360 - ALIGN_TOLERANCE;
        setIsAligned(aligned);

        if (aligned) {
          const now = Date.now();
          if (now - lastVibrationRef.current > 1500) {
            lastVibrationRef.current = now;
            Vibration.vibrate(80);
          }
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
    };
  }, [qiblaBearing, compassRotation, sensorAvailable]);

  if (latitude === undefined || longitude === undefined) {
    return (
      <EmptyState
        icon={<Compass size={24} color={palette.accent} />}
        title="Konum gerekli"
        body="Kıble yönü konumunuza göre hesaplanır. Konum seçtiğinizde pusula burada açılır."
      />
    );
  }

  if (!sensorAvailable) {
    return (
      <EmptyState
        icon={<Compass size={24} color={palette.accent} />}
        title="Pusula kullanılamıyor"
        body={
          error ||
          'Cihazınız manyetometre desteği sağlamıyor. Kıble yönünü hesapladık: aşağıdaki derece değeri kuzeyden saat yönündedir.'
        }
      />
    );
  }

  const needleColor = isAligned ? palette.success : palette.accent;
  // Harfler kadranla birlikte döner ama dik kalmalı: ters yönde çeviriyoruz.
  const upright = compassRotation.interpolate({
    inputRange: [-360, 0],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + 84,
        paddingHorizontal: 22,
      }}>
      <View>
        <Text variant="title">Kıble</Text>
        <Text variant="caption" tone="muted" style={{marginTop: spacing.xs}}>
          {getLocationLabel()}
        </Text>
      </View>

      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <View style={{width: COMPASS_SIZE, height: COMPASS_SIZE}}>
          {/* Sabit halka */}
          <View
            style={{
              position: 'absolute',
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              borderRadius: R,
              borderWidth: 1,
              borderColor: isAligned ? palette.success : palette.hairlineStrong,
            }}
          />

          {/* Dönen kadran: çentikler + kardinal harfler + iğne */}
          <Animated.View
            style={{
              width: COMPASS_SIZE,
              height: COMPASS_SIZE,
              transform: [{rotate: compassRotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              })}],
            }}>
            {/* Çentikler: her 15°, kardinal noktalarda uzun */}
            {Array.from({length: 24}).map((_, i) => (
              <View
                key={`tick-${i}`}
                style={{
                  position: 'absolute',
                  left: R - 0.5,
                  top: 8,
                  width: i % 6 === 0 ? 1.5 : 1,
                  height: i % 6 === 0 ? 13 : 7,
                  backgroundColor:
                    i % 6 === 0 ? palette.inkMuted : palette.hairlineStrong,
                  transformOrigin: `0px ${R - 8}px`,
                  transform: [{rotate: `${i * 15}deg`}],
                }}
              />
            ))}

            {/* Kardinal harfler */}
            {[
              {deg: 0, label: 'K', tone: 'accent' as const, size: 15},
              {deg: 90, label: 'D', tone: 'muted' as const, size: 12},
              {deg: 180, label: 'G', tone: 'muted' as const, size: 12},
              {deg: 270, label: 'B', tone: 'muted' as const, size: 12},
            ].map(cardinal => {
              const rad = ((cardinal.deg - 90) * Math.PI) / 180;
              const dist = R - 42;
              return (
                <Animated.View
                  key={cardinal.label}
                  style={{
                    position: 'absolute',
                    left: R + Math.cos(rad) * dist - 14,
                    top: R + Math.sin(rad) * dist - 14,
                    width: 28,
                    height: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{rotate: upright}],
                  }}>
                  <Text
                    variant="label"
                    tone={cardinal.tone}
                    style={{fontSize: cardinal.size, letterSpacing: 0}}>
                    {cardinal.label}
                  </Text>
                </Animated.View>
              );
            })}

            {/* Kıble iğnesi — kendi çerçevesinde kıble açısı kadar döner */}
            <View
              style={{
                position: 'absolute',
                width: COMPASS_SIZE,
                height: COMPASS_SIZE,
                transform: [{rotate: `${qiblaBearing}deg`}],
              }}>
              {/* İğne kadranın kenarına kadar uzanır: "hangi çentiğe bakıyorum"
                  sorusu ancak o zaman cevaplanıyor. Uçta küçük bir nokta. */}
              <View
                style={{
                  position: 'absolute',
                  left: R - 1.25,
                  top: 14,
                  width: 2.5,
                  height: R - 14,
                  backgroundColor: needleColor,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: R - 4,
                  top: 10,
                  width: 8,
                  height: 8,
                  backgroundColor: needleColor,
                }}
              />
            </View>
          </Animated.View>

          {/* Merkez */}
          <View
            style={{
              position: 'absolute',
              left: R - 4,
              top: R - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: palette.ink,
            }}
          />
        </View>

        <View style={{alignItems: 'center', marginTop: spacing.xxl}}>
          <Text variant="measure">{Math.round(qiblaBearing)}°</Text>
          <Text variant="label" tone="accent" style={{marginTop: spacing.md}}>
            {bearingToCardinalName(qiblaBearing)}
          </Text>
          <Text
            variant="caption"
            tone={isAligned ? 'success' : 'muted'}
            style={{marginTop: spacing.md}}>
            {isAligned
              ? 'Kıbleye dönüksünüz'
              : 'Telefonu düz tutun ve yavaşça döndürün'}
          </Text>
        </View>
      </View>
    </View>
  );
}
