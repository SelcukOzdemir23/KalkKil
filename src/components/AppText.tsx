import React from 'react';
import {Text as RNText, TextProps, StyleSheet} from 'react-native';

const FONT_MAP: Record<string, string> = {
  '400': 'Alegreya-Regular',
  normal: 'Alegreya-Regular',
  '500': 'Alegreya-Medium',
  '600': 'Alegreya-SemiBold',
  '700': 'Alegreya-Bold',
  bold: 'Alegreya-Bold',
  '800': 'Alegreya-Bold',
};

export function AppText({style, ...props}: TextProps) {
  const s = StyleSheet.flatten(style) || {};

  // Özel font (monospace gibi) kullanılıyorsa dokunma
  if (s.fontFamily && !s.fontFamily.startsWith('Alegreya')) {
    return <RNText {...props} style={style} />;
  }

  const family = FONT_MAP[String(s.fontWeight ?? '400')] || 'EBGaramond-Regular';
  // fontWeight'ü kaldır, iOS'ta sentetik bold'u önle
  const {fontWeight, ...rest} = s;

  return <RNText {...props} style={[rest, {fontFamily: family}]} />;
}
