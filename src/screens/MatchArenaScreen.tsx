import { useEffect, useMemo, useRef, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import MatchScene from '../three/MatchScene'
import Icon from '../ui/Icon'
import Glow from '../ui/Glow'
import { C, F, R, S, TA } from '../theme'
import { useMatch, type PlayerConfig } from '../game/store'
import { useOnline } from '../net/online'
import { SEAT_HEX, seatScore, tokensHome, type Seat } from '../game/rules'

const TURN_SECONDS = 15

const AVATARS: Record<Seat, string> = {
  0: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3NCICq93MugUGdRqVsBA9-uDth032_lpFBlGjst6H_eeILRShaGTZivExZV5sLWg4G2FMvEJ6ytjNbG-LJvpXD66BbFKcUycYX987zrAFGd1kao7fiwyIf7fjMq8YaCrxKNamPkf0BlXD76k32zoqVC4Wal-auhPS3BGijcBJ-cevMvy9lZAn14fMMlLc9xuzvcbPbiWKWZNagazGm5qv0trgb1IswuYlnoUFFjE',
  1: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLZPWA7nq7qDvmVzKssGeSrrw2FGW0Iglc4uhCFLPKiBBjVOg2LgFkrRtehtr0wR6RTalZU0yhCspfVfWKTEzP2dLF-SAT49_f-oI5pslHf8DjZwzsH20dUWsdRmI-i8g-iS7O_sz_CIgcXD9H1AWSLOfvERwjPulTKCFuOxjO1dA__w3x6tO8gnzQ1PIESrPjCftjeBpWgu0Q4-5rBQ2koka7Hu_t9YyeywMaiYY',
  2: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCXc_9FTfu6HoiYaI9S1BSsykQtPK-iG_hdfv6ZgsUOpbBJ3lIPD8taDQ4Qvs_baEGiHPI20oZcyBuRD4lQ_YxZTbYPSMZ5yjJ2t0C3W8YMoeJioExjU43IgmIjpr-VU4MQDNqUDoXA3azjAc_Dwmhxt-1-ybbVgFyvfgoGfy_H1BjJqkZGUdWGtPb8CGBEoWwgsHdLT_Bh763n9-daCrYlwoNWtuZ3eXhYlQP_oeQ',
  3: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyMpdRdNwdEaKI4JIA5U5qzyoW-SfNifXYbyfraMoXhcLYxj-_0gSbSUaSx5PqekNa-wOzndV1TGbVu907tvsX47lJsgCIyTzTafMLv7NzPLmIr720n7WE3Agv-Uv2ljJhVrRvSzdWwF76UhrSNg-nKSd4hHHKb4SIGXo3crp_H3s8-SsCBAOt310bWAkbXSFR8TUgkC8rHQz96cso5PRrZa-68HMi29F_Xt4E8gU',
}

const SEAT_BADGE: Record<Seat, { bg: string; fg: string }> = {
  0: { bg: C.arenaError, fg: C.arenaOnError },
  1: { bg: C.arenaTertiaryContainer, fg: C.arenaOnTertiaryContainer },
  2: { bg: C.arenaSecondaryContainer, fg: C.arenaOnSecondaryContainer },
  3: { bg: C.arenaPrimaryContainer, fg: C.arenaOnPrimaryContainer },
}

const DEFAULT_PLAYERS: PlayerConfig[] = [
  { seat: 0, name: 'Alex', kind: 'human' },
  { seat: 1, name: 'Vikram', kind: 'bot', difficulty: 'sharp' },
  { seat: 2, name: 'Raj', kind: 'bot', difficulty: 'sharp' },
  { seat: 3, name: 'Elena', kind: 'bot', difficulty: 'casual' },
]

function PlayerChip({
  seat,
  align,
  active,
  secondsLeft,
}: {
  seat: Seat
  align: 'left' | 'right'
  active: boolean
  secondsLeft: number
}) {
  const players = useMatch((s) => s.players)
  const tokens = useMatch((s) => s.tokens)
  const player = players.find((p) => p.seat === seat)
  if (!player) return null

  const home = tokensHome(tokens, seat)
  const out = tokens.filter((t) => t.seat === seat && t.progress >= 0).length
  const status = active
    ? `TURN: ${secondsLeft}S`
    : home > 0
      ? `TOKENS: ${home} HOME`
      : out > 0
        ? `TOKENS: ${out} OUT`
        : 'WAITING...'

  const ring = 2 * Math.PI * 21
  const badge = SEAT_BADGE[seat]

  const avatar = (
    <View>
      {active ? (
        <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={56} height={56} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={28} cy={28} r={21} stroke={C.arenaContainer} strokeWidth={4} fill="transparent" />
            <Circle
              cx={28}
              cy={28}
              r={21}
              stroke={SEAT_HEX[seat]}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${ring}`}
              strokeDashoffset={ring - (secondsLeft / TURN_SECONDS) * ring}
              fill="transparent"
            />
          </Svg>
          <Image source={{ uri: AVATARS[seat] }} style={styles.avatarActive} />
        </View>
      ) : (
        <Image source={{ uri: AVATARS[seat] }} style={styles.avatar} />
      )}
      <View style={[styles.seatBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.seatBadgeText, { color: badge.fg }]}>P{seat + 1}</Text>
      </View>
    </View>
  )

  const label = (
    <View style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <View style={styles.nameRow}>
        {align === 'right' && <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[seat] }]} />}
        <Text style={styles.playerName}>{player.name}</Text>
        {align === 'left' && <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[seat] }]} />}
      </View>
      <Text style={[styles.playerStatus, { color: active ? C.arenaError : C.arenaOnSurfaceVariant }]}>{status}</Text>
    </View>
  )

  return (
    <View style={styles.playerChip}>
      {align === 'left' ? (
        <>
          {avatar}
          {label}
        </>
      ) : (
        <>
          {label}
          {avatar}
        </>
      )}
    </View>
  )
}

export default function MatchArenaScreen() {
  const params = useLocalSearchParams<{ table?: string }>()
  const start = useMatch((s) => s.start)
  const players = useMatch((s) => s.players)
  const phase = useMatch((s) => s.phase)
  const current = useMatch((s) => s.current)
  const die = useMatch((s) => s.die)
  const moves = useMatch((s) => s.moves)
  const tokens = useMatch((s) => s.tokens)
  const ranking = useMatch((s) => s.ranking)
  const pickToken = useMatch((s) => s.pickToken)
  const roll = useMatch((s) => s.roll)
  const mode = useMatch((s) => s.mode)
  const mySeat = useMatch((s) => s.mySeat)
  const leaveRoom = useOnline((s) => s.leaveRoom)

  const [muted, setMuted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS)
  const [taunt, setTaunt] = useState<string | null>(null)
  const tauntTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const table = useMemo<PlayerConfig[]>(() => {
    if (!params.table) return DEFAULT_PLAYERS
    try {
      return JSON.parse(params.table) as PlayerConfig[]
    } catch {
      return DEFAULT_PLAYERS
    }
  }, [params.table])

  useEffect(() => {
    // Online matches are seeded by the server via attachServer; only a local
    // game needs a table built on the device.
    if (mode === 'online') return
    if (players.length === 0) start(table)
  }, [players.length, start, table, mode])

  const humanSeat = useMemo(
    () => (mode === 'online' ? mySeat : (players.find((p) => p.kind === 'human')?.seat ?? null)),
    [players, mode, mySeat],
  )
  const isHumanTurn = humanSeat !== null && current === humanSeat

  // Turn clock. The countdown lives in a ref so the timeout action never runs
  // inside a state updater, which React would execute during render.
  const secondsRef = useRef(TURN_SECONDS)

  useEffect(() => {
    secondsRef.current = TURN_SECONDS
    setSecondsLeft(TURN_SECONDS)
    if (phase === 'ended') return

    const id = setInterval(() => {
      secondsRef.current -= 1
      if (secondsRef.current <= 0) {
        secondsRef.current = TURN_SECONDS
        // Online, the server owns the turn clock and plays for a stalled seat;
        // acting here too would double-submit.
        if (isHumanTurn && mode === 'local') {
          if (phase === 'await-roll') roll()
          else if (phase === 'await-move' && moves.length) pickToken(moves[0].tokenId)
        }
      }
      setSecondsLeft(secondsRef.current)
    }, 1000)

    return () => clearInterval(id)
  }, [current, phase, isHumanTurn, moves, pickToken, roll, mode])

  useEffect(
    () => () => {
      if (tauntTimer.current) clearTimeout(tauntTimer.current)
    },
    [],
  )

  const showTaunt = (emoji: string) => {
    setTaunt(emoji)
    if (tauntTimer.current) clearTimeout(tauntTimer.current)
    tauntTimer.current = setTimeout(() => setTaunt(null), 1500)
  }

  const callout =
    phase === 'ended'
      ? 'MATCH COMPLETE'
      : !isHumanTurn
        ? `${(players.find((p) => p.seat === current)?.name ?? 'OPPONENT').toUpperCase()} IS THINKING...`
        : phase === 'await-roll'
          ? 'YOUR TURN! TAP THE DICE'
          : phase === 'rolling'
            ? 'ROLLING...'
            : phase === 'await-move'
              ? moves.length
                ? `YOU ROLLED ${die} — TAP A PAWN`
                : `YOU ROLLED ${die} — NO LEGAL MOVE`
              : 'MOVING...'

  const hint =
    phase === 'await-move' && isHumanTurn && moves.length
      ? `${moves.length} pawn${moves.length > 1 ? 's' : ''} can move ${die} space${die === 1 ? '' : 's'}`
      : phase === 'await-roll' && isHumanTurn
        ? 'Tap the dice to roll'
        : 'Waiting for the table'

  const canAutoMove = phase === 'await-move' && isHumanTurn && moves.length > 0

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Glow size={320} color={C.arenaPrimaryContainer} opacity={0.22} style={{ top: -48, alignSelf: 'center' }} />

          {/* Top match bar */}
          <View style={styles.topBar}>
            <View style={styles.topGroup}>
              <Pressable
                style={styles.squareButton}
                onPress={() => {
                  if (mode === 'online') leaveRoom()
                  router.replace('/home')
                }}
              >
                <Icon name="pause" size={20} color={C.arenaOnSurface} />
              </Pressable>
              <Pressable style={styles.squareButton} onPress={() => setMuted((m) => !m)}>
                <Icon name={muted ? 'mic-off' : 'mic'} size={20} color={C.arenaTertiary} />
                {!muted && <View style={styles.micDot} />}
              </Pressable>
            </View>

            <View style={styles.pot}>
              <View style={styles.potIcon}>
                <Icon name="monetization-on" size={16} color={C.arenaOnSecondary} />
              </View>
              <View>
                <Text style={styles.potLabel}>POT PRIZE</Text>
                <Text style={styles.potValue}>2,000</Text>
              </View>
            </View>

            <View style={styles.topGroup}>
              <Pressable style={styles.squareButton} onPress={() => showTaunt('💬')}>
                <Icon name="chat-bubble" size={20} color={C.arenaOnSurface} />
              </Pressable>
              <Pressable style={styles.squareButton}>
                <Icon name="volume-up" size={20} color={C.arenaOnSurfaceVariant} />
              </Pressable>
            </View>
          </View>

          {/* Top two seats */}
          <View style={styles.seatRow}>
            <PlayerChip seat={0} align="left" active={current === 0 && phase !== 'ended'} secondsLeft={secondsLeft} />
            <PlayerChip seat={1} align="right" active={current === 1 && phase !== 'ended'} secondsLeft={secondsLeft} />
          </View>

          {/* Centre 3D arena stage */}
          <View style={styles.stageWrap}>
            <View style={styles.stage}>
              <MatchScene />

              <View style={styles.callout} pointerEvents="none">
                <Icon name="star" size={16} color={isHumanTurn && phase !== 'ended' ? C.arenaOnSecondaryContainer : C.arenaOnSurface} />
                <Text
                  style={[
                    styles.calloutText,
                    { color: isHumanTurn && phase !== 'ended' ? C.arenaOnSecondaryContainer : C.arenaOnSurface },
                  ]}
                >
                  {callout}
                </Text>
              </View>

              <View style={styles.dicePrompt} pointerEvents="none">
                <Text style={styles.dicePromptText}>
                  {phase === 'await-roll' && isHumanTurn ? 'TAP DICE!' : die ? `ROLLED ${die}` : 'DICE'}
                </Text>
              </View>

              {taunt && (
                <View style={styles.tauntWrap} pointerEvents="none">
                  <Text style={styles.tauntEmoji}>{taunt}</Text>
                </View>
              )}

              {phase === 'ended' && (
                <View style={styles.endOverlay}>
                  <Icon name="emoji-events" size={48} color={C.arenaSecondaryContainer} />
                  <Text style={styles.endTitle}>
                    {(players.find((p) => p.seat === ranking[0])?.name ?? '').toUpperCase()} WINS
                  </Text>
                  <View style={{ width: 220, gap: 4 }}>
                    {ranking.map((seat, i) => (
                      <View key={seat} style={styles.rankRow}>
                        <View style={styles.rankLeft}>
                          <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[seat] }]} />
                          <Text style={styles.rankName}>{players.find((p) => p.seat === seat)?.name}</Text>
                        </View>
                        <Text style={styles.rankName}>#{i + 1}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    style={styles.rematch}
                    onPress={() => (mode === 'online' ? router.replace('/friends') : start(table))}
                  >
                    <Text style={styles.rematchText}>{mode === 'online' ? 'BACK TO ROOM' : 'REMATCH'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Bottom two seats */}
          <View style={styles.seatRow}>
            <PlayerChip seat={3} align="left" active={current === 3 && phase !== 'ended'} secondsLeft={secondsLeft} />
            <PlayerChip seat={2} align="right" active={current === 2 && phase !== 'ended'} secondsLeft={secondsLeft} />
          </View>

          {/* Taunts dock */}
          <View style={styles.dock}>
            <Text style={styles.dockLabel}>TAUNTS</Text>
            <View style={styles.dockEmojis}>
              {['😂', '👍', '😡', '🎲'].map((emoji) => (
                <Pressable key={emoji} style={styles.emojiButton} onPress={() => showTaunt(emoji)}>
                  <Text style={{ fontSize: 18 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.fastButton} onPress={() => showTaunt('⚡')}>
              <Icon name="send" size={14} color={C.arenaOnSecondaryContainer} />
              <Text style={styles.fastText}>FAST</Text>
            </Pressable>
          </View>

          {/* Move prompt */}
          <View style={styles.prompt}>
            <View style={styles.promptLeft}>
              <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[current], width: 12, height: 12 }]} />
              <Text style={styles.promptText} numberOfLines={1}>
                {hint}
              </Text>
            </View>
            <Pressable
              style={[styles.autoButton, !canAutoMove && { opacity: 0.4 }]}
              disabled={!canAutoMove}
              onPress={() => moves.length && pickToken(moves[0].tokenId)}
            >
              <Text style={styles.autoText}>AUTO MOVE</Text>
            </Pressable>
          </View>

          {/* Live standings */}
          <View style={styles.standings}>
            {players.map((p) => (
              <View key={p.seat} style={styles.standing}>
                <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[p.seat] }]} />
                <Text style={styles.standingName} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={styles.standingScore}>{seatScore(tokens, p.seat)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

/** RN 0.88 dropped `StyleSheet.absoluteFillObject` from its public types. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.arenaSurface },
  scroll: { paddingBottom: 24, gap: 8 },

  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  squareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.arenaHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: R.full, backgroundColor: C.arenaTertiary },
  pot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.full,
    backgroundColor: C.arenaLowest,
  },
  potIcon: {
    width: 24,
    height: 24,
    borderRadius: R.full,
    backgroundColor: C.arenaSecondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potLabel: { fontFamily: F.arena, ...TA.labelSm, color: C.arenaSecondaryFixed },
  potValue: { fontFamily: F.arena, ...TA.headlineMd, color: C.arenaSecondary },

  seatRow: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  playerChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 48, height: 48, borderRadius: R.full, backgroundColor: C.arenaHighest },
  avatarActive: { width: 44, height: 44, borderRadius: R.full, backgroundColor: C.arenaHighest },
  seatBadge: { position: 'absolute', bottom: -4, right: -4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: R.full },
  seatBadgeText: { fontFamily: F.arena, ...TA.labelSm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seatDot: { width: 8, height: 8, borderRadius: R.full },
  playerName: { fontFamily: F.arena, ...TA.headlineMd, color: C.arenaOnSurface },
  playerStatus: { fontFamily: F.arena, ...TA.labelSm },

  stageWrap: { paddingHorizontal: 12, marginVertical: 8 },
  stage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.arenaLow,
  },
  callout: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: R.full,
    backgroundColor: C.arenaSecondaryContainer,
  },
  calloutText: { fontFamily: F.arena, ...TA.labelLg },
  dicePrompt: { position: 'absolute', bottom: 12, alignSelf: 'center' },
  dicePromptText: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaSecondaryFixed },
  tauntWrap: { ...FILL, alignItems: 'center', justifyContent: 'center' },
  tauntEmoji: { fontSize: 72 },
  endOverlay: {
    ...FILL,
    backgroundColor: 'rgba(0,11,48,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  endTitle: { fontFamily: F.arenaBlack, ...TA.headlineXl, color: C.arenaOnSurface },
  rankRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankName: { fontFamily: F.arenaBody, ...TA.bodyMd, color: C.arenaOnSurfaceVariant },
  rematch: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.arenaPrimaryContainer,
  },
  rematchText: { fontFamily: F.arena, ...TA.labelLg, color: C.arenaOnPrimaryContainer },

  dock: {
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: C.arenaLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  dockLabel: { fontFamily: F.arena, ...TA.labelSm, color: C.arenaOnSurfaceVariant },
  dockEmojis: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.arenaHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.arenaSecondaryContainer,
  },
  fastText: { fontFamily: F.arena, ...TA.labelSm, color: C.arenaOnSecondaryContainer },

  prompt: {
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 16,
    backgroundColor: C.arenaHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  promptLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  promptText: { fontFamily: F.arenaBody, ...TA.bodySm, color: C.arenaOnSurface, flexShrink: 1 },
  autoButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.arenaTertiaryContainer },
  autoText: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaOnTertiaryContainer },

  standings: { marginHorizontal: 16, flexDirection: 'row', gap: 8 },
  standing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.arenaLow,
  },
  standingName: { fontFamily: F.arena, ...TA.labelSm, color: C.arenaOnSurfaceVariant, flexShrink: 1 },
  standingScore: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaOnSurface, marginLeft: 'auto' },
})
