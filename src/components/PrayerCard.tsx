import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {formatTime} from '../utils/format';
import {colors, radius} from '../theme/tokens';

interface PrayerCardProps {
  entry: PrayerTimeEntry;
  isNext: boolean;
}

export function PrayerCard({entry, isNext}: PrayerCardProps) {
  const isKerahat = entry.isKerahat;
  const isPassed = entry.isPassed;
  const accentColor = isKerahat ? colors.danger : colors.accent;

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isNext ? (isKerahat ? 'rgba(217, 135, 95, 0.34)' : colors.borderStrong) : colors.border,
        paddingVertical: 13,
        paddingHorizontal: 14,
        marginBottom: 8,
        opacity: isPassed && !isNext ? 0.58 : 1,
        backgroundColor: isNext ? colors.surfaceSoft : colors.surfaceMuted,
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: isNext ? accentColor : isPassed ? 'rgba(244, 241, 234, 0.18)' : colors.accentMuted,
            marginRight: 12,
          }}
        />

        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <AppText
              style={{
                fontSize: 16,
                fontWeight: isNext ? '700' : '600',
                color: isPassed && !isNext ? colors.textSubtle : colors.text,
              }}>
              {entry.nameTr}
            </AppText>
            {isNext && (
              <View
                style={{
                  borderRadius: radius.sm,
                  backgroundColor: isKerahat ? colors.dangerSoft : colors.accentSoft,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}>
                <AppText style={{fontSize: 10, fontWeight: '700', color: accentColor}}>
                  Sıradaki
                </AppText>
              </View>
            )}
          </View>
          {isKerahat && !isPassed && (
            <AppText style={{fontSize: 11, color: colors.danger, marginTop: 3}}>
              Kerâhet vakti
            </AppText>
          )}
        </View>

        <AppText
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: isNext ? accentColor : isPassed ? colors.textSubtle : colors.textMuted,
            fontVariant: ['tabular-nums'],
          }}>
          {formatTime(entry.time)}
        </AppText>
      </View>
    </View>
  );
}
