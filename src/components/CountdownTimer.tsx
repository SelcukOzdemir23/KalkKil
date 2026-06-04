import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {useCountdown} from '../hooks/useCountdown';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {formatTime} from '../utils/format';

interface CountdownTimerProps {
  nextPrayer: PrayerTimeEntry | null;
  kerahatActive?: boolean;
  kerahatLabel?: string;
}

export function CountdownTimer({nextPrayer, kerahatActive, kerahatLabel}: CountdownTimerProps) {
  const {countdown} = useCountdown(nextPrayer ? nextPrayer.time : null);

  if (!nextPrayer) {
    return (
      <GlassView intensity="medium" style={{borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: 28, alignItems: 'center'}}>
          <AppText style={{fontSize: 24, color: 'rgba(255, 255, 255, 0.5)'}}>🌙</AppText>
          <AppText style={{fontSize: 15, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginTop: 10}}>
            Bugünün tüm vakitleri geçmiştir
          </AppText>
      </GlassView>
    );
  }

  const isKerahat = !!kerahatActive;
  const accentColor = isKerahat ? '#FF6B35' : '#00D4FF';

  return (
    <GlassView intensity="medium" style={{borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: `${accentColor}30`, paddingVertical: 22, paddingHorizontal: 20}}>
      
      {/* Neon glow */}
      <View style={{position: 'absolute', top: -60, right: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: `${accentColor}06`}} />

      {/* Kerahat warning */}
      {isKerahat && (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 107, 53, 0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 12}}>
          <AppText style={{fontSize: 13}}>⚠️</AppText>
          <AppText style={{fontSize: 12, fontWeight: '500', color: '#FF6B35', flex: 1}}>
            Kerâhet vakti — {kerahatLabel}
          </AppText>
        </View>
      )}

      {/* ÜST: SIRADAKİ VAKİT */}
      <View style={{alignItems: 'center', marginBottom: 16}}>
        <AppText style={{fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, color: `${accentColor}99`}}>
          {isKerahat ? 'UYARI' : 'SIRADAKİ VAKİT'}
        </AppText>
        <AppText style={{fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginTop: 4}}>
          {nextPrayer.nameTr}
        </AppText>
        <AppText style={{fontSize: 17, fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)', marginTop: 2}}>
          {formatTime(nextPrayer.time)}
        </AppText>
      </View>

      {/* Ayırıcı çizgi */}
      <View style={{height: 1, backgroundColor: `${accentColor}15`, marginBottom: 14}} />

      {/* ALT: KALAN SÜRE */}
      <View style={{alignItems: 'center'}}>
        <AppText style={{fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5, color: 'rgba(255, 255, 255, 0.3)'}}>
          KALAN SÜRE
        </AppText>
        <AppText
          style={{fontSize: 48, fontWeight: '200', letterSpacing: 10, color: accentColor, marginTop: 4, fontVariant: ['tabular-nums']}}
          accessibilityLabel={`Kalan süre: ${countdown}`}
          accessibilityLiveRegion="polite">
          {countdown}
        </AppText>
      </View>
    </GlassView>
  );
}
