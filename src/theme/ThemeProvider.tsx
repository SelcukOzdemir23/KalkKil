import React, {createContext, useContext, useMemo, ReactNode} from 'react';
import {Palette, darkPalette, lightPalette} from './palette';
import {motion, radius, spacing, typography} from './tokens';

export interface Theme {
  isDark: boolean;
  palette: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  const value = useMemo<Theme>(
    () => ({
      isDark,
      palette: isDark ? darkPalette : lightPalette,
      spacing,
      radius,
      typography,
      motion,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme, ThemeProvider içinde kullanılmalı');
  }
  return theme;
}
