import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import CharacterPreview from '../three/CharacterPreview'
import SceneBoundary from '../three/SceneBoundary'
import { CREW, type Character, type CharacterModel } from '../game/character'
import { SEAT_COLORS, SEAT_HEX, type Seat } from '../game/rules'
import { openTable } from '../game/localTable'
import { useIdentity } from '../game/identity'
import type { LocalVariant } from '../game/store'

const COLORS: Seat[] = [0, 1, 2, 3]
const MODES = [
  { id: 'classic', name: 'Normal', detail: 'Bring all four characters home.' },
  { id: 'teams', name: 'Team Up', detail: 'Four players. Both partners must finish.' },
  { id: 'quick', name: 'Quick', detail: 'First character home wins.' },
] as const

export default function PassPlay() {
  const nickname = useIdentity(state => state.name)
  const equipped = useIdentity(state => state.character)
  const [step, setStep] = useState(1)
  const [variant, setVariant] = useState<LocalVariant>('classic')
  const [count, setCount] = useState(2)
  const [pair, setPair] = useState(0)
  const [names, setNames] = useState([nickname, '', '', ''])
  const [selection, setSelection] = useState<(Character | undefined)[]>([])
  const [avatarPicker, setAvatarPicker] = useState<number | null>(null)
  const choices: { label: string; character: Character }[] = CREW.map((label, index) => ({
    label, character: { model: index as CharacterModel },
  }))
  if (equipped?.avatarId) choices.push({ label: 'My avatar', character: equipped })

  const seats: Seat[] = variant === 'teams' ? COLORS : count === 2 ? pair === 0 ? [0, 2] : [1, 3] : COLORS.slice(0, count)
  const characterFor = (index: number): Character => selection[index] ?? { model: seats[index] }
  const choose = (index: number, character: Character) => setSelection(previous => {
    const next = [...previous]
    next[index] = character
    return next
  })
  const matches = (a: Character, b: Character) => a.model === b.model && a.avatarId === b.avatarId
  const renderAvatarPicker = (index: number) => {
    const selected = characterFor(index)
    return <>
      <View style={styles.preview}>
        <SceneBoundary label="Avatar preview unavailable"><CharacterPreview character={selected} /></SceneBoundary>
      </View>
      <Text style={s.copy}>Player {index + 1} · Drag to rotate</Text>
      <View style={s.line}>
        {choices.map(({ label, character }) => <Pressable key={label} accessibilityRole="radio"
          accessibilityState={{ checked: matches(selected, character) }}
          onPress={() => choose(index, character)} style={[styles.option, matches(selected, character) && styles.selected]}>
          <Text style={s.copy}>{label}</Text>
        </Pressable>)}
      </View>
    </>
  }

  function startMatch() {
    openTable(seats.map((seat, index) => ({
      seat, name: names[index].trim() || 'Player ' + (index + 1),
      kind: 'human', character: characterFor(index),
    })), undefined, variant)
  }

  return <ArcadePage key={step} title="Pass & play" onBack={step === 2 ? () => setStep(1) : undefined}
    footer={step === 1 ? <Action label="Next" onPress={() => setStep(2)} /> : <Action label="Play" onPress={startMatch} />}>
    {step === 1 ? <>
      <View style={s.card}>
        <Text style={s.heading}>Select avatar</Text>
        {renderAvatarPicker(0)}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>Select game</Text>
        {MODES.map(mode => <Pressable key={mode.id} accessibilityRole="radio" accessibilityState={{ checked: variant === mode.id }}
          onPress={() => setVariant(mode.id)} style={[styles.option, variant === mode.id && styles.selected]}>
          <Text style={s.heading}>{mode.name}</Text>
          <Text style={s.copy}>{mode.detail}</Text>
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
          const currentChoice = choices.findIndex(choice => matches(choice.character, character))
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
                <Text style={s.copy}>{choices[currentChoice]?.label ?? CREW[character.model]} {avatarPicker === index ? '▴' : '▾'}</Text>
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
  preview: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0b1e38' },
  option: { borderWidth: 1, borderColor: '#42659b', borderRadius: 12, backgroundColor: '#0d2447', paddingHorizontal: 12, paddingVertical: 8 },
  selected: { borderColor: '#ffc651', backgroundColor: '#234b83' },
  player: { gap: 5, marginTop: 4 },
  name: { flex: 1, minWidth: 124 },
})
