import { router, usePathname } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from './Icon'
import { C, F, R, S, T } from '../theme'

interface NavItem {
  to: string
  icon: string
  label: string
  /** The centre dice button, lifted out of the bar. */
  hero?: boolean
}

const ITEMS: NavItem[] = [
  { to: '/home', icon: 'home', label: 'Home' },
  { to: '/modes', icon: 'grid-view', label: 'Modes' },
  { to: '/match', icon: 'casino', label: 'Roll', hero: true },
  { to: '/tournament', icon: 'military-tech', label: 'Ranks' },
  { to: '/inventory', icon: 'shopping-bag', label: 'Shop' },
]

export const NAV_HEIGHT = 80

export default function BottomNav() {
  const insets = useSafeAreaInsets()
  const pathname = usePathname()

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: NAV_HEIGHT + insets.bottom }]}>
      <View style={styles.row}>
        {ITEMS.map((item) => {
          const active = pathname === item.to

          if (item.hero) {
            return (
              <Pressable key={item.to} style={styles.item} onPress={() => router.push(item.to as never)}>
                <View style={styles.hero}>
                  <Icon name={item.icon} size={24} color={C.onPrimaryContainer} />
                </View>
                <Text style={[styles.label, { color: C.primary, fontFamily: F.head }]}>{item.label}</Text>
              </Pressable>
            )
          }

          return (
            <Pressable
              key={item.to}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => router.push(item.to as never)}
            >
              <Icon name={item.icon} size={24} color={active ? C.primary : C.onSurfaceVariant} />
              <Text style={[styles.label, { color: active ? C.primary : C.onSurfaceVariant }]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(23,27,38,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    height: NAV_HEIGHT,
    paddingHorizontal: S.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    minWidth: 56,
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: R.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemActive: { backgroundColor: 'rgba(49,53,64,0.6)' },
  label: { fontFamily: F.headSemi, ...T.labelSm },
  hero: {
    width: 44,
    height: 44,
    marginTop: -20,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    borderWidth: 2,
    borderColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
