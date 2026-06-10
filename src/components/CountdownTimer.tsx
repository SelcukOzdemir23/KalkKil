import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {useCountdown} from '../hooks/useCountdown';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {formatTime} from '../utils/format';
import {colors, radius, shadows} from '../theme/tokens';

interface CountdownTimerProps {
  nextPrayer: PrayerTimeEntry | null;
  kerahatActive?: boolean;
  kerahatLabel?: string;
}


export function CountdownTimer({nextPrayer, kerahatActive, kerahatLabel}: CountdownTimerProps) {
  const {countdown} = useCountdown(nextPrayer ? nextPrayer.time : null);

  if (!nextPrayer) {
    return (
      <GlassView
        intensity="medium"
        style={{
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          padding: 28,
          alignItems: 'center',
          ...shadows.subtle,
        }}>
        <AppText style={{fontSize: 26, color: colors.accent}}>☾</AppText>
        <AppText style={{fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center', marginTop: 10}}>
          Yarına hazırlanıyor...
        </AppText>
        <AppText style={{fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4}}>
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
        paddingVertical: 24,
        paddingHorizontal: 22,
        ...shadows.card,
      }}>
      <View
        style={{
          position: 'absolute',
          top: -70,
          right: -72,
          width: 172,
          height: 172,
          borderRadius: 86,
          backgroundColor: isKerahat ? colors.dangerSoft : colors.accentSoft,
        }}
      />

      {isKerahat && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.dangerSoft,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'rgba(217, 135, 95, 0.22)',
          }}>
          <AppText style={{fontSize: 14}}>⚠️</AppText>
          <AppText style={{fontSize: 13, fontWeight: '600', color: colors.danger, flex: 1}}>
            Kerâhet vakti — {kerahatLabel}
          </AppText>
        </View>
      )}

      <View style={{alignItems: 'center'}}>
        <AppText style={{fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.2, color: isKerahat ? colors.danger : colors.accentMuted}}>
          {isKerahat ? 'Dikkat' : 'Sıradaki Vakit'}
        </AppText>
        <AppText style={{fontSize: 42, fontWeight: '700', color: colors.text, marginTop: 6, textAlign: 'center'}}>
          {nextPrayer.nameTr}
        </AppText>
        <AppText style={{fontSize: 20, fontWeight: '600', color: colors.textMuted, marginTop: 2, fontVariant: ['tabular-nums']}}>
          {formatTime(nextPrayer.time)}
        </AppText>
      </View>

      <View style={{height: 1, backgroundColor: isKerahat ? 'rgba(217, 135, 95, 0.16)' : 'rgba(214, 180, 106, 0.16)', marginVertical: 18}} />

      <View style={{alignItems: 'center'}}>
        <AppText
          style={{fontSize: 28, fontWeight: '700', color: accentColor, fontVariant: ['tabular-nums'], textAlign: 'center'}}
          accessibilityLabel={`Kalan süre: ${countdown}`}
          accessibilityLiveRegion="polite">
          {countdown}
        </AppText>
      </View>
    </GlassView>
  );
}
