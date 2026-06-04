import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {GlassView} from './GlassView';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {formatTime} from '../utils/format';

interface PrayerCardProps {
  entry: PrayerTimeEntry;
  isNext: boolean;
}

export function PrayerCard({entry, isNext}: PrayerCardProps) {
  const isKerahat = entry.isKerahat;
  const isPassed = entry.isPassed;

  const accentColor = isKerahat ? '#FF6B35' : '#00D4FF';
  const dotColor = isPassed ? 'rgba(255, 255, 255, 0.15)' : isKerahat ? '#FF6B35' : '#00D4FF';

  return (
    <GlassView
      intensity="medium"
      style={{
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isNext ? `${accentColor}50` : 'rgba(255, 255, 255, 0.06)',
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 72,
      }}>
      
      {/* Neon glow for next prayer */}
      {isNext && (
        <View style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: `${accentColor}06`,
        }} />
      )}

      {/* Status dot */}
      <View style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: dotColor,
        shadowColor: dotColor,
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: isPassed ? 0 : 0.6,
        shadowRadius: 4,
        elevation: isPassed ? 0 : 2,
        marginBottom: 6,
      }} />

      {/* Prayer name */}
      <AppText style={{
        fontSize: 12,
        fontWeight: '600',
        color: isPassed ? 'rgba(255, 255, 255, 0.25)' : '#FFFFFF',
        marginBottom: 4,
      }}>
        {entry.nameTr}
      </AppText>

      {/* Time */}
      <AppText style={{
        fontSize: 18,
        fontWeight: '600',
        color: isPassed ? 'rgba(255, 255, 255, 0.25)' : accentColor,
        fontVariant: ['tabular-nums'],
      }}>
        {formatTime(entry.time)}
      </AppText>

      {/* Kerahat warning */}
      {isKerahat && !isPassed && (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4}}>
          <AppText style={{fontSize: 8}}>⚠️</AppText>
          <AppText style={{fontSize: 8, color: '#FF6B35', fontWeight: '500'}}>Kerâhet</AppText>
        </View>
      )}
    </GlassView>
  );
}
