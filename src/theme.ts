/**
 * Ludo Midnight Diorama tokens, lifted from the Stitch project's Tailwind
 * config so native styles and the 3D scene share one source of truth.
 * See DESIGN.md for the full specification.
 */

export const C = {
  background: '#0f131d',
  onBackground: '#dfe2f1',
  surface: '#0f131d',
  surfaceDim: '#0f131d',
  surfaceBright: '#353944',
  surfaceLowest: '#0a0e18',
  surfaceLow: '#171b26',
  surfaceContainer: '#1c1f2a',
  surfaceHigh: '#262a35',
  surfaceHighest: '#313540',
  surfaceVariant: '#313540',
  onSurface: '#dfe2f1',
  onSurfaceVariant: '#c1c6d7',
  outline: '#8b90a1',
  outlineVariant: '#414755',

  primary: '#afc6ff',
  onPrimary: '#002d6c',
  primaryContainer: '#518dff',
  onPrimaryContainer: '#00275f',
  primaryFixed: '#d9e2ff',
  inversePrimary: '#0059c6',

  secondary: '#ffb3b5',
  onSecondary: '#680019',
  secondaryContainer: '#da003f',
  onSecondaryContainer: '#ffeceb',

  tertiary: '#ffba38',
  onTertiary: '#432c00',
  tertiaryContainer: '#c08600',
  onTertiaryContainer: '#3a2600',
  tertiaryFixed: '#ffdeac',

  error: '#ffb4ab',
  onError: '#690005',

  /* Brand jewel tones */
  canvas: '#0b0f19',
  sheet: '#121826',
  frame: '#1e2640',
  sapphire: '#0075ff',
  sapphireDeep: '#0051b3',
  sapphireGlow: '#38b6ff',
  ruby: '#ff2e55',
  rubyDeep: '#b3001f',
  topaz: '#ffb300',
  topazDeep: '#e65100',
  emerald: '#00e676',
  emeraldDeep: '#00a152',
  emeraldGlow: '#b9f6ca',

  /* Arena screen palette (its own Stitch theme) */
  arenaSurface: '#000f3b',
  arenaLowest: '#000b30',
  arenaLow: '#00164e',
  arenaContainer: '#001a56',
  arenaHigh: '#00236d',
  arenaHighest: '#0d2e7d',
  arenaBright: '#143381',
  arenaOnSurface: '#dce1ff',
  arenaOnSurfaceVariant: '#c2c6d7',
  arenaPrimary: '#b1c5ff',
  arenaPrimaryContainer: '#1264e8',
  arenaOnPrimaryContainer: '#eceeff',
  arenaSecondary: '#ffe9b9',
  arenaSecondaryContainer: '#ffc703',
  arenaOnSecondary: '#3e2e00',
  arenaOnSecondaryContainer: '#6e5400',
  arenaSecondaryFixed: '#ffdf94',
  arenaTertiary: '#3ce36a',
  arenaTertiaryContainer: '#007e31',
  arenaOnTertiaryContainer: '#c0ffc1',
  arenaError: '#ffb4ab',
  arenaOnError: '#690005',
} as const

/** Font families registered in the root layout. */
export const F = {
  head: 'Outfit_800ExtraBold',
  headBold: 'Outfit_700Bold',
  headSemi: 'Outfit_600SemiBold',
  body: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  arena: 'Rubik_800ExtraBold',
  arenaBlack: 'Rubik_900Black',
  arenaBody: 'Rubik_600SemiBold',
} as const

/** Type scale. Pair `size`/`line` with the matching family from F. */
export const T = {
  headlineXl: { fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  headlineLg: { fontSize: 32, lineHeight: 40, letterSpacing: -0.32 },
  headlineLgMobile: { fontSize: 26, lineHeight: 32, letterSpacing: -0.26 },
  headlineMd: { fontSize: 22, lineHeight: 28 },
  headlineSm: { fontSize: 18, lineHeight: 24 },
  bodyLg: { fontSize: 16, lineHeight: 22 },
  bodyMd: { fontSize: 14, lineHeight: 20 },
  bodySm: { fontSize: 12, lineHeight: 16 },
  labelLg: { fontSize: 14, lineHeight: 18, letterSpacing: 0.56 },
  labelMd: { fontSize: 12, lineHeight: 16, letterSpacing: 0.36 },
  labelSm: { fontSize: 10, lineHeight: 14, letterSpacing: 0.5 },
} as const

/** Arena screen type scale (Rubik, tighter). */
export const TA = {
  headlineXl: { fontSize: 26, lineHeight: 30, letterSpacing: 0.78 },
  headlineLg: { fontSize: 20, lineHeight: 24, letterSpacing: 0.4 },
  headlineMd: { fontSize: 16, lineHeight: 20, letterSpacing: 0.16 },
  bodyLg: { fontSize: 15, lineHeight: 19 },
  bodyMd: { fontSize: 13, lineHeight: 17 },
  bodySm: { fontSize: 11, lineHeight: 14 },
  labelLg: { fontSize: 12, lineHeight: 15, letterSpacing: 0.48 },
  labelMd: { fontSize: 10, lineHeight: 13, letterSpacing: 0.3 },
  labelSm: { fontSize: 9, lineHeight: 11, letterSpacing: 0.18 },
} as const

/** Spacing rhythm. */
export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  gutter: 12,
  margin: 16,
} as const

/** Radii. `DEFAULT` is 16, lg 32, xl 48, full is a large number. */
export const R = {
  sm: 2,
  md: 6,
  DEFAULT: 16,
  lg: 32,
  xl: 48,
  card: 16,
  card3xl: 24,
  full: 9999,
} as const

/**
 * Arcade lobby palette — the chunky gold-on-blue board-game look used by the
 * Home lobby. Deliberately separate from the Midnight Diorama tokens above.
 */
export const A = {
  /* Backdrop */
  bgDeep: '#0d2b63',
  bgMid: '#1649a0',
  bgLite: '#2566c4',
  pattern: 'rgba(255,255,255,0.045)',

  /* Chrome */
  barTop: '#071d4a',
  barBottom: '#0b2558',
  barEdge: '#2a63bd',

  /* Panels */
  panelTop: '#3d84e6',
  panelBot: '#1a4fae',
  panelDeep: '#12377f',
  panelInner: '#12a0ea',

  /* Gold */
  goldLite: '#ffe587',
  gold: '#ffc62e',
  goldMid: '#f5a310',
  goldDeep: '#c67100',
  goldShadow: '#8a4b00',

  /* Accents */
  green: '#35c759',
  greenDeep: '#1f8c3b',
  red: '#e63946',
  redDeep: '#a3121f',
  cyan: '#3fd0ff',
  purple: '#8b5cf6',

  /* Text */
  text: '#ffffff',
  textOutline: '#0f3471',
  textGold: '#ffd84d',
  textDim: '#bcd4f5',
} as const
