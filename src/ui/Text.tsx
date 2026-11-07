import React from 'react';
import {Text as RNText, TextProps, TextStyle} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import type {TextVariant} from '../theme/tokens';

export type TextTone =
  | 'primary'
  | 'muted'
  | 'subtle'
  | 'accent'
  | 'success'
  | 'inverse';

export interface TextPropsWithVariant extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

/**
 * Uygulamanın tek metin bileşeni.
 *
 * Renk ve tipografi temadan gelir; ekranlar ham `fontSize`/`color` yazmaz.
 * Yeni bir metin stili gerekiyorsa `theme/tokens.ts` içindeki ölçeğe eklenir.
 */
export function Text({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextPropsWithVariant) {
  const theme = useTheme();
  const {palette} = theme;

  const toneColor: Record<TextTone, string> = {
    primary: palette.ink,
    muted: palette.inkMuted,
    subtle: palette.inkSubtle,
    accent: palette.accent,
    success: palette.success,
    inverse: palette.background,
  };

  const base = theme.typography[variant] as TextStyle;

  return (
    <RNText
      {...rest}
      style={[base, {color: toneColor[tone]}, style]}
    />
  );
}
