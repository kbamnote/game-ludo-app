import { router } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from './Icon'
import { C, F, R, S, T } from '../theme'
import { formatCompact, useProfile } from '../game/profile'

const LOGO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD0D_M6txDcKVHeAwTjSGrEqGuqnhO18hAxP0K5ha2y38ILfLJWl1mjMrhhnIVqyNkcyaVYg6qsUnTXy9jNJ71y_WiXPxubPOx23hnzKALyuQgFPXeuuzlF-SscoLeenklHNmZq77rVextg1CFhJScD86aP8h_-ReOwBUuCow1XcsD08y_FqENnadb1pxX45Rd9ENELc_wsoP0pue_mnKjtwd6AzXLiQuCFTDVZx_0'

export const HEADER_HEIGHT = 80

export default function AppHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const level = useProfile((s) => s.level)
  const coins = useProfile((s) => s.coins)
  const gems = useProfile((s) => s.gems)

  // The designed HUD needs ~485px of width. Below that the least critical
  // chips step aside rather than overflowing the bar.
  const showLevel = width >= 440
  const showSettings = width >= 408

  return (
    <View style={[styles.bar, { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <Image source={{ uri: LOGO }} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.kicker}>LUDO AFTER DARK</Text>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <View style={styles.hud}>
          {showLevel && (
            <View style={[styles.pill, { backgroundColor: C.surfaceHigh }]}>
              <View style={styles.levelDot}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
              <Text style={styles.lvlLabel}>LVL</Text>
            </View>
          )}

          <Pressable style={styles.pill} onPress={() => router.push('/inventory')}>
            <Icon name="monetization-on" size={16} color={C.tertiary} />
            <Text style={styles.pillValue}>{formatCompact(coins)}</Text>
            <View style={styles.plus}>
              <Icon name="add" size={12} color={C.onTertiary} />
            </View>
          </Pressable>

          <View style={styles.pill}>
            <Icon name="diamond" size={16} color={C.secondary} />
            <Text style={styles.pillValue}>{gems}</Text>
          </View>

          {showSettings && (
            <Pressable style={styles.iconButton}>
              <Icon name="settings" size={20} color={C.onSurfaceVariant} />
            </Pressable>
          )}

          <View style={styles.avatar}>
            <Icon name="person" size={18} color={C.onPrimary} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(23,27,38,0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    height: HEADER_HEIGHT,
    paddingHorizontal: S.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: S.sm, flexShrink: 0 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  kicker: {
    fontFamily: F.head,
    ...T.labelSm,
    color: C.primary,
    textTransform: 'uppercase',
  },
  title: { fontFamily: F.headBold, ...T.headlineSm, color: C.onSurface },
  hud: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flexShrink: 1, justifyContent: 'flex-end' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surfaceContainer,
    paddingHorizontal: S.sm,
    paddingVertical: 4,
    borderRadius: R.full,
  },
  pillValue: { fontFamily: F.head, ...T.labelMd, color: C.onSurface },
  levelDot: {
    width: 20,
    height: 20,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: { fontFamily: F.head, ...T.labelSm, color: C.onPrimaryContainer },
  lvlLabel: { fontFamily: F.head, ...T.labelSm, color: C.onSurfaceVariant, paddingRight: 4 },
  plus: {
    width: 16,
    height: 16,
    borderRadius: R.full,
    backgroundColor: C.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: R.full,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: R.full,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
