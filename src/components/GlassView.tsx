import React from 'react';
import {View, ViewStyle} from 'react-native';
import {colors} from '../theme/tokens';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * Lightweight premium surface component.
 * Uses solid/semi-solid dark surfaces instead of real blur for stability.
 */
export function GlassView({children, style, intensity = 'medium'}: GlassViewProps) {
  const backgroundMap = {
    light: colors.surfaceMuted,
    medium: colors.surface,
    heavy: colors.surfaceSoft,
  };

  return (
    <View
      style={[
        {
          backgroundColor: backgroundMap[intensity],
        },
        style,
      ]}>
      {children}
    </View>
  );
}
