import React from 'react';
import {View, ViewStyle} from 'react-native';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * Native olmayan cam efekti bileşeni.
 * @react-native-community/blur yerine semi-transparent background ile çalışır,
 * böylece native modül gerektirmez ve her cihazda crash yapmaz.
 */
export function GlassView({children, style, intensity = 'medium'}: GlassViewProps) {
  const opacityMap = {
    light: 'rgba(13, 17, 31, 0.7)',
    medium: 'rgba(13, 17, 31, 0.82)',
    heavy: 'rgba(13, 17, 31, 0.9)',
  };

  return (
    <View
      style={[
        {
          backgroundColor: opacityMap[intensity],
        },
        style,
      ]}>
      {children}
    </View>
  );
}
