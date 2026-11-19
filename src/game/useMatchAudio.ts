import { useEffect } from 'react'
import { Platform } from 'react-native'
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio'
import { useMatch } from './store'

export function useMatchAudio(muted: boolean) {
  const roll = useAudioPlayer(require('../../assets/sounds/roll.wav'))
  const move = useAudioPlayer(require('../../assets/sounds/move.wav'))
  const capture = useAudioPlayer(require('../../assets/sounds/capture.wav'))
  const win = useAudioPlayer(require('../../assets/sounds/win.wav'))

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {})
  }, [])

  useEffect(() => {
    if (muted) {
      for (const player of [roll, move, capture, win]) player.pause()
      return
    }
    let active = true
    const unsubscribe = useMatch.subscribe((state, previous) => {
      if (state.phase === previous.phase) return
      const player = state.phase === 'rolling' ? roll
        : state.phase === 'moving' ? (state.animation?.captures.length ? capture : move)
        : state.phase === 'ended' ? win : null
      if (!player) return
      // An ended Android player must seek before it reports loaded again.
      const rewind = player.seekTo(0)
      if (Platform.OS === 'web') {
        void rewind.catch(() => {})
        player.play()
      } else {
        void rewind.then(() => { if (active) player.play() }).catch(() => {})
      }
    })
    return () => { active = false; unsubscribe() }
  }, [muted, roll, move, capture, win])
}
