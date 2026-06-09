import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {PrayerCard} from './PrayerCard';
import {colors} from '../theme/tokens';

interface PrayerListProps {
  entries: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
}

export function PrayerList({entries, nextPrayer}: PrayerListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View>
      <View style={{marginBottom: 10}}>
        <AppText
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.textSubtle,
            textTransform: 'uppercase',
            letterSpacing: 1.8,
          }}>
          Günün Vakitleri
        </AppText>
      </View>
      {entries.map(entry => (
        <PrayerCard
          key={entry.name}
          entry={entry}
          isNext={nextPrayer !== null && entry.name === nextPrayer.name}
        />
      ))}
    </View>
  );
}
