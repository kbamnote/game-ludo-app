import { useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import { Asset } from 'expo-asset'
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, type AudioPlayer } from 'expo-audio'
import { useFocusEffect } from 'expo-router'
import { coronationDuration, type Coronation } from './coronation'
import { ONLINE_DICE_ROLL_MS, RESCUE_ARRIVAL_MS, RESCUE_HOME_MS, RESCUE_MS, STEP_MS } from './moveTiming'
import type { Reaction, ReactionKind } from './reactions'
import { matchTime, useMatch, type MoveAnimation } from './store'
import { AMBULANCE_SOUND, soundAsset } from './soundboard'

const REACTION_SOUND_MS = 2100
const SIREN_LEAD_IN_SECONDS = .55
const REACTION_SOUNDS: Record<ReactionKind, number> = {
  knife: require('../../assets/sounds/reaction-knife.wav'),
  heart: require('../../assets/sounds/reaction-heart.wav'),
  cactus: require('../../assets/sounds/reaction-cactus.wav'),
  orange: require('../../assets/sounds/reaction-orange.wav'),
  snowball: require('../../assets/sounds/reaction-snowball.wav'),
  duck: require('../../assets/sounds/reaction-duck.wav'),
  gift: require('../../assets/sounds/reaction-gift.wav'),
  bomb: require('../../assets/sounds/reaction-bomb.wav'),
}

export function useMatchAudio(muted: boolean, reaction: Reaction | null, coronation: Coronation | null) {
  const roll = useAudioPlayer(require('../../assets/sounds/dice-shuffle.wav'))
  const step = useAudioPlayer(require('../../assets/sounds/pawn-step.wav'))
  const capture = useAudioPlayer(require('../../assets/sounds/capture.wav'))
  const win = useAudioPlayer(require('../../assets/sounds/win.wav'))
  const band = useAudioPlayer(require('../../assets/sounds/coronation-band.wav'))
  const reactionAudio = useAudioPlayer(reaction ? REACTION_SOUNDS[reaction.kind] : null, { downloadFirst: true })

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {})
    void Asset.loadAsync(Object.values(REACTION_SOUNDS)).catch(() => {})
  }, [])

  useEffect(() => {
    if (muted || !coronation) return
    const elapsed = Math.max(0, matchTime() - coronation.startedAt)
    if (elapsed >= coronationDuration(coronation.place)) return
    let active = true
    void band.seekTo(elapsed / 1000).then(() => { if (active) band.play() }).catch(() => {})
    return () => { active = false; band.pause() }
  }, [muted, coronation, band])

  useEffect(() => {
    if (muted || !reaction || coronation) return
    let active = true
    // Each clip starts at the throw and places its impact at REACTION_HIT.
    const timer = setTimeout(() => {
      const elapsed = Date.now() - reaction.startedAt
      if (elapsed >= REACTION_SOUND_MS) return
      void reactionAudio.seekTo(Math.max(0, elapsed) / 1000)
        .then(() => { if (active) reactionAudio.play() })
        .catch(() => {})
    }, Math.max(0, reaction.startedAt - Date.now()))
    return () => {
      active = false
      clearTimeout(timer)
      reactionAudio.pause()
    }
  }, [muted, reaction, reactionAudio, coronation])

  useEffect(() => {
    if (muted || coronation) {
      for (const player of [roll, step, capture, win]) player.pause()
      return
    }
    let active = true
    const timers: ReturnType<typeof setTimeout>[] = []
    function play(player: AudioPlayer) {
      // An ended Android player must seek before it reports loaded again.
      const rewind = player.seekTo(0)
      if (Platform.OS === 'web') {
        void rewind.catch(() => {})
        player.play()
      } else {
        void rewind.then(() => { if (active) player.play() }).catch(() => {})
      }
    }

    function scheduleMove(animation: MoveAnimation | null) {
      for (const timer of timers.splice(0)) clearTimeout(timer)
      if (!animation) return
      const { startedAt, path, captures } = animation
      function at(player: AudioPlayer, offset: number) {
        const delay = startedAt + offset - matchTime()
        if (delay < -60) return
        timers.push(setTimeout(() => play(player), Math.max(0, delay)))
      }
      // Play within each step so a final frame and its idle snapshot cannot
      // cancel the footfall when the JS thread is busy rendering an online move.
      path.forEach((_, index) => at(step, index * STEP_MS + 90))
      if (captures.length) at(capture, path.length * STEP_MS)
    }

    scheduleMove(useMatch.getState().animation)
    const unsubscribe = useMatch.subscribe((state, previous) => {
      if (state.animation !== previous.animation) scheduleMove(state.animation)
      if (state.lastRoll && state.lastRoll !== previous.lastRoll) {
        roll.setPlaybackRate(ONLINE_DICE_ROLL_MS / state.lastRoll.duration)
        play(roll)
      } else if (state.phase === 'ended' && previous.phase !== 'ended' && !state.coronation) {
        play(win)
      }
    })
    return () => {
      active = false
      for (const timer of timers) clearTimeout(timer)
      unsubscribe()
    }
  }, [muted, coronation, roll, step, capture, win])
}

export function RescueAudio({ rescue, muted }: { rescue: MoveAnimation | null; muted: boolean }) {
  // Keep the siren ready before a capture and give it its own player.
  const siren = useAudioPlayer(soundAsset(AMBULANCE_SOUND), { downloadFirst: true })
  const { isLoaded } = useAudioPlayerStatus(siren)
  useFocusEffect(useCallback(() => {
    if (!rescue || muted || !isLoaded) return
    const walkEnd = rescue.startedAt + rescue.path.length * STEP_MS
    const now = matchTime()
    const timers: ReturnType<typeof setTimeout>[] = []
    let active = true
    rescue.captures.forEach((_, index) => {
      const rescueStart = walkEnd + index * RESCUE_MS
      const startsAt = rescueStart + RESCUE_ARRIVAL_MS
      const endsAt = rescueStart + RESCUE_HOME_MS
      if (endsAt <= now) return
      timers.push(setTimeout(() => {
        const elapsed = matchTime() - startsAt
        if (matchTime() >= endsAt || useMatch.getState().animation !== rescue) return
        void siren.seekTo(SIREN_LEAD_IN_SECONDS + Math.max(0, elapsed) / 1000).then(() => {
          if (active && matchTime() < endsAt && useMatch.getState().animation === rescue) siren.play()
        }).catch(() => {})
      }, Math.max(0, startsAt - now)))
      timers.push(setTimeout(() => siren.pause(), endsAt - now))
    })
    return () => {
      active = false
      timers.forEach(clearTimeout)
      siren.pause()
    }
  }, [isLoaded, muted, rescue, siren]))
  return null
}
