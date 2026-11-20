import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Character } from '../game/character'
import { useIdentity } from '../game/identity'
import { practice } from '../game/localTable'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import AvatarPicker from '../ui/AvatarPicker'

const counts = [2, 4] as const

export default function Computer() {
  const equipped = useIdentity(state => state.character)
  const [count, setCount] = useState<2 | 4>(4)
  const [selection, setSelection] = useState<Character | undefined>()
  const character = selection ?? equipped ?? { model: 0 }

  return <ArcadePage title="Play with computer" footer={<Action label="Play" onPress={() => practice(count, character)} />}>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>How many players?</Text>
      <View style={s.line}>
        {counts.map(size => <Pressable key={size} accessibilityRole="radio" accessibilityState={{ checked: count === size }}
          onPress={() => setCount(size)} style={[styles.option, count === size && styles.selected]}>
          <Text style={s.heading}>{size} players</Text>
          <Text style={s.copy}>{size === 2 ? 'You vs 1 bot' : 'You vs 3 bots'}</Text>
        </Pressable>)}
      </View>
    </View>
    <View style={s.card}>
      <Text accessibilityRole="header" style={s.heading}>Select avatar</Text>
      <AvatarPicker selected={character} onSelect={setSelection} />
    </View>
  </ArcadePage>
}

const styles = StyleSheet.create({
  option: { flex: 1, borderWidth: 1, borderColor: '#42659b', borderRadius: 12, backgroundColor: '#0d2447', padding: 10 },
  selected: { borderColor: '#ffc651', backgroundColor: '#234b83' },
})
