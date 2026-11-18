import { type ReactNode } from 'react'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CurrencyPill,
  DISPLAY,
  GoldBar,
  GoldPanel,
  LABEL,
  NUMERIC,
  OutlineText,
  RailBadge,
} from '../ui/arcade'
import {
  Coin,
  Die,
  Gem,
  GlobeEmblem,
  HeartsEmblem,
  PassPlayEmblem,
  Pawn,
  SpinEmblem,
  SwordsEmblem,
  TrophyEmblem,
  VsEmblem,
} from '../ui/ArcadeIcons'
import Icon from '../ui/Icon'
import Backdrop from '../ui/Backdrop'
import BrandLockup from '../ui/BrandLockup'
import { A } from '../theme'
import { BADGES, formatCompact, useProfile } from '../game/profile'
import { practice } from '../game/localTable'

function TopBar() {
  const insets = useSafeAreaInsets()
  const coins = useProfile((s) => s.coins)
  const gems = useProfile((s) => s.gems)
  const level = useProfile((s) => s.level)
  const badgeId = useProfile((s) => s.badge)
  const badge = BADGES.find((item) => item.id === badgeId) ?? BADGES[0]

  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
      <View style={styles.topRow}>
        {/* Avatar with level chip */}
        <Pressable accessibilityLabel="Player profile" style={styles.avatarWrap} onPress={() => router.push('/profile')}>
          <LinearGradient colors={[A.goldLite, A.goldMid]} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Pawn size={22} color={badge.color} dark={badge.dark} />
            </View>
          </LinearGradient>
          <View style={styles.onlineDot} />
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>{level}</Text>
          </View>
        </Pressable>

        <IconButton label="Player settings" icon={<Icon name="settings" size={18} color="#dbe9ff" />} onPress={() => router.push('/profile')} />
        <IconButton label="Reward inbox" icon={<Icon name="mail" size={17} color="#dbe9ff" />} onPress={() => router.push('/inbox')} />

        <View style={{ flex: 1 }} />

        <CurrencyPill icon={<Gem size={22} />} value={String(gems)} minWidth={30} onAdd={() => router.push('/inventory')} />
        <CurrencyPill icon={<Coin size={22} />} value={formatCompact(coins)} minWidth={46} onAdd={() => router.push('/inventory')} />

        <Pressable style={styles.cart} onPress={() => router.push('/inventory')}>
          <Icon name="shopping-cart" size={20} color={A.gold} />
        </Pressable>
      </View>
    </View>
  )
}

function IconButton({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.iconButton} onPress={onPress}>
      {icon}
    </Pressable>
  )
}

/** One of the five big mode tiles. */
function ModeTile({
  emblem,
  label,
  players,
  onPress,
  width,
  height,
}: {
  emblem: ReactNode
  label: string
  players?: string
  onPress: () => void
  width: number
  height: number
}) {
  return (
    <View style={{ width, alignItems: 'center' }}>
      <GoldPanel
        onPress={onPress}
        radius={13}
        style={{ width }}
        contentStyle={{ height, alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>{emblem}</View>
        <View style={{ width: '100%', paddingHorizontal: 4, paddingBottom: 4 }}>
          <GoldBar label={label} size={width > 110 ? 15 : 13} paddingVertical={3} radius={8} />
        </View>
      </GoldPanel>
      {players ? (
        <View style={styles.playersRow}>
          <View style={styles.playersDot} />
          <Text style={styles.playersText}>Players: {players}</Text>
        </View>
      ) : null}
    </View>
  )
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const luckyRolls = useProfile((s) => s.luckyRolls)

  // Everything below the hero has a fixed height so the hero can absorb the
  // slack. That is what keeps this screen from ever needing to scroll.
  const compact = height < 700
  const gutter = 10
  const colGap = 8
  const triple = (width - gutter * 2 - colGap * 2) / 3
  const duo = Math.min((width - gutter * 2 - colGap) / 2, 180)

  const tileH = compact ? 62 : 74
  const navH = compact ? 56 : 62
  const featureH = compact ? 50 : 58

  // The brand lockup grows into whatever vertical room the device leaves, so a
  // tall screen does not read as a small logo adrift in empty blue.
  const lockup = Math.min(1.3, Math.max(0.82, height / 760))

  return (
    <View style={styles.root}>
      <Backdrop />
      <TopBar />

      {/* Hero zone — flexes to fill whatever is left */}
      <View style={styles.hero}>
        {/* Left promo rail */}
        <View style={[styles.rail, { left: 6, top: 4 }]}>
          <RailBadge size={compact ? 40 : 46} caption="PACK" onPress={() => router.push('/inventory')}>
            <Icon name="card-giftcard" size={20} color={A.goldLite} />
          </RailBadge>
          <RailBadge size={compact ? 40 : 46} caption="CLUB" onPress={() => router.push('/friends')}>
            <OutlineText size={18} width={1.8} color={A.gold} outline={A.goldShadow}>
              K
            </OutlineText>
          </RailBadge>
          <RailBadge size={compact ? 40 : 46} caption="LIVE" captionColor="#ff6b6b" onPress={() => router.push('/voice')}>
            <Icon name="play-arrow" size={22} color="#ff6b6b" />
          </RailBadge>
        </View>

        {/* Right promo rail */}
        <View style={[styles.rail, { right: 6, top: 4 }]}>
          <RailBadge size={compact ? 40 : 46} caption="FREE" onPress={() => router.push('/events')}>
            <Icon name="savings" size={20} color={A.goldLite} />
          </RailBadge>
          <RailBadge size={compact ? 40 : 46} caption="GOALS" onPress={() => router.push('/events')}>
            <Icon name="gps-fixed" size={20} color="#ff8a5c" />
          </RailBadge>
          <RailBadge size={compact ? 40 : 46} caption="HELP" onPress={() => router.push('/help')}>
            <OutlineText size={18} width={1.8} color={A.gold} outline={A.goldShadow}>
              ?
            </OutlineText>
          </RailBadge>
        </View>

        <View style={styles.brand} pointerEvents="none">
          <BrandLockup scale={lockup * 0.82} />
        </View>
      </View>

      {/* Primary modes */}
      <View style={{ paddingHorizontal: gutter }}>
        <View style={{ flexDirection: 'row', gap: colGap, justifyContent: 'center' }}>
          <ModeTile
            width={triple}
            height={tileH}
            emblem={<GlobeEmblem size={compact ? 30 : 36} />}
            label="ONLINE"
            players="2–4"
            onPress={() => router.push('/online')}
          />
          <ModeTile
            width={triple}
            height={tileH}
            emblem={<SwordsEmblem size={compact ? 30 : 36} />}
            label="MODES"
            onPress={() => router.push('/modes')}
          />
          <ModeTile
            width={triple}
            height={tileH}
            emblem={<HeartsEmblem size={compact ? 30 : 36} />}
            label="FRIENDS"
            players="2–4"
            onPress={() => router.push('/friends')}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: colGap, justifyContent: 'center', marginTop: 6 }}>
          <ModeTile
            width={duo}
            height={tileH}
            emblem={<VsEmblem size={compact ? 30 : 36} />}
            label="COMPUTER"
            onPress={practice}
          />
          <ModeTile
            width={duo}
            height={tileH}
            emblem={<PassPlayEmblem size={compact ? 30 : 36} />}
            label="PASS N PLAY"
            onPress={() => router.push('/pass-play')}
          />
        </View>
      </View>

      {/* Minigames + tournament */}
      <View style={[styles.featureRow, { height: featureH }]}>
        <GoldPanel
          onPress={() => router.push('/lucky7')}
          radius={12}
          style={{ width: featureH + 10 }}
          contentStyle={{ height: featureH, alignItems: 'center', justifyContent: 'center' }}
        >
          <Die size={featureH * 0.5} pips={6} />
        </GoldPanel>

        <View style={{ flex: 1, marginHorizontal: 10 }}><GoldPanel
          onPress={() => router.push('/tournament')}
          radius={12}
          contentStyle={{ height: featureH, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        >
          <TrophyEmblem size={featureH * 0.56} />
          <OutlineText size={compact ? 17 : 20} width={2.6} color={A.gold} outline={A.textOutline}>
            TOURNAMENT
          </OutlineText>
        </GoldPanel></View>

        <GoldPanel
          onPress={() => router.push('/spin')}
          radius={12}
          style={{ width: featureH + 10 }}
          contentStyle={{ height: featureH, alignItems: 'center', justifyContent: 'center' }}
        >
          <SpinEmblem size={featureH * 0.6} />
        </GoldPanel>
      </View>

      {/* Season claim, with the free-coins promo tucked into the same band so
          the two can never overlap on a short screen */}
      <View style={styles.claimBand}>
        <Pressable style={styles.freeAd} onPress={() => router.push('/lucky7')}>
          <OutlineText size={9} width={1.4} color={A.text} outline={A.redDeep}>
            ROLLS
          </OutlineText>
          <Die size={18} />
          <Text style={styles.freeAdText}>×{luckyRolls}</Text>
        </Pressable>

        <Pressable style={styles.claimWrap} onPress={() => router.push('/events')}>
          <View style={styles.seasonShield}>
            <Text style={styles.seasonLabel}>SEASON</Text>
            <Text style={styles.seasonNum}>28</Text>
          </View>
          <LinearGradient colors={[A.goldLite, A.gold, A.goldMid]} style={styles.claimBar}>
            <OutlineText size={compact ? 17 : 20} width={2.4} color={A.text} outline={A.goldShadow}>
              CLAIM
            </OutlineText>
          </LinearGradient>
        </Pressable>

        <View style={{ width: 54 }} />
      </View>

      {/* Bottom navigation */}
      <View style={[styles.nav, { height: navH + insets.bottom, paddingBottom: insets.bottom }]}>
        {[
          { label: 'HOME', glyph: 'home', to: '/home', active: true },
          { label: 'EVENT', glyph: 'event', to: '/events', badge: true },
          { label: 'ADDA', glyph: 'mic', to: '/voice', tag: 'NEW' },
          { label: 'INVENTORY', glyph: 'casino', to: '/inventory' },
          { label: 'SOCIAL', glyph: 'forum', to: '/friends' },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={[styles.navItem, item.active && styles.navItemActive]}
            onPress={() => !item.active && router.push(item.to as never)}
          >
            {item.tag && (
              <View style={styles.navTag}>
                <Text style={styles.navTagText}>{item.tag}</Text>
              </View>
            )}
            {item.badge && <View style={styles.navDot} />}
            <Icon name={item.glyph} size={compact ? 20 : 23} color={item.active ? A.gold : '#cfe0ff'} />
            <OutlineText size={compact ? 9 : 10} width={1.5} color={item.active ? A.gold : A.text} outline={A.textOutline}>
              {item.label}
            </OutlineText>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bgMid },

  topBar: { backgroundColor: 'rgba(5,20,56,0.92)', borderBottomWidth: 2, borderBottomColor: A.barEdge, paddingBottom: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 },
  avatarWrap: { width: 40, height: 40 },
  avatarRing: { width: 40, height: 40, borderRadius: 10, padding: 2.5 },
  avatarInner: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#17407f',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: A.green,
    borderWidth: 1.5,
    borderColor: '#07204d',
  },
  levelChip: {
    position: 'absolute',
    bottom: -6,
    left: 4,
    minWidth: 20,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: A.gold,
    borderWidth: 1.2,
    borderColor: A.goldDeep,
    alignItems: 'center',
  },
  levelChipText: { fontFamily: NUMERIC, fontSize: 10, color: '#4a2a00', includeFontPadding: false },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(23,64,127,0.9)',
    borderWidth: 1.5,
    borderColor: A.barEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 15, color: '#dbe9ff' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: A.red,
    borderWidth: 1.2,
    borderColor: '#07204d',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: NUMERIC, fontSize: 9, color: '#fff', includeFontPadding: false },
  cart: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: { flex: 1, position: 'relative', minHeight: 120 },
  rail: { position: 'absolute', gap: 8, zIndex: 3 },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  crown: { marginBottom: -10, zIndex: 2 },
  boardRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  heroDie: { position: 'absolute', right: -14, bottom: -10, zIndex: 4 },

  playersRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 7 },
  playersDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: A.green },
  playersText: { fontFamily: LABEL, fontSize: 10, color: '#9ef2b4', includeFontPadding: false },

  featureRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 10 },

  claimBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  claimWrap: { flexDirection: 'row', alignItems: 'center' },
  seasonShield: {
    backgroundColor: A.purple,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    marginRight: -10,
    zIndex: 2,
  },
  seasonLabel: { fontFamily: LABEL, fontSize: 7, color: '#fff', includeFontPadding: false },
  seasonNum: { fontFamily: DISPLAY, fontSize: 14, color: '#fff', includeFontPadding: false, marginTop: -2 },
  claimBar: {
    paddingHorizontal: 34,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: A.goldDeep,
  },

  freeAd: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,20,56,0.75)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: A.gold,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: 54,
  },
  freeAdText: { fontFamily: NUMERIC, fontSize: 10, color: A.gold, includeFontPadding: false },

  nav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5,20,56,0.97)',
    borderTopWidth: 2.5,
    borderTopColor: A.barEdge,
    alignItems: 'center',
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 1, paddingTop: 4 },
  navItemActive: { backgroundColor: 'rgba(61,132,230,0.35)' },
  navTag: {
    position: 'absolute',
    top: -2,
    right: '50%',
    marginRight: 6,
    backgroundColor: A.red,
    borderRadius: 4,
    paddingHorizontal: 3,
    zIndex: 2,
  },
  navTagText: { fontFamily: NUMERIC, fontSize: 7, color: '#fff', includeFontPadding: false },
  navDot: {
    position: 'absolute',
    top: 2,
    right: '32%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: A.red,
    zIndex: 2,
  },
})
