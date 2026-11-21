import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AppState, Platform } from 'react-native'
import { useFocusEffect, usePathname } from 'expo-router'
import { setAudioModeAsync, useAudioPlayer, type AudioPlayer } from 'expo-audio'
import { create } from 'zustand'
import { useProfile } from './profile'

export const ButtonAudio = createContext<() => void>(() => {})
const useMatchAudioHold = create<{ paused: boolean }>(() => ({ paused: false }))

export function usePauseMenuAudio(paused: boolean) {
  useFocusEffect(useCallback(() => {
    if (!paused) return
    useMatchAudioHold.setState({ paused: true })
    return () => useMatchAudioHold.setState({ paused: false })
  }, [paused]))
}

function setMusicMix(player: AudioPlayer) {
  player.loop = true
  player.volume = .24
}

function setTapMix(player: AudioPlayer) {
  player.volume = .31
}

export default function AppAudio({ children }: { children: ReactNode }) {
  const route = usePathname()
  const music = useAudioPlayer(require('../../assets/sounds/table-theme.wav'))
  const tap = useAudioPlayer(require('../../assets/sounds/button-tap.wav'))
  const muted = useProfile(state => state.soundMuted)
  const paused = useMatchAudioHold(state => state.paused)
  const [active, setActive] = useState(() => Platform.OS === 'web' || AppState.currentState === 'active')
  const unlocked = useRef(Platform.OS !== 'web')
  const lastTap = useRef(0)
  const canPlay = active && !muted && !paused
  const playMusic = canPlay && route !== '/' && route !== '/onboarding' && route !== '/voice' && route !== '/match'

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setActive(state === 'active'))
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {})
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    setMusicMix(music)
    if (!playMusic) music.pause()
    else if (unlocked.current && !music.playing) music.play()
  }, [music, playMusic])

  useEffect(() => {
    setTapMix(tap)
    if (!canPlay) tap.pause()
  }, [tap, canPlay])

  const playPress = useCallback(() => {
    unlocked.current = true
    if (!canPlay || useProfile.getState().soundMuted) return
    if (playMusic && !music.playing) music.play()
    const now = Date.now()
    if (now - lastTap.current < 45) return
    lastTap.current = now
    const rewind = tap.seekTo(0)
    if (Platform.OS === 'web') {
      void rewind.catch(() => {})
      tap.play()
    } else {
      void rewind.then(() => {
        if (lastTap.current === now && AppState.currentState === 'active' && !useProfile.getState().soundMuted
          && !useMatchAudioHold.getState().paused) tap.play()
      }).catch(() => {})
    }
  }, [canPlay, music, playMusic, tap])

  return <ButtonAudio.Provider value={playPress}>{children}</ButtonAudio.Provider>
}
