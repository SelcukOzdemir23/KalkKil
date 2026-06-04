import React from 'react';
import {Text as RNText, TextProps, StyleSheet} from 'react-native';

const FONT_MAP: Record<string, string> = {
  '400': 'EBGaramond-Regular',
  normal: 'EBGaramond-Regular',
  '500': 'EBGaramond-Medium',
  '600': 'EBGaramond-SemiBold',
  '700': 'EBGaramond-Bold',
  bold: 'EBGaramond-Bold',
  '800': 'EBGaramond-Bold',
};

export function AppText({style, ...props}: TextProps) {
  const s = StyleSheet.flatten(style) || {};

  // Özel font (monospace gibi) kullanılıyorsa dokunma
  if (s.fontFamily && !s.fontFamily.startsWith('EBGaramond')) {
    return <RNText {...props} style={style} />;
  }

  const family = FONT_MAP[String(s.fontWeight ?? '400')] || 'EBGaramond-Regular';
  // fontWeight'ü kaldır, iOS'ta sentetik bold'u önle
  const {fontWeight, ...rest} = s;

  return <RNText {...props} style={[rest, {fontFamily: family}]} />;
}
