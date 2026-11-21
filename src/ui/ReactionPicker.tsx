import { useRef, useState } from 'react'
import { Image, Modal, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import Pressable from './SoundPressable'
import { REACTIONS, type ReactionKind } from '../game/reactions'
import { C, F } from '../theme'
import { Action, s } from './ArcadePage'

const thumbnails: Record<ReactionKind, ImageSourcePropType> = {
  knife: require('../../assets/reactions/knife.png'),
  heart: require('../../assets/reactions/heart.png'),
  cactus: require('../../assets/reactions/cactus.png'),
  orange: require('../../assets/reactions/orange.png'),
  snowball: require('../../assets/reactions/snowball.png'),
  duck: require('../../assets/reactions/duck.png'),
  gift: require('../../assets/reactions/gift.png'),
  bomb: require('../../assets/reactions/bomb.png'),
}

export default function ReactionPicker({ target, close, send }: {
  target: string; close: () => void; send: (kind: ReactionKind) => void
}) {
  const [choice, setChoice] = useState<ReactionKind>('heart')
  const submitted = useRef(false)
  function submit() {
    if (submitted.current) return
    submitted.current = true
    close()
    send(choice)
  }
  return <Modal transparent onRequestClose={close}>
    <View style={styles.scrim}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close reaction picker" onPress={close} />
      <View style={[s.card, styles.panel]}>
        <Text accessibilityRole="header" style={s.heading}>Send a reaction to {target}</Text>
        <View style={styles.grid}>{REACTIONS.map(item => <Pressable key={item.id} accessibilityRole="radio"
          accessibilityLabel={item.label}
          accessibilityState={{ checked: choice === item.id }} style={[styles.option, choice === item.id && styles.selected]}
          onPress={() => setChoice(item.id)}>
          <Image source={thumbnails[item.id]} resizeMode="contain" style={styles.thumbnail} />
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>)}</View>
        <Action label="Send reaction" onPress={submit} />
        <Pressable accessibilityRole="button" onPress={close} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 16, paddingBottom: 34, backgroundColor: '#030b19be' },
  panel: { width: '100%', maxWidth: 500 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { width: '22%', flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: '#466890',
    backgroundColor: '#0b1e38', paddingVertical: 6, borderRadius: 12 },
  thumbnail: { width: 66, maxWidth: '100%', height: 51 },
  label: { color: C.arenaOnSurface, fontFamily: F.arenaBody, fontSize: 13, textAlign: 'center' },
  selected: { borderColor: '#ffd466', backgroundColor: '#28548a' },
  cancel: { alignSelf: 'center', padding: 7 },
  cancelText: { color: C.arenaOnSurfaceVariant, fontFamily: F.arena },
})
