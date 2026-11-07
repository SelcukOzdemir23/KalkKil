import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {PrayerEntry} from '../domain/prayer';
import {PrayerCard} from './PrayerCard';
import {colors} from '../theme/tokens';

interface PrayerListProps {
  entries: PrayerEntry[];
  nextPrayer: PrayerEntry | null;
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
            letterSpacing: 0.4,
          }}>
          Günün Vakitleri
        </AppText>
      </View>
      {entries.map(entry => (
        <PrayerCard
          key={entry.key}
          entry={entry}
          isNext={nextPrayer !== null && entry.key === nextPrayer.key}
        />
      ))}
    </View>
  );
}
