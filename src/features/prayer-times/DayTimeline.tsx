import React, {useState} from 'react';
import {View, LayoutChangeEvent} from 'react-native';
import {KerahatWindow, PrayerEntry} from '../../domain/prayer';
import {PRAYER_LABELS} from '../../i18n/tr';
import {useTheme} from '../../theme/ThemeProvider';
import {Text} from '../../ui/Text';
import {formatTime} from '../../utils/format';

interface DayTimelineProps {
  entries: PrayerEntry[];
  kerahatWindows: KerahatWindow[];
  now: Date;
}

/** İki vakit arasındaki en küçük dikey mesafe (etiket sığsın). */
const MIN_ROW = 46;
/** Orantılı yerleşimin çizim yüksekliği; gerçek yükseklik dolunca hesaplanır. */
const SPAN_HEIGHT = 430;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;
const SPINE_X = 20;
const LABEL_LEFT = 44;
const ROW_HEIGHT = 46;

/**
 * Gün Çizgisi — günü dikey, zamanla orantılı bir eksen olarak gösterir.
 *
 * Yatay bir şeritte altı etiket sığmadığı için etiketler kaydırılıyordu; bu,
 * bilgi taşımayan bir düzen hilesiydi. Dikey eksende böyle bir sıkışma yok.
 * Ayrıca aralıklar gerçek zamana orantılı: ikindi–akşam arası ile
 * imsak–güneş arasının farklı olduğu görülüyor.
 *
 * "Şimdi" ile sıradaki vakit arasındaki eksen parçası vurgu renginde: kalan
 * süre görsel olarak bir uzunluk. Geri sayım sayıyla, bu da uzunlukla.
 */
export function DayTimeline({entries, kerahatWindows, now}: DayTimelineProps) {
  const {palette} = useTheme();
  const [width, setWidth] = useState(0);

  if (entries.length === 0) {
    return null;
  }

  const first = entries[0].time.getTime();
  const last = entries[entries.length - 1].time.getTime();
  const span = Math.max(last - first, 1);

  // Ham orantılı konumlar, sonra en küçük satır aralığına göre itilir.
  const raw = entries.map(e => ((e.time.getTime() - first) / span) * SPAN_HEIGHT);
  const ys = [...raw];
  for (let i = 1; i < ys.length; i++) {
    ys[i] = Math.max(ys[i], ys[i - 1] + MIN_ROW);
  }

  const height = ys[ys.length - 1] + PAD_TOP + PAD_BOTTOM;
  const at = (y: number) => y + PAD_TOP;

  const nextIndex = entries.findIndex(entry => !entry.isPassed);
  const nowRaw = ((now.getTime() - first) / span) * SPAN_HEIGHT;
  const nowY = at(Math.min(Math.max(nowRaw, 0), ys[ys.length - 1]));
  const nextY =
    nextIndex >= 0 ? at(ys[nextIndex]) : height;

  // Vakit düğümlerine çok yakın çentikleri çizme — çakışmasın.
  const hourTicks: number[] = [];
  const firstHour = new Date(first);
  firstHour.setMinutes(0, 0, 0);
  firstHour.setHours(firstHour.getHours() + 1);
  for (let t = firstHour.getTime(); t < last; t += 3600_000) {
    const y = ((t - first) / span) * SPAN_HEIGHT;
    const tooClose = ys.some(nodeY => Math.abs(nodeY - y) < 7);
    if (!tooClose) {
      hourTicks.push(t);
    }
  }

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} style={{height}}>
      {width > 0 && (
        <>
          {/* Kerahat aralıkları — eksenin arkasında sakin bantlar */}
          {kerahatWindows.map(window => {
            const startY = at(((window.start.getTime() - first) / span) * SPAN_HEIGHT);
            const endY = at(((window.end.getTime() - first) / span) * SPAN_HEIGHT);
            const top = Math.max(Math.min(startY, height), 0);
            const bottom = Math.max(Math.min(endY, height), top);
            if (bottom - top < 2) {
              return null;
            }
            return (
              <View
                key={`${window.reason}-${top}`}
                style={{
                  position: 'absolute',
                  left: SPINE_X - 2,
                  top,
                  width: 5,
                  height: bottom - top,
                  borderRadius: 3,
                  backgroundColor: palette.accentFaint,
                }}
              />
            );
          })}

          {/* Saat çentikleri — uzun aralıkların zaman olduğu okunsun */}
          {hourTicks.map(tick => (
            <View
              key={`h-${tick}`}
              style={{
                position: 'absolute',
                left: SPINE_X - 2,
                top: at(((tick - first) / span) * SPAN_HEIGHT),
                width: 5,
                height: 1,
                backgroundColor: palette.hairlineStrong,
              }}
            />
          ))}

          {/* Geçen gün */}
          <View
            style={{
              position: 'absolute',
              left: SPINE_X,
              top: 0,
              width: 1,
              height: nowY,
              backgroundColor: palette.inkSubtle,
            }}
          />

          {/* Kalan süre — vurgu renginde bir uzunluk */}
          <View
            style={{
              position: 'absolute',
              left: SPINE_X - 0.5,
              top: nowY,
              width: 2,
              height: Math.max(nextY - nowY, 0),
              borderRadius: 1,
              backgroundColor: palette.accent,
            }}
          />

          {/* Günün geri kalanı */}
          <View
            style={{
              position: 'absolute',
              left: SPINE_X,
              top: nextY,
              width: 1,
              height: Math.max(height - nextY, 0),
              backgroundColor: palette.hairline,
            }}
          />

          {/* "Şimdi" işareti — eksenin solunda kısa bir çentik.
              Sağa taşırırsak sıradaki vakit düğümüyle birleşip okunmuyor;
              düğüme çok yakınsa hiç çizmiyoruz. */}
          {Math.abs(nextY - nowY) > 10 && (
          <View
            style={{
              position: 'absolute',
              left: SPINE_X - 10,
              top: nowY - 1,
              width: 8,
              height: 2,
              borderRadius: 1,
              backgroundColor: palette.accent,
            }}
          />
          )}

          {/* Vakit düğümleri ve etiketleri */}
          {entries.map((entry, index) => {
            const y = at(ys[index]);
            const isNext = index === nextIndex;
            const size = isNext ? 9 : 6;

            return (
              <View key={entry.key} pointerEvents="none">
                <View
                  style={{
                    position: 'absolute',
                    left: SPINE_X - size / 2,
                    top: y - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size,
                    backgroundColor: isNext
                      ? palette.accent
                      : entry.isPassed
                      ? palette.background
                      : palette.background,
                    borderWidth: isNext ? 0 : 1,
                    borderColor: entry.isPassed
                      ? palette.inkSubtle
                      : palette.inkMuted,
                  }}
                />

                <View
                  style={{
                    position: 'absolute',
                    left: LABEL_LEFT,
                    top: y - ROW_HEIGHT / 2,
                    height: ROW_HEIGHT,
                    right: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text
                    variant="headline"
                    tone={isNext || !entry.isPassed ? 'primary' : 'muted'}>
                    {PRAYER_LABELS[entry.key]}
                  </Text>

                  <View style={{flex: 1}} />

                  <Text
                    variant="time"
                    tone={isNext ? 'accent' : entry.isPassed ? 'muted' : 'primary'}>
                    {formatTime(entry.time)}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}
