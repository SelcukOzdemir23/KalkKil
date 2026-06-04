import React from 'react';
import {View} from 'react-native';
import {AppText} from './AppText';
import {PrayerTimeEntry} from '../services/prayerTimes';
import {PrayerCard} from './PrayerCard';

interface PrayerListProps {
  entries: PrayerTimeEntry[];
  nextPrayer: PrayerTimeEntry | null;
}

export function PrayerList({entries, nextPrayer}: PrayerListProps) {
  if (entries.length === 0) {
    return null;
  }

  // 2x3 grid: split entries into rows of 2
  const rows: PrayerTimeEntry[][] = [];
  for (let i = 0; i < entries.length; i += 2) {
    rows.push(entries.slice(i, i + 2));
  }

  return (
    <View style={{flex: 1}}>
      <AppText style={{
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.25)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10,
      }}>
        GÜNÜN VAKİTLERİ
      </AppText>
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            gap: 8,
            marginBottom: 8,
          }}>
          {row.map(entry => (
            <PrayerCard
              key={entry.name}
              entry={entry}
              isNext={nextPrayer !== null && entry.name === nextPrayer.name}
            />
          ))}
          {/* Fill empty cell if odd number */}
          {row.length < 2 && <View style={{flex: 1}} />}
        </View>
      ))}
    </View>
  );
}
