import React from 'react';
import {Pressable, ActivityIndicator, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {Text} from './Text';

type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}

/**
 * Tek buton bileşeni.
 *
 * `primary`: tek dolu vurgu — ekranda bir tane olmalı.
 * `ghost`: ikincil eylem, çerçeveli.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
}: ButtonProps) {
  const {palette, radius, spacing} = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{disabled: disabled || busy}}
      style={({pressed}) => ({
        ...style,
        paddingVertical: spacing.lg - 2,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isPrimary
          ? palette.accent
          : pressed
          ? palette.accentSoft
          : 'transparent',
        borderWidth: isPrimary ? 0 : 1,
        borderColor: palette.hairlineStrong,
        opacity: disabled ? 0.4 : busy ? 0.7 : pressed && isPrimary ? 0.85 : 1,
      })}>
      {busy ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? palette.background : palette.accent}
        />
      ) : (
        <Text variant="label" tone={isPrimary ? 'inverse' : 'accent'}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
