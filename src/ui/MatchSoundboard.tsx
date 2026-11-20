import { useEffect, useRef } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { DANCE_SONG, SOUND_CLIPS, soundAsset } from '../game/soundboard'
import Icon from './Icon'
import { s } from './ArcadePage'

export function MatchSoundPlayback({ clip, endsAt, muted, onDance, onPlayingChange }: {
  clip: number; endsAt?: number; muted: boolean; onDance: () => void; onPlayingChange: (playing: boolean) => void
}) {
  const player = useAudioPlayer(soundAsset(clip), {
    downloadFirst: true, updateInterval: 80,
  })
  const status = useAudioPlayerStatus(player)
  const requested = useRef(false)
  const danced = useRef(false)
  useEffect(() => {
    // Expo Audio exposes mute as a native player property.
    // eslint-disable-next-line react-hooks/immutability
    player.muted = muted
  }, [player, muted])
  useEffect(() => {
    if (!status.isLoaded) return
    const remaining = endsAt === undefined ? undefined : endsAt - Date.now()
    if (remaining !== undefined && remaining <= 0) {
      if (requested.current) player.pause()
      return
    }
    if (!requested.current) {
      requested.current = true
      player.play()
    }
    if (remaining === undefined) return
    const timer = setTimeout(() => player.pause(), remaining)
    return () => clearTimeout(timer)
  }, [endsAt, player, status.isLoaded])
  useEffect(() => {
    onPlayingChange(status.playing)
    return () => onPlayingChange(false)
  }, [onPlayingChange, status.playing])
  useEffect(() => {
    if (clip !== DANCE_SONG || danced.current || !status.playing) return
    danced.current = true
    onDance()
  }, [clip, onDance, status.playing])
  return null
}

export default function MatchSoundboard({ close, play }: {
  close: () => void; play: (clip: number) => void
}) {
  const sending = useRef(false)
  function select(clip: number) {
    if (sending.current) return
    sending.current = true
    close()
    play(clip)
  }
  return <Modal transparent onRequestClose={close}>
    <View style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close sounds" onPress={close} />
      <View style={[s.card, styles.panel]}>
        <Text accessibilityRole="header" style={s.heading}>Match sounds</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
          {SOUND_CLIPS.map(item => <Pressable key={item.id} accessibilityRole="button"
            accessibilityLabel={`Play ${item.label}`} style={styles.clip}
            onPress={() => select(item.id)}>
            <Icon name="volume-up" size={17} color="#ffd066" />
            <Text style={styles.clipLabel}>{item.label}</Text>
          </Pressable>)}
        </ScrollView>
        <Pressable style={styles.cancel} accessibilityRole="button" onPress={close}>
          <Text style={s.copy}>Close</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 16, paddingBottom: 34, backgroundColor: '#030b19be' },
  panel: { width: '100%', maxWidth: 500, maxHeight: '88%' },
  scroll: { flexGrow: 0, maxHeight: 375 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clip: { width: '46%', flexGrow: 1, minHeight: 48, padding: 9, flexDirection: 'row',
    alignItems: 'center', gap: 6, borderRadius: 12,
    borderColor: '#466890', borderWidth: 1, backgroundColor: '#0b1e38' },
  clipLabel: { ...s.copy, flex: 1 },
  cancel: { alignSelf: 'center', padding: 8 },
})
