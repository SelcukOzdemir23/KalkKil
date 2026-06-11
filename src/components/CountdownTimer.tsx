import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {formatTime} from '../utils/format';
import {colors, radius, shadows} from '../theme/tokens';

interface CountdownTimerProps {
  nextPrayer: PrayerTimeEntry | null;
  countdown: string;
  kerahatActive?: boolean;
  kerahatLabel?: string;
}


export function CountdownTimer({nextPrayer, countdown, kerahatActive, kerahatLabel}: CountdownTimerProps) {

  if (!nextPrayer) {
    return (
      <GlassView
        intensity="medium"
        style={{
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          padding: 20,
          alignItems: 'center',
          ...shadows.subtle,
        }}>
        <AppText style={{fontSize: 22, color: colors.accent}}>☾</AppText>
        <AppText style={{fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 8}}>
          Yarına hazırlanıyor...
        </AppText>
        <AppText style={{fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 3}}>
          Yeni günün vakitleri hesaplanıyor.
        </AppText>
      </GlassView>
    );
  }

  const isKerahat = !!kerahatActive;
  const accentColor = isKerahat ? colors.danger : colors.accent;

  return (
    <GlassView
      intensity="medium"
      style={{
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isKerahat ? 'rgba(217, 135, 95, 0.30)' : colors.borderStrong,
        paddingVertical: 18,
        paddingHorizontal: 20,
        ...shadows.card,
      }}>
      <View
        style={{
          position: 'absolute',
          top: -50,
          right: -52,
          width: 130,
          height: 130,
          borderRadius: 65,
          backgroundColor: isKerahat ? colors.dangerSoft : colors.accentSoft,
        }}
      />

      {isKerahat && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.dangerSoft,
            borderRadius: radius.sm,
            paddingHorizontal: 10,
            paddingVertical: 6,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: 'rgba(217, 135, 95, 0.22)',
          }}>
          <AppText style={{fontSize: 12}}>⚠️</AppText>
          <AppText style={{fontSize: 11, fontWeight: '600', color: colors.danger, flex: 1}}>
            Kerâhet — {kerahatLabel}
          </AppText>
        </View>
      )}

      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View>
          <AppText style={{fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.8, color: isKerahat ? colors.danger : colors.accentMuted}}>
            {isKerahat ? 'Dikkat' : 'Sıradaki Vakit'}
          </AppText>
          <AppText style={{fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 2}}>
            {nextPrayer.nameTr}
          </AppText>
          <AppText style={{fontSize: 14, fontWeight: '500', color: colors.textMuted, marginTop: 1, fontVariant: ['tabular-nums']}}>
            {formatTime(nextPrayer.time)}
          </AppText>
        </View>

        <View style={{alignItems: 'flex-end'}}>
          <AppText
            style={{fontSize: 24, fontWeight: '800', color: accentColor, fontVariant: ['tabular-nums']}}
            accessibilityLabel={`Kalan süre: ${countdown}`}
            accessibilityLiveRegion="polite">
            {countdown}
          </AppText>
        </View>
      </View>
    </GlassView>
  );
}
