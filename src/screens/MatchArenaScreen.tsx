import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import * as Speech from 'expo-speech'
import { Asset } from 'expo-asset'
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'
import MatchScene from '../three/MatchScene'
import SceneBoundary from '../three/SceneBoundary'
import MatchVoice from '../voice/MatchVoice'
import Icon from '../ui/Icon'
import Glow from '../ui/Glow'
import { C, F, R, TA } from '../theme'
import { useMatch, type LocalVariant, type PlayerConfig } from '../game/store'
import { useMatchAudio } from '../game/useMatchAudio'
import { onMatchReaction, onMatchSound, sendMatchReaction, sendMatchSound, useOnline } from '../net/online'
import { BOMB_SCORCH_END, REACTIONS, REACTION_DURATION, REACTION_LAUNCH_DELAY, reactionAnchor, type Reaction, type ReactionKind, type ReactionRequest } from '../game/reactions'
import ReactionPicker from '../ui/ReactionPicker'
import MatchSoundboard, { MatchSoundPlayback } from '../ui/MatchSoundboard'
import { AMBULANCE_SOUND, DANCE_SONG, soundAsset } from '../game/soundboard'
import { RESCUE_ARRIVAL_MS, RESCUE_MS, STEP_MS } from '../game/moveTiming'
import { useProfile } from '../game/profile'
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
  active,
  secondsLeft,
  onReaction,
}: {
  seat: Seat
  active: boolean
  secondsLeft: number
  onReaction?: () => void
}) {
  const players = useMatch((s) => s.players)
  const tokens = useMatch((s) => s.tokens)
  const playerIndex = players.findIndex(p => p.seat === seat)
  const player = players[playerIndex]
  if (!player) return null

  const home = tokensHome(tokens, seat)
  const out = tokens.filter((t) => t.seat === seat && t.progress >= 0).length
  const status = active
    ? secondsLeft < 0 ? 'YOUR TURN' : `TURN: ${secondsLeft}S`
    : home > 0
      ? `TOKENS: ${home} HOME`
      : out > 0
        ? `TOKENS: ${out} OUT`
        : 'WAITING...'

  const ring = 2 * Math.PI * 21
  const badge = SEAT_BADGE[seat]

  const avatar = (
    <View style={styles.avatarSlot}>
      {active ? (
        <>
          <Svg width={42} height={42} viewBox="0 0 56 56" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={28} cy={28} r={21} stroke={C.arenaContainer} strokeWidth={4} fill="transparent" />
            <Circle
              cx={28}
              cy={28}
              r={21}
              stroke={SEAT_HEX[seat]}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${ring}`}
              strokeDashoffset={secondsLeft < 0 ? 0 : ring - (secondsLeft / TURN_SECONDS) * ring}
              fill="transparent"
            />
          </Svg>
          <Image source={{ uri: AVATARS[seat] }} style={styles.avatarActive} />
        </>
      ) : (
        <Image source={{ uri: AVATARS[seat] }} style={styles.avatar} />
      )}
      <View style={[styles.seatBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.seatBadgeText, { color: badge.fg }]}>P{playerIndex + 1}</Text>
      </View>
    </View>
  )

  return (
    <Pressable style={styles.playerChip} onPress={onReaction} disabled={!onReaction}
      accessibilityRole={onReaction ? 'button' : undefined}
      accessibilityLabel={onReaction ? 'Send reaction to ' + player.name : undefined}>
      {avatar}
      <View style={styles.playerDetails}>
        <Text numberOfLines={1} style={styles.playerName}>{player.name}</Text>
        <Text style={[styles.playerStatus, { color: active ? SEAT_HEX[seat] : C.arenaOnSurfaceVariant }]}>{status}</Text>
      </View>
      <Text accessibilityLabel={`${seatScore(tokens, seat)} points`} style={styles.standingScore}>{seatScore(tokens, seat)}</Text>
      {onReaction && <Icon name="add-reaction" size={17} color={C.arenaSecondaryFixed} />}
    </Pressable>
  )
}

export default function MatchArenaScreen() {
  const { width } = useWindowDimensions()
  const compactHeader = width < 365
  const params = useLocalSearchParams<{ table?: string; cupRound?: string; variant?: LocalVariant }>()
  const start = useMatch((s) => s.start)
  const players = useMatch((s) => s.players)
  const phase = useMatch((s) => s.phase)
  const current = useMatch((s) => s.current)
  const die = useMatch((s) => s.die)
  const passedRoll = useMatch(s => s.passedRoll)
  const moves = useMatch((s) => s.moves)
  const ranking = useMatch((s) => s.ranking)
  const rescue = useMatch(s => s.animation?.captures.length ? s.animation : null)
  const capturing = rescue !== null
  const pickToken = useMatch((s) => s.pickToken)
  const roll = useMatch((s) => s.roll)
  const mode = useMatch((s) => s.mode)
  const mySeat = useMatch((s) => s.mySeat)
  const leaveRoom = useOnline((s) => s.leaveRoom)
  const friendsRoom = useOnline(s => s.room && !s.room.publicTable && s.room.phase === 'playing' ? s.room.code : null)

  const [voiceOpen, setVoiceOpen] = useState(false)
  useFocusEffect(useCallback(() => () => setVoiceOpen(false), []))
  const [soundMuted, setSoundMuted] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [addedSoundPlaying, setAddedSoundPlaying] = useState(false)
  const addedSoundRef = useRef(false)
  const onSoundPlayingChange = useCallback((playing: boolean) => {
    addedSoundRef.current = playing
    setAddedSoundPlaying(playing)
    if (playing) void Speech.stop().catch(() => {})
  }, [])
  useMatchAudio(soundMuted || addedSoundPlaying)
  useEffect(() => {
    void Asset.loadAsync([soundAsset(AMBULANCE_SOUND), soundAsset(DANCE_SONG)]).catch(() => {})
  }, [])
  const sharedTable = mode === 'local' && params.variant !== undefined
  const currentPlayer = players.find(player => player.seat === current)
  const turnName = currentPlayer?.name
  const matchEnded = phase === 'ended'
  const canChat = mode === 'online' && Boolean(friendsRoom) && !matchEnded
  useEffect(() => {
    if (!sharedTable || !voiceEnabled || !turnName || matchEnded || addedSoundRef.current) return
    Speech.speak(`${turnName}, your turn.`, { rate: .94 })
    return () => { void Speech.stop().catch(() => {}) }
  }, [sharedTable, voiceEnabled, turnName, current, matchEnded])
  const [secondsLeft, setSecondsLeft] = useState(TURN_SECONDS)
  const [recipient, setRecipient] = useState<Seat | null>(null)
  const [soundsOpen, setSoundsOpen] = useState(false)
  const [effectNotice, setEffectNotice] = useState('')
  const [sound, setSound] = useState<{ clip: number; receivedAt: number; matchId: number } | null>(null)
  const danceStartedAt = useRef(0)
  const startDance = useCallback(() => { danceStartedAt.current = Date.now() }, [])
  const [reaction, setReaction] = useState<Reaction | null>(null)
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const senderSeat = mode === 'online' ? mySeat : sharedTable ? current : players.find(player => player.kind === 'human')?.seat
  const target = players.find(player => player.seat === recipient)

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
    if (players.length === 0) start(table, params.variant)
  }, [players.length, start, table, mode, params.variant])

  const isHumanTurn = mode === 'online' ? current === mySeat : players.some((p) => p.seat === current && p.kind === 'human')
  const startedAt = useMatch((state) => state.startedAt)
  useEffect(() => {
    if (mode === 'local' && phase === 'ended' && params.cupRound !== undefined) {
      useProfile.getState().finishCupRound(Number(params.cupRound), startedAt, ranking[0] === 0)
    }
  }, [mode, phase, params.cupRound, ranking, startedAt])

  // Turn clock. The countdown lives in a ref so the timeout action never runs
  // inside a state updater, which React would execute during render.
  const secondsRef = useRef(TURN_SECONDS)

  useEffect(() => {
    secondsRef.current = TURN_SECONDS
    setSecondsLeft(TURN_SECONDS)
    if (phase === 'ended' || sharedTable) return

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
  }, [current, phase, isHumanTurn, moves, pickToken, roll, mode, sharedTable])

  const showReaction = useCallback((event: ReactionRequest) => {
    const match = useMatch.getState()
    if (match.phase === 'ended') return
    const tokens = match.animation?.before ?? match.tokens
    const sender = reactionAnchor(tokens, event.from), receiver = reactionAnchor(tokens, event.to)
    if (!sender || !receiver || sender.id === receiver.id) return
    clearTimeout(reactionTimer.current ?? undefined)
    setReaction({ ...event, sender, receiver, startedAt: Date.now() + REACTION_LAUNCH_DELAY })
    const duration = event.kind === 'bomb' ? BOMB_SCORCH_END : REACTION_DURATION
    reactionTimer.current = setTimeout(() => { setReaction(null); reactionTimer.current = null }, REACTION_LAUNCH_DELAY + duration)
  }, [])
  useFocusEffect(useCallback(() => {
    const off = onMatchReaction(showReaction)
    return () => { off(); clearTimeout(reactionTimer.current ?? undefined); setReaction(null); setRecipient(null) }
  }, [showReaction, setReaction, setRecipient]))
  const playSound = useCallback((clip: number) => {
    const match = useMatch.getState()
    if (match.phase === 'ended') return
    if (clip !== DANCE_SONG) danceStartedAt.current = 0
    setSound({ clip, receivedAt: Date.now(), matchId: match.startedAt })
  }, [])
  useEffect(() => {
    if (!rescue) return
    const timers = rescue.captures.map((_, index) => setTimeout(() => {
      if (useMatch.getState().animation === rescue && !addedSoundRef.current) playSound(AMBULANCE_SOUND)
    }, Math.max(0, rescue.startedAt + rescue.path.length * STEP_MS + index * RESCUE_MS + RESCUE_ARRIVAL_MS - Date.now())))
    return () => timers.forEach(clearTimeout)
  }, [rescue, playSound])
  useFocusEffect(useCallback(() => {
    const off = onMatchSound(playSound)
    return () => { off(); setSound(null); setSoundsOpen(false); danceStartedAt.current = 0 }
  }, [playSound, setSound, setSoundsOpen]))

  function sendReaction(kind: ReactionKind) {
    setEffectNotice('')
    if (recipient === null || senderSeat == null || senderSeat === recipient || phase === 'ended') {
      setEffectNotice('Choose another player to send a reaction.')
      return
    }
    if (reaction) { setEffectNotice('Wait for the current reaction to finish.'); return }
    if (mode === 'online') void sendMatchReaction(kind, recipient).catch(error => setEffectNotice(error.message))
    else showReaction({ kind, from: senderSeat, to: recipient })
  }

  const dancePlaying = sound?.clip === DANCE_SONG && addedSoundPlaying
  function requestSound(clip: number) {
    setEffectNotice('')
    if (dancePlaying) {
      setEffectNotice('Let the dance finish first.')
      return
    }
    if (mode === 'online') void sendMatchSound(clip).catch(error => setEffectNotice(error.message))
    else playSound(clip)
  }

  const callout =
    phase === 'ended'
      ? 'MATCH COMPLETE'
      : phase === 'moving'
        ? capturing ? 'CAPTURE!' : 'MOVING...'
        : !isHumanTurn
        ? `${(players.find((p) => p.seat === current)?.name ?? 'OPPONENT').toUpperCase()} IS THINKING...`
        : phase === 'await-roll'
          ? sharedTable ? `${(turnName ?? 'Player').toUpperCase()}, ROLL THE DICE` : 'YOUR TURN! TAP THE DICE'
          : phase === 'rolling'
            ? 'ROLLING...'
            : phase === 'await-move'
              ? moves.length
                ? `YOU ROLLED ${die} — TAP A PAWN`
                : `YOU ROLLED ${die} — NO LEGAL MOVE`
              : 'MOVING...'

  const hint =
    capturing ? 'Rescue crew returning the captured character to its yard'
    : phase === 'await-move' && isHumanTurn && moves.length
      ? `${moves.length} pawn${moves.length > 1 ? 's' : ''} can move ${die} space${die === 1 ? '' : 's'}`
      : phase === 'await-roll' && isHumanTurn
        ? 'Tap the dice to roll'
        : 'Waiting for the table'

  const showRoll = phase === 'await-roll' && isHumanTurn
  const canAutoMove = phase === 'await-move' && isHumanTurn && moves.length > 0
  const pastRoller = passedRoll && players.find(player => player.seat === passedRoll.seat)
  const passHint = passedRoll && pastRoller && (passedRoll.reason === 'three-sixes'
    ? `${pastRoller.name} rolled three sixes and passed`
    : `${pastRoller.name} rolled ${passedRoll.die} · no legal move`)

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <Glow size={320} color={C.arenaPrimaryContainer} opacity={0.22} style={{ top: -48, alignSelf: 'center' }} />

          {/* Top match bar */}
          <View style={[styles.topBar, compactHeader && styles.compactTopBar]}>
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
              {sharedTable ? <Pressable style={styles.squareButton} accessibilityRole="button"
                accessibilityLabel={voiceEnabled ? 'Mute turn announcements' : 'Enable turn announcements'}
                onPress={() => setVoiceEnabled(value => !value)}>
                <Icon name={voiceEnabled ? 'record-voice-over' : 'voice-over-off'} size={20} color={C.arenaTertiary} />
              </Pressable> : canChat && <Pressable style={styles.squareButton} accessibilityRole="button"
                accessibilityLabel={voiceOpen ? 'Close voice chat' : 'Open voice chat'}
                accessibilityState={{ expanded: voiceOpen }} onPress={() => setVoiceOpen(open => !open)}>
                <Icon name="mic" size={20} color={voiceOpen ? C.arenaTertiary : C.arenaOnSurfaceVariant} />
              </Pressable>}
            </View>

            <View style={[styles.pot, compactHeader && styles.compactPot]}>
              {!compactHeader && <View style={styles.potIcon}>
                <Icon name="monetization-on" size={16} color={C.arenaOnSecondary} />
              </View>}
              <View>
                <Text style={styles.potLabel}>POT PRIZE</Text>
                <Text style={styles.potValue}>2,000</Text>
              </View>
            </View>

            <View style={styles.topGroup}>
              {phase !== 'ended' && <Pressable style={styles.squareButton} accessibilityRole="button"
                accessibilityLabel="Open match sounds" onPress={() => setSoundsOpen(true)}>
                <Icon name="music-note" size={20} color={C.arenaSecondaryFixed} />
              </Pressable>}
              {phase !== 'ended' && <Pressable style={[styles.squareButton, dancePlaying && { opacity: .55 }]}
                accessibilityRole="button" accessibilityLabel="Play dance song"
                accessibilityState={{ disabled: dancePlaying }} disabled={dancePlaying}
                onPress={() => requestSound(DANCE_SONG)}>
                <Icon name="dance-ballroom" size={24} color={C.arenaSecondaryFixed} />
              </Pressable>}
              <Pressable style={styles.squareButton} accessibilityRole="button"
                accessibilityLabel={soundMuted ? 'Enable match sound' : 'Mute match sound'}
                onPress={() => setSoundMuted(value => !value)}>
                <Icon name={soundMuted ? 'volume-off' : 'volume-up'} size={20} color={C.arenaOnSurfaceVariant} />
              </Pressable>
            </View>
          </View>

          {canChat && voiceOpen && <MatchVoice key={friendsRoom} />}
          <View style={styles.stage}>
            <SceneBoundary>
              <MatchScene reaction={reaction} danceStartedAt={danceStartedAt} />
            </SceneBoundary>
            {effectNotice ? <Pressable onPress={() => setEffectNotice('')} style={styles.reactionCaption}>
              <Text accessibilityLiveRegion="polite" style={styles.reactionCaptionText}>{effectNotice}</Text>
            </Pressable> : reaction && phase !== 'ended' && <View pointerEvents="none" style={styles.reactionCaption}>
              <Text accessibilityLiveRegion="polite" numberOfLines={1} style={styles.reactionCaptionText}>
                {players.find(player => player.seat === reaction.from)?.name} → {players.find(player => player.seat === reaction.to)?.name}
                {' · '}{REACTIONS.find(item => item.id === reaction.kind)?.label}
              </Text>
            </View>}

            {phase === 'ended' && (
              <View style={styles.endOverlay}>
                <Icon name="emoji-events" size={48} color={C.arenaSecondaryContainer} />
                <Text style={styles.endTitle}>
                  {params.variant === 'teams' && ranking.length
                    ? `TEAM ${ranking[0] % 2 + 1} WINS`
                    : `${(players.find(p => p.seat === ranking[0])?.name ?? '').toUpperCase()} WINS`}
                </Text>
                <View style={{ width: 220, gap: 4 }}>
                  {ranking.map((seat, i) => (
                    <View key={seat} style={styles.rankRow}>
                      <View style={styles.rankLeft}>
                        <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[seat] }]} />
                        <Text style={styles.rankName}>{players.find((p) => p.seat === seat)?.name}</Text>
                      </View>
                      <Text style={styles.rankName}>{params.variant === 'teams' ? 'WINNER' : `#${i + 1}`}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={styles.rematch}
                  onPress={() => {
                    if (params.cupRound !== undefined) router.dismissTo('/tournament')
                    else if (mode === 'online') { leaveRoom(); router.replace('/friends') }
                    else start(table, params.variant)
                  }}
                >
                  <Text style={styles.rematchText}>{params.cupRound !== undefined ? 'CUP STANDINGS' : mode === 'online' ? 'BACK TO LOBBY' : 'REMATCH'}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <ScrollView style={styles.footer} contentContainerStyle={styles.footerContent} showsVerticalScrollIndicator={false}>
          <View style={styles.prompt}>
            <View style={styles.promptLeft}>
              <View style={[styles.seatDot, { backgroundColor: SEAT_HEX[current], width: 12, height: 12 }]} />
              <View style={styles.promptCopy}>
                <Text style={styles.calloutText}>{callout}</Text>
                {(sharedTable || capturing || canAutoMove) && <Text
                  numberOfLines={sharedTable ? 1 : undefined} style={styles.promptText}>{showRoll && passHint ? passHint : hint}</Text>}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              style={[styles.autoButton, sharedTable && styles.sharedRollButton, !showRoll && !canAutoMove && { opacity: 0.4 }]}
              disabled={!showRoll && !canAutoMove}
              onPress={showRoll ? roll : () => moves.length && pickToken(moves[0].tokenId)}
            >
              <Text style={styles.autoText}>{canAutoMove || !sharedTable && !showRoll
                ? 'AUTO MOVE' : phase === 'rolling' ? 'ROLLING…' : 'ROLL DICE'}</Text>
            </Pressable>
          </View>

          <View style={styles.seatRow}>
            {players.map((p) => (
              <PlayerChip key={p.seat} seat={p.seat} active={current === p.seat && phase !== 'ended'} secondsLeft={sharedTable ? -1 : secondsLeft}
                onReaction={senderSeat != null && p.seat !== senderSeat && phase !== 'ended' ? () => setRecipient(p.seat) : undefined} />
            ))}
          </View>
        </ScrollView>
        {target && phase !== 'ended' && <ReactionPicker key={target.seat} target={target.name}
          close={() => setRecipient(null)} send={sendReaction} />}
        {soundsOpen && phase !== 'ended' && <MatchSoundboard close={() => setSoundsOpen(false)}
          play={requestSound} />}
        {sound && sound.matchId === startedAt && phase !== 'ended' && <MatchSoundPlayback
          key={sound.receivedAt} clip={sound.clip} muted={soundMuted} onDance={startDance} onPlayingChange={onSoundPlayingChange} />}
      </SafeAreaView>
    </View>
  )
}

/** RN 0.88 dropped `StyleSheet.absoluteFillObject` from its public types. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.arenaSurface },
  footer: { flexGrow: 0, flexShrink: 1, maxHeight: '45%' },
  footerContent: { paddingVertical: 6, gap: 5 },

  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compactTopBar: { paddingHorizontal: 7, gap: 4 },
  compactPot: { paddingHorizontal: 8 },
  squareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.arenaHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  seatRow: { paddingHorizontal: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 5 },
  playerChip: { width: '49%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, gap: 5, backgroundColor: C.arenaLow, borderRadius: 12 },
  playerDetails: { flex: 1, minWidth: 0 },
  avatarSlot: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: R.full, backgroundColor: C.arenaHighest },
  avatarActive: { width: 28, height: 28, borderRadius: R.full, backgroundColor: C.arenaHighest },
  seatBadge: { position: 'absolute', bottom: 0, right: 0, paddingHorizontal: 4, borderRadius: R.full },
  seatBadgeText: { fontFamily: F.arena, ...TA.labelSm },
  seatDot: { width: 8, height: 8, borderRadius: R.full },
  playerName: { fontFamily: F.arena, ...TA.headlineMd, color: C.arenaOnSurface },
  playerStatus: { fontFamily: F.arena, ...TA.labelSm },

  stage: {
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: C.arenaLow,
  },
  reactionCaption: { alignSelf: 'center', maxWidth: '92%', position: 'absolute', top: 8, paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 16, backgroundColor: C.arenaContainer },
  reactionCaptionText: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaSecondaryFixed },
  calloutText: { fontFamily: F.arena, ...TA.labelLg, color: C.arenaSecondaryFixed },
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

  prompt: {
    marginHorizontal: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: C.arenaHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  promptLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  promptCopy: { flexShrink: 1 },
  promptText: { fontFamily: F.arenaBody, ...TA.bodySm, color: C.arenaOnSurface, flexShrink: 1 },
  autoButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: C.arenaTertiaryContainer },
  sharedRollButton: { minHeight: 48, minWidth: 104, alignItems: 'center', justifyContent: 'center' },
  autoText: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaOnTertiaryContainer },

  standingScore: { fontFamily: F.arena, ...TA.labelMd, color: C.arenaOnSurface, marginLeft: 'auto' },
})
