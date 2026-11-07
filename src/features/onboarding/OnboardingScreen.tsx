import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Navigation} from 'lucide-react-native';
import {District, searchDistricts} from '../../data/districts';
import {
  buildEntries,
  calculateDailyTimes,
  findNextEntry,
} from '../../domain/prayer';
import {PRAYER_LABELS} from '../../i18n/tr';
import {detectDistrict} from '../../services/location';
import {requestNotificationPermission} from '../../services/notifications';
import {
  saveLocation,
  setOnboardingCompleted,
  setLocationPermissionGranted,
} from '../../services/storage';
import {useTheme} from '../../theme/ThemeProvider';
import {Button} from '../../ui/Button';
import {Divider} from '../../ui/Divider';
import {Text} from '../../ui/Text';

interface OnboardingScreenProps {
  onFinish: () => void;
}

type Phase = 'detecting' | 'ready' | 'browsing';

/**
 * Tek ekranlık ilk açılış.
 *
 * Önceki sürüm üç adımlıydı (karşılama → ilçe → bildirim) ve her adımda
 * "Devam" istiyordu; ilk açılış için gereğinden yavaştı. Şimdi GPS kendiliğinden
 * denenir, ilçe bulunursa doğrudan seçili gelir ve tek dokunuşla başlanır.
 *
 * İki yerde bekleme yok: GPS'i beklemek zorunlu değil (kullanıcı hemen kendi
 * seçebilir) ve bildirim izni "Başla"yı bloklamaz.
 *
 * Konum burada seçilir; ana ekran artık GPS izni istemez.
 */
export function OnboardingScreen({onFinish}: OnboardingScreenProps) {
  const {palette, spacing} = useTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('detecting');
  const [selected, setSelected] = useState<District | null>(null);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [starting, setStarting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  /** Kullanıcı elle seçime geçtiyse GPS sonucu artık uygulanmaz. */
  const userChose = useRef(false);

  const results = searchDistricts(query, 12);

  /** Seçilen ilçenin bugünkü vakitleri — onboarding'in "kanıt" bölümü. */
  const entries = useMemo(() => {
    if (!selected) {
      return null;
    }
    const now = new Date();
    return buildEntries(
      calculateDailyTimes(selected.latitude, selected.longitude, now),
      now,
    );
  }, [selected]);

  const nextPrayer = entries ? findNextEntry(entries) : null;

  const choose = useCallback((district: District) => {
    userChose.current = true;
    saveLocation(
      district.latitude,
      district.longitude,
      district.province,
      district.name,
    );
    setLocationPermissionGranted(true);
    setSelected(district);
    setPhase('ready');
    setQuery('');
  }, []);

  // Açılışta izin isteyip en yakın ilçeyi kendiliğinden dene.
  useEffect(() => {
    let alive = true;

    detectDistrict().then(result => {
      if (!alive || userChose.current) {
        return;
      }
      if (result.success) {
        choose(result.district);
      } else {
        setPhase('browsing');
        setNote('Konum bulunamadı — ilçenizi arayarak seçin.');
      }
    });

    return () => {
      alive = false;
    };
  }, [choose]);

  /**
   * İzin isteğini bekleme.
   *
   * Önceki sürüm `await requestNotificationPermission()` yaptığı için sistem
   * diyaloğu kapanana kadar "Başla" dönüyordu; ikinci bir dokunuş gibi
   * hissediliyordu. İzin diyaloğu JS'ten bağımsız olarak ekranda kaldığı için
   * burada beklemek gereksiz: istek başlatılır, geçiş hemen yapılır.
   */
  const start = () => {
    setStarting(true);
    if (notifications) {
      requestNotificationPermission().catch(() => {});
    }
    setOnboardingCompleted();
    onFinish();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.background,
        paddingTop: insets.top + spacing.xxl,
        paddingBottom: insets.bottom + spacing.lg,
        paddingHorizontal: 26,
      }}>
      <Text variant="label" tone="accent">
        KalkKıl
      </Text>
      <Text variant="title" style={{marginTop: spacing.md, maxWidth: 320}}>
        Nerede namaz kılıyorsunuz?
      </Text>
      <Text variant="caption" tone="muted" style={{marginTop: spacing.sm}}>
        Vakitler ilçenin Diyanet referans noktasından hesaplanır. Konumunuz
        cihazınızdan çıkmaz.
      </Text>

      <Divider style={{marginTop: spacing.xl}} />

      {/* Konum bloğu — liste açılınca üstten akar, kalan boşluk alta düşer. */}
      <View
        style={{
          flex: phase === 'browsing' ? 1 : 0,
          marginTop: spacing.lg,
        }}>
        {phase === 'detecting' && (
          <View>
            <View
              style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
              <ActivityIndicator size="small" color={palette.accent} />
              <Text variant="body" tone="muted">
                Konumunuz bulunuyor…
              </Text>
            </View>
            {/* GPS'i beklemek zorunlu değil: kullanıcı hemen kendisi seçebilir. */}
            <Pressable
              onPress={() => {
                userChose.current = true;
                setPhase('browsing');
              }}
              style={({pressed}) => ({
                opacity: pressed ? 0.6 : 1,
                marginTop: spacing.md,
              })}>
              <Text variant="label" tone="accent">
                İlçeyi kendim seçeceğim
              </Text>
            </Pressable>
          </View>
        )}

        {phase === 'ready' && selected && (
          <View>
            {/* Tek satır dilbilgisi: ad solda, eylem sağda. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}>
              <Text variant="headline">{selected.name}</Text>
              <Pressable
                onPress={() => setPhase('browsing')}
                style={({pressed}) => ({opacity: pressed ? 0.6 : 1})}>
                <Text variant="label" tone="accent">
                  Değiştir
                </Text>
              </Pressable>
            </View>
            <Text variant="caption" tone="muted" style={{marginTop: 2}}>
              {selected.name !== selected.province
                ? selected.province
                : 'İl merkezi'}
              {selected.approximate ? ' · yaklaşık' : ''}
            </Text>
          </View>
        )}

        {/* Günün tamamı — seçim doğruysa vakitler de doğru. İlk ekranda
            boşluk yerine ürünün kendisi duruyor. */}
        {phase === 'ready' && entries && (
          <View style={{marginTop: spacing.lg}}>
            <Divider />
            {entries.map(entry => {
              const passed = entry.isPassed;
              const isNext = entry.key === nextPrayer?.key;
              return (
                <View key={entry.key}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                    }}>
                    <Text
                      variant="body"
                      tone={isNext ? 'accent' : passed ? 'subtle' : 'primary'}>
                      {PRAYER_LABELS[entry.key]}
                    </Text>
                    <Text
                      variant="time"
                      tone={isNext ? 'accent' : passed ? 'subtle' : 'primary'}>
                      {formatClock(entry.time)}
                    </Text>
                  </View>
                  <Divider style={{marginTop: 8, marginBottom: 8}} />
                </View>
              );
            })}

            <Text variant="label" tone="muted" style={{marginTop: spacing.lg}}>
              Reklamsız · Konum cihazınızda kalır
            </Text>
          </View>
        )}

        {phase === 'browsing' && (
          <View style={{flex: 1}}>
            {note && (
              <Text
                variant="caption"
                tone="muted"
                style={{marginBottom: spacing.sm}}>
                {note}
              </Text>
            )}
            <View
              style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
              <Navigation size={14} color={palette.accent} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="İlçe ara (ör. Kadıköy)"
                placeholderTextColor={palette.inkSubtle}
                autoCorrect={false}
                autoFocus
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.hairlineStrong,
                  color: palette.ink,
                  fontSize: 16,
                }}
              />
            </View>
            <ScrollView
              style={{marginTop: spacing.md}}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {results.map(district => (
                <View key={`${district.province}-${district.name}`}>
                  <Pressable
                    onPress={() => choose(district)}
                    style={({pressed}) => ({
                      paddingVertical: spacing.md,
                      opacity: pressed ? 0.6 : 1,
                    })}>
                    <Text variant="body">{district.name}</Text>
                    {district.name !== district.province && (
                      <Text variant="caption" tone="muted">
                        {district.province}
                      </Text>
                    )}
                  </Pressable>
                  <Divider />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Seçim hazırken kalan boşluk buraya düşer; eylemler alta yapışır. */}
      <View style={{flex: phase === 'browsing' ? 0 : 1}} />

      {/* Bildirim — ayrı adım değil, tek satır */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
        }}>
        <View style={{flex: 1}}>
          <Text variant="body">Vakitten önce bildir</Text>
          <Text variant="caption" tone="muted" style={{marginTop: 2}}>
            İstediğiniz zaman kapatabilirsiniz
          </Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{false: palette.hairline, true: palette.accentSoft}}
          thumbColor={notifications ? palette.accent : palette.inkSubtle}
        />
      </View>

      <Button
        label="Başla"
        onPress={start}
        busy={starting}
        disabled={!selected || phase === 'detecting'}
        style={{marginTop: spacing.md}}
      />
    </View>
  );
}

/** SS:DD — onboarding'de tek bir saat gösterilir, tam saat biçimi yeter. */
function formatClock(date: Date): string {
  return (
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0')
  );
}
