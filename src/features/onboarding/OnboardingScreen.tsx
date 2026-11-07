import React, {useState} from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Check, Navigation} from 'lucide-react-native';
import {District, searchDistricts} from '../../data/districts';
import {detectDistrict} from '../../services/location';
import {requestNotificationPermission} from '../../services/notifications';
import {
  saveLocation,
  setOnboardingCompleted,
  setLocationPermissionGranted,
  getLocation,
} from '../../services/storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Button} from '../../ui/Button';
import {Text} from '../../ui/Text';

interface OnboardingScreenProps {
  onFinish: () => void;
}

/**
 * İlk açılış akışı: karşılama → ilçe → bildirim.
 *
 * Konum burada seçilir; ana ekran artık GPS izni istemez. Vakitler seçilen
 * ilçenin Diyanet referans noktasından hesaplanır.
 */
export function OnboardingScreen({onFinish}: OnboardingScreenProps) {
  const {palette, spacing} = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<District | null>(
    () => null,
  );
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [askingPermission, setAskingPermission] = useState(false);

  const results = searchDistricts(query, 12);

  const choose = (district: District) => {
    saveLocation(
      district.latitude,
      district.longitude,
      district.province,
      district.name,
    );
    setLocationPermissionGranted(true);
    setSelected(district);
    setError(null);
  };

  const handleGps = async () => {
    setLocating(true);
    setError(null);
    const result = await detectDistrict();
    if (result.success) {
      choose(result.district);
    } else {
      setError(result.error);
    }
    setLocating(false);
  };

  const handleEnableNotifications = async () => {
    setAskingPermission(true);
    const granted = await requestNotificationPermission();
    setNotificationsOn(granted);
    setAskingPermission(false);
  };

  const finish = () => {
    setOnboardingCompleted();
    onFinish();
  };

  const steps = [
    // 1 — Karşılama
    <View key="welcome" style={{flex: 1, justifyContent: 'center'}}>
      <Text variant="display">KalkKıl</Text>
      <Text variant="body" tone="muted" style={{marginTop: spacing.lg, maxWidth: 300}}>
        Reklamsız namaz vakti. Vakitler cihazınızda hesaplanır, konumunuz hiçbir
        sunucuya gönderilmez.
      </Text>
    </View>,

    // 2 — İlçe
    <View key="location" style={{flex: 1}}>
      <Text variant="title">Nerede namaz kılıyorsunuz?</Text>
      <Text variant="caption" tone="muted" style={{marginTop: spacing.sm}}>
        Vakitler ilçenin Diyanet referans noktasından hesaplanır. Konumunuz
        cihazınızda kalır.
      </Text>

      <Pressable
        onPress={handleGps}
        disabled={locating}
        style={({pressed}) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xl,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: palette.hairlineStrong,
          opacity: locating ? 0.5 : pressed ? 0.6 : 1,
        })}>
        {locating ? (
          <ActivityIndicator size="small" color={palette.accent} />
        ) : (
          <Navigation size={15} color={palette.accent} />
        )}
        <Text variant="label" tone="accent">
          GPS ile bul
        </Text>
      </Pressable>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="İlçe ara (ör. Kadıköy)"
        placeholderTextColor={palette.inkSubtle}
        autoCorrect={false}
        style={{
          marginTop: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: palette.hairlineStrong,
          color: palette.ink,
          fontSize: 16,
        }}
      />

      {error && (
        <Text variant="caption" tone="accent" style={{marginTop: spacing.md}}>
          {error}
        </Text>
      )}

      <ScrollView
        style={{flex: 1, marginTop: spacing.md}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {results.map(district => {
          const isSelected =
            selected?.name === district.name &&
            selected?.province === district.province;
          return (
            <Pressable
              key={`${district.province}-${district.name}`}
              onPress={() => choose(district)}
              style={({pressed}) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: palette.hairline,
                opacity: pressed ? 0.6 : 1,
              })}>
              <View style={{flex: 1}}>
                <Text variant="body">{district.name}</Text>
                {district.name !== district.province && (
                  <Text variant="caption" tone="muted">
                    {district.province}
                  </Text>
                )}
              </View>
              {isSelected && <Check size={16} color={palette.accent} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>,

    // 3 — Bildirim
    <View key="notifications" style={{flex: 1}}>
      <Text variant="title">Vakitten önce haber verelim mi?</Text>
      <Text variant="caption" tone="muted" style={{marginTop: spacing.sm}}>
        Seçtiğiniz vakitler için bildirim gönderilir. İstediğiniz zaman
        Ayarlar'dan kapatabilirsiniz.
      </Text>

      <View style={{marginTop: spacing.xl}}>
        {notificationsOn ? (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
            <Check size={16} color={palette.success} />
            <Text variant="body" tone="success">
              Bildirimler açık
            </Text>
          </View>
        ) : (
          <Button
            label="Bildirimleri aç"
            variant="ghost"
            onPress={handleEnableNotifications}
            busy={askingPermission}
          />
        )}
      </View>

      <View style={{flex: 1}} />

      <Text variant="caption" tone="muted" style={{marginBottom: spacing.lg}}>
        Diyanet yöntemi ·{' '}
        {getLocation()?.city ?? ''}
        {getLocation()?.district && getLocation()?.district !== getLocation()?.city
          ? ` / ${getLocation()?.district}`
          : ''}
      </Text>
    </View>,
  ];

  const isLast = step === steps.length - 1;
  // Son adım her zaman devam edebilir; ilçe adımı seçim ister.
  const canContinue = step === 0 || step === steps.length - 1 || selected !== null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: 26,
      }}>
      <View style={{flex: 1}}>{steps[step]}</View>

      {/* Adım noktaları */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          marginBottom: spacing.xl,
        }}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === step ? 18 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor:
                index === step ? palette.accent : palette.hairlineStrong,
            }}
          />
        ))}
      </View>

      <Button
        label={isLast ? 'Vakitleri göster' : 'Devam'}
        onPress={() => (isLast ? finish() : setStep(step + 1))}
        disabled={!canContinue}
      />

      {step === 1 && (selected === null ? (
        <Text
          variant="caption"
          tone="muted"
          style={{textAlign: 'center', marginTop: spacing.sm}}>
          Devam etmek için bir ilçe seçin
        </Text>
      ) : null)}
    </View>
  );
}
