import React, {useState} from 'react';
import {View, LayoutChangeEvent} from 'react-native';
import {KerahatWindow, PrayerEntry} from '../../domain/prayer';
import {PRAYER_LABELS} from '../../i18n/tr';
import {useTheme} from '../../theme/ThemeProvider';
import {Text} from '../../ui/Text';

interface DayStripProps {
  entries: PrayerEntry[];
  kerahatWindows: KerahatWindow[];
  now: Date;
}

/** Etiketin çentiğe göre yarım genişliği; taşmayı engellemek için. */
const LABEL_WIDTH = 44;
const RAIL_TOP = 26;
const STRIP_HEIGHT = 62;

/**
 * Gün Şeridi — uygulamanın imza bileşeni.
 *
 * Günü yatay bir zaman çizgisi olarak gösterir: vakitler çentik, "şimdi"
 * işaretçi, kerahat aralıkları taralı bant. Amaç, geri sayımın yanında
 * "günün neresindeyim" sorusunu tek bakışta cevaplamak.
 */
export function DayStrip({entries, kerahatWindows, now}: DayStripProps) {
  const {palette, radius} = useTheme();
  const [width, setWidth] = useState(0);

  if (entries.length === 0) {
    return null;
  }

  const start = entries[0].time.getTime();
  const end = entries[entries.length - 1].time.getTime();
  const span = Math.max(end - start, 1);

  const position = (time: number) =>
    Math.min(Math.max((time - start) / span, 0), 1) * width;

  const nowX = position(now.getTime());

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      style={{height: STRIP_HEIGHT, marginHorizontal: 2}}>
      {width > 0 && (
        <>
          {/* Kerahat aralıkları — rayın arkasında sakin bir bant */}
          {kerahatWindows.map(window => {
            const left = position(window.start.getTime());
            const right = position(window.end.getTime());
            if (right - left < 1) {
              return null;
            }
            return (
              <View
                key={`${window.reason}-${left}`}
                style={{
                  position: 'absolute',
                  left,
                  width: Math.max(right - left, 2),
                  top: RAIL_TOP - 7,
                  height: 15,
                  borderRadius: 4,
                  backgroundColor: palette.accentSoft,
                }}
              />
            );
          })}

          {/* Ray */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              width,
              top: RAIL_TOP,
              height: 1,
              backgroundColor: palette.hairline,
            }}
          />

          {/* Geçen kısım — günün ne kadarının geçtiğini gösterir */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              width: nowX,
              top: RAIL_TOP,
              height: 1,
              backgroundColor: palette.inkSubtle,
            }}
          />

          {/* Vakit çentikleri ve etiketleri */}
          {entries.map((entry, index) => {
            const x = position(entry.time.getTime());
            const isNext =
              index === entries.findIndex(e => !e.isPassed);
            const dotColor = isNext
              ? palette.accent
              : entry.isPassed
              ? palette.inkSubtle
              : palette.inkMuted;

            return (
              <View key={entry.key} pointerEvents="none">
                <View
                  style={{
                    position: 'absolute',
                    left: x - (isNext ? 3.5 : 2.5),
                    top: RAIL_TOP - (isNext ? 3.5 : 2.5),
                    width: isNext ? 7 : 5,
                    height: isNext ? 7 : 5,
                    borderRadius: 99,
                    backgroundColor: dotColor,
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    left: Math.min(
                      Math.max(x - LABEL_WIDTH / 2, 0),
                      Math.max(width - LABEL_WIDTH, 0),
                    ),
                    top: RAIL_TOP + 12,
                    width: LABEL_WIDTH,
                    alignItems: 'center',
                  }}>
                  <Text
                    variant="label"
                    tone={isNext ? 'accent' : entry.isPassed ? 'subtle' : 'muted'}
                    numberOfLines={1}>
                    {PRAYER_LABELS[entry.key]}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* "Şimdi" işaretçisi */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: Math.max(nowX - 1, 0),
              top: RAIL_TOP - 10,
              width: 2,
              height: 21,
              borderRadius: 2,
              backgroundColor: palette.accent,
              opacity: 0.55,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: Math.max(nowX - 2.5, 0),
              top: RAIL_TOP - 2.5,
              width: 5,
              height: 5,
              borderRadius: radius.full,
              backgroundColor: palette.accent,
            }}
          />
        </>
      )}
    </View>
  );
}
