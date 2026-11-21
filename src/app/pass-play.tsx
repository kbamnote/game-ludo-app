import ArcadeArt from '../ui/ArcadeArt'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import Pressable from '../ui/SoundPressable'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import AvatarPicker from '../ui/AvatarPicker'
import type { Character } from '../game/character'
import { characterName } from '../game/metapersonRoster'
import { SEAT_COLORS, SEAT_HEX, type Seat } from '../game/rules'
import { openTable } from '../game/localTable'
import { useIdentity } from '../game/identity'
import type { LocalVariant } from '../game/store'
import { GAME_VARIANTS } from '../game/variants'

const COLORS: Seat[] = [0, 1, 2, 3]

export default function PassPlay() {
  const nickname = useIdentity(state => state.name)
  const [step, setStep] = useState(1)
  const [variant, setVariant] = useState<LocalVariant>('classic')
  const [count, setCount] = useState(2)
  const [pair, setPair] = useState(0)
  const [names, setNames] = useState([nickname, '', '', ''])
  const [selection, setSelection] = useState<(Character | undefined)[]>([])
  const [avatarPicker, setAvatarPicker] = useState<number | null>(null)

  const seats: Seat[] = variant === 'teams' ? COLORS : count === 2 ? pair === 0 ? [0, 2] : [1, 3] : COLORS.slice(0, count)
  const characterFor = (index: number): Character => selection[index] ?? { model: seats[index] }
  const choose = (index: number, character: Character) => setSelection(previous => {
    const next = [...previous]
    next[index] = character
    return next
  })
  const renderAvatarPicker = (index: number) => <AvatarPicker
    selected={characterFor(index)} onSelect={character => choose(index, character)} hint={`Player ${index + 1} · Drag to rotate`} />

  function startMatch() {
    openTable(seats.map((seat, index) => ({
      seat, name: names[index].trim() || 'Player ' + (index + 1),
      kind: 'human', character: characterFor(index),
    })), undefined, variant)
  }

  return <ArcadePage key={step} title="Pass & play" art="passPlay" onBack={step === 2 ? () => setStep(1) : undefined}
    footer={step === 1 ? <Action label="Next" onPress={() => setStep(2)} /> : <Action label="Play" onPress={startMatch} />}>
    {step === 1 ? <>
      <View style={s.card}>
        <Text style={s.heading}>Select avatar</Text>
        {renderAvatarPicker(0)}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Select game</Text>
        {GAME_VARIANTS.map(mode => <Pressable key={mode.id} accessibilityRole="radio" accessibilityState={{ checked: variant === mode.id }}
          onPress={() => setVariant(mode.id)} style={[styles.option, variant === mode.id && styles.selected]}>
          <View style={s.line}>
            <ArcadeArt name={mode.id === 'teams' ? 'team' : mode.id === 'quick' ? 'lucky7' : 'board'} size={38} />
            <View style={{ flex: 1 }}><Text style={s.heading}>{mode.name}</Text><Text style={s.copy}>{mode.detail}</Text></View>
          </View>
        </Pressable>)}
      </View>
    </> : <>
      <View style={s.card}>
        <Text style={s.heading}>Players and colors</Text>
        {variant !== 'teams' && <View style={s.line}>
          {[2, 3, 4].map(n => <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: count === n }}
            onPress={() => { setCount(n); setAvatarPicker(null) }} style={[styles.option, count === n && styles.selected]}>
            <Text style={s.copy}>{n} players</Text>
          </Pressable>)}
        </View>}
        {variant !== 'teams' && count === 2 && <View style={s.line}>
          {['Red / Yellow', 'Green / Blue'].map((label, index) => <Pressable key={label} accessibilityRole="radio"
            accessibilityState={{ checked: index === pair }} onPress={() => setPair(index)}
            style={[styles.option, index === pair && styles.selected]}><Text style={s.copy}>{label}</Text></Pressable>)}
        </View>}
        {seats.map((seat, index) => {
          const character = characterFor(index)
          return <View key={index} style={styles.player}>
            <Text style={[s.copy, { color: SEAT_HEX[seat] }]}>
              {SEAT_COLORS[seat].toUpperCase()}{variant === 'teams' ? ' · Team ' + (seat % 2 + 1) : ''}
            </Text>
            <View style={s.line}>
              <TextInput accessibilityLabel={'Player ' + (index + 1) + ' name'} placeholder={'Player ' + (index + 1)}
                placeholderTextColor="#aac1df" maxLength={16} style={[s.input, styles.name]} value={names[index]}
                onChangeText={value => setNames(previous => previous.map((name, i) => i === index ? value : name))} />
              <Pressable accessibilityRole="button" accessibilityLabel={'Select avatar for Player ' + (index + 1)}
                accessibilityState={{ expanded: avatarPicker === index }}
                onPress={() => setAvatarPicker(previous => previous === index ? null : index)} style={styles.option}>
                <Text style={s.copy}>{characterName(character)} {avatarPicker === index ? '▴' : '▾'}</Text>
              </Pressable>
            </View>
            {avatarPicker === index && renderAvatarPicker(index)}
          </View>
        })}
      </View>
    </>}
  </ArcadePage>
}

const styles = StyleSheet.create({
  option: { borderWidth: 1, borderColor: '#42659b', borderRadius: 12, backgroundColor: '#0d2447', paddingHorizontal: 12, paddingVertical: 8 },
  selected: { borderColor: '#ffc651', backgroundColor: '#234b83' },
  player: { gap: 5, marginTop: 4 },
  name: { flex: 1, minWidth: 124 },
})
