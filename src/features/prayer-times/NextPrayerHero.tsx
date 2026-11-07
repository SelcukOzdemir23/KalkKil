import React from 'react';
import {View} from 'react-native';
import {PrayerEntry} from '../../domain/prayer';
import {PRAYER_LABELS} from '../../i18n/tr';
import {useTheme} from '../../theme/ThemeProvider';
import {Text} from '../../ui/Text';
import {formatTime} from '../../utils/format';

interface NextPrayerHeroProps {
  nextPrayer: PrayerEntry | null;
  countdown: string;
}

/**
 * Ana ekranın odağı: sıradaki vakit ve kalan süre.
 *
 * Ekranda tek bir baskın sayı var; diğer her şey onun etrafında sakin duruyor.
 */
export function NextPrayerHero({nextPrayer, countdown}: NextPrayerHeroProps) {
  const {spacing} = useTheme();

  if (!nextPrayer) {
    return (
      <View style={{paddingVertical: spacing.xl}}>
        <Text variant="title">Yarın</Text>
        <Text variant="caption" tone="muted" style={{marginTop: spacing.xs}}>
          Yeni günün vakitleri hazırlanıyor.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text variant="caption" tone="muted">
        Sıradaki vakit
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginTop: spacing.xs,
        }}>
        <Text variant="title">{PRAYER_LABELS[nextPrayer.key]}</Text>
        <Text variant="time" tone="muted">
          {formatTime(nextPrayer.time)}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          gap: spacing.sm,
          marginTop: spacing.lg,
        }}>
        <Text variant="numeric">{countdown}</Text>
        <Text variant="caption" tone="muted">
          kaldı
        </Text>
      </View>
    </View>
  );
}
