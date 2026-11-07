import React from 'react';
import {View} from 'react-native';
import {PrayerEntry} from '../../domain/prayer';
import {PRAYER_LABELS} from '../../i18n/tr';
import {useTheme} from '../../theme/ThemeProvider';
import {Divider} from '../../ui/Divider';
import {Text} from '../../ui/Text';
import {formatTime} from '../../utils/format';

interface PrayerRowsProps {
  entries: PrayerEntry[];
}

/**
 * Günün vakitleri: kart yığını değil, saç teli ayırıcılı satırlar.
 *
 * Sıradaki vakit kızıl nokta ve tam kontrastla ayrılır; geçenler geri çekilir.
 */
export function PrayerRows({entries}: PrayerRowsProps) {
  const {palette, spacing} = useTheme();
  const nextIndex = entries.findIndex(entry => !entry.isPassed);

  return (
    <View>
      {entries.map((entry, index) => {
        const isNext = index === nextIndex;

        return (
          <View key={entry.key}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.lg - 2,
              }}>
              <View
                style={{
                  width: isNext ? 5 : 3,
                  height: isNext ? 5 : 3,
                  borderRadius: 99,
                  marginRight: spacing.md,
                  backgroundColor: isNext
                    ? palette.accent
                    : entry.isPassed
                    ? palette.inkSubtle
                    : palette.inkMuted,
                }}
              />

              <Text
                variant={isNext ? 'headline' : 'body'}
                tone={entry.isPassed && !isNext ? 'subtle' : 'primary'}>
                {PRAYER_LABELS[entry.key]}
              </Text>

              <View style={{flex: 1}} />

              <Text
                variant="time"
                tone={isNext ? 'accent' : entry.isPassed ? 'subtle' : 'muted'}>
                {formatTime(entry.time)}
              </Text>
            </View>

            {index < entries.length - 1 && <Divider />}
          </View>
        );
      })}
    </View>
  );
}
