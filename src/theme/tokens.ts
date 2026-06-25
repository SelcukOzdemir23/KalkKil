export const colors = {
  background: '#0D111F',
  backgroundAlt: '#090C16',
  surface: '#161B2B',
  surfaceSoft: '#1A2035',
  surfaceMuted: '#111624',
  border: 'rgba(155, 154, 144, 0.12)',
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
  /** Pusula ve kıble için kullanılan renkler */
  compassNorth: '#E87171',
  compassSouth: '#7BAE8D',
  qiblaGold: '#D6B46A',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
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
