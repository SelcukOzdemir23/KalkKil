import React from 'react';
import {Pressable} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {Text} from './Text';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Seçilebilir etiket. Yarıçap 12 — DESIGN.md'deki etkileşimli öğe kuralı. */
export function Chip({label, selected, onPress}: ChipProps) {
  const {palette, radius, spacing} = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected}}
      style={({pressed}) => ({
        paddingVertical: spacing.sm + 1,
        paddingHorizontal: spacing.lg - 2,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: selected ? palette.accent : palette.hairlineStrong,
        backgroundColor: selected ? palette.accentSoft : 'transparent',
        opacity: pressed ? 0.75 : 1,
      })}>
      <Text variant="label" tone={selected ? 'accent' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}
