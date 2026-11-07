import React, {ReactNode} from 'react';
import {View, ViewProps, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import {radius as radiusScale} from '../theme/tokens';

export type SurfaceTone = 'surface' | 'muted' | 'transparent' | 'accent';
export type SurfaceRadius = keyof typeof radiusScale;

export interface SurfaceProps extends ViewProps {
  tone?: SurfaceTone;
  rounded?: SurfaceRadius;
  /** Saç teli kalınlığında kenarlık. Gölge yerine bunu kullanıyoruz. */
  bordered?: boolean;
  borderedStrong?: boolean;
  children?: ReactNode;
}

export function Surface({
  tone = 'surface',
  rounded = 'lg',
  bordered = false,
  borderedStrong = false,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const {palette, radius} = useTheme();

  const background: Record<SurfaceTone, string> = {
    surface: palette.surface,
    muted: palette.surfaceMuted,
    transparent: 'transparent',
    accent: palette.accentSoft,
  };

  const computed: ViewStyle = {
    backgroundColor: background[tone],
    borderRadius: radius[rounded],
    ...(bordered || borderedStrong
      ? {
          borderWidth: 1,
          borderColor: borderedStrong ? palette.hairlineStrong : palette.hairline,
        }
      : null),
  };

  return (
    <View {...rest} style={[computed, style]}>
      {children}
    </View>
  );
}
