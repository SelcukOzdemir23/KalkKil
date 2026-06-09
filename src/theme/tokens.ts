export const colors = {
  background: '#101612',
  backgroundAlt: '#0B100D',
  surface: '#17201A',
  surfaceSoft: '#1D2A22',
  surfaceMuted: '#121A15',
  border: 'rgba(232, 222, 201, 0.10)',
  borderStrong: 'rgba(214, 180, 106, 0.26)',
  text: '#F4F1EA',
  textMuted: 'rgba(244, 241, 234, 0.62)',
  textSubtle: 'rgba(244, 241, 234, 0.38)',
  accent: '#D6B46A',
  accentSoft: 'rgba(214, 180, 106, 0.12)',
  accentMuted: 'rgba(214, 180, 106, 0.62)',
  green: '#7BAE8D',
  greenSoft: 'rgba(123, 174, 141, 0.14)',
  danger: '#D9875F',
  dangerSoft: 'rgba(217, 135, 95, 0.14)',
  blackOverlay: 'rgba(0, 0, 0, 0.62)',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
} as const;
