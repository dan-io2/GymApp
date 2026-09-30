export const colors = {
  background: '#0B0D0F',
  backgroundElevated: '#101316',
  surfaceGlass: 'rgba(24, 28, 31, 0.82)',
  surfaceElevated: 'rgba(31, 36, 40, 0.94)',
  surfaceInteractive: 'rgba(42, 48, 53, 0.88)',
  surfaceSelected: 'rgba(118, 227, 166, 0.12)',
  surfaceNavigation: 'rgba(19, 22, 25, 0.92)',
  surfacePressed: 'rgba(52, 59, 64, 0.92)',
  surface: 'rgba(24, 28, 31, 0.82)',
  surfaceRaised: 'rgba(31, 36, 40, 0.94)',
  borderSubtle: 'rgba(255, 255, 255, 0.065)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#F5F7F6',
  textSecondary: '#B4BCB7',
  textMuted: '#7F8983',
  accent: '#76E3A6',
  accentStrong: '#3ACF7D',
  accentText: '#08140D',
  accentMuted: 'rgba(118, 227, 166, 0.14)',
  nutrition: '#76E3A6',
  nutritionStrong: '#3ACF7D',
  nutritionMuted: 'rgba(118, 227, 166, 0.14)',
  nutritionSurface: 'rgba(118, 227, 166, 0.055)',
  weight: '#63C7FF',
  weightStrong: '#369DEA',
  weightMuted: 'rgba(99, 199, 255, 0.14)',
  weightSurface: 'rgba(99, 199, 255, 0.055)',
  analytics: '#AA8CFF',
  analyticsStrong: '#8A63F6',
  analyticsMuted: 'rgba(170, 140, 255, 0.14)',
  analyticsSurface: 'rgba(170, 140, 255, 0.055)',
  carbohydrate: '#58D3E8',
  carbohydrateMuted: 'rgba(88, 211, 232, 0.14)',
  fat: '#C59BFF',
  fatMuted: 'rgba(197, 155, 255, 0.14)',
  success: '#76E3A6',
  successMuted: 'rgba(118, 227, 166, 0.14)',
  warning: '#F2B866',
  warningMuted: 'rgba(242, 184, 102, 0.14)',
  danger: '#FF7478',
  dangerMuted: 'rgba(255, 116, 120, 0.14)',
  information: '#72A9FF',
  informationMuted: 'rgba(114, 169, 255, 0.14)',
  overlay: 'rgba(0, 0, 0, 0.72)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  small: 4,
  medium: 6,
  card: 8,
  capsule: 999,
} as const;

export const controlHeights = {
  compact: 44,
  regular: 52,
  large: 56,
} as const;

export const iconSizes = {
  small: 16,
  medium: 20,
  large: 24,
  feature: 28,
} as const;

export const typography = {
  display: { fontSize: 52, lineHeight: 56, fontWeight: '800' as const },
  screenTitle: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  sectionTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700' as const },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '700' as const },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const },
  metric: { fontSize: 28, lineHeight: 32, fontWeight: '800' as const },
} as const;

export const motion = {
  quick: 140,
  standard: 220,
  deliberate: 320,
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  controlHeights,
  iconSizes,
  typography,
  motion,
} as const;

export const accents = {
  nutrition: {
    foreground: colors.nutrition,
    muted: colors.nutritionMuted,
    surface: colors.nutritionSurface,
  },
  weight: {
    foreground: colors.weight,
    muted: colors.weightMuted,
    surface: colors.weightSurface,
  },
  analytics: {
    foreground: colors.analytics,
    muted: colors.analyticsMuted,
    surface: colors.analyticsSurface,
  },
  carbohydrate: {
    foreground: colors.carbohydrate,
    muted: colors.carbohydrateMuted,
    surface: colors.backgroundElevated,
  },
  fat: {
    foreground: colors.fat,
    muted: colors.fatMuted,
    surface: colors.analyticsSurface,
  },
  attention: {
    foreground: colors.warning,
    muted: colors.warningMuted,
    surface: colors.surface,
  },
  destructive: {
    foreground: colors.danger,
    muted: colors.dangerMuted,
    surface: colors.surface,
  },
} as const;

export type AppColor = keyof typeof colors;
