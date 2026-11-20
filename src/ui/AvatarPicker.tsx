import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CREW, type Character, type CharacterModel } from '../game/character'
import { useIdentity } from '../game/identity'
import CharacterPreview from '../three/CharacterPreview'
import SceneBoundary from '../three/SceneBoundary'
import { s } from './ArcadePage'

const builtIn: { label: string; character: Character }[] = CREW.map((label, index) => ({
  label, character: { model: index as CharacterModel },
}))

export default function AvatarPicker({ selected, onSelect, hint = 'Drag to rotate' }: {
  selected: Character; onSelect: (character: Character) => void; hint?: string
}) {
  const equipped = useIdentity(state => state.character)
  const choices = equipped?.avatarId ? [...builtIn, { label: 'My avatar', character: equipped }] : builtIn

  return <>
    <View style={styles.preview}>
      <SceneBoundary label="Avatar preview unavailable"><CharacterPreview character={selected} /></SceneBoundary>
    </View>
    <Text style={s.copy}>{hint}</Text>
    <View style={s.line}>
      {choices.map(({ label, character }) => {
        const checked = selected.model === character.model && selected.avatarId === character.avatarId
        return <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked }}
          onPress={() => onSelect(character)} style={[styles.option, checked && styles.selected]}>
          <Text style={s.copy}>{label}</Text>
        </Pressable>
      })}
    </View>
  </>
}

const styles = StyleSheet.create({
  preview: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0b1e38' },
  option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#42659b', borderRadius: 12, backgroundColor: '#0d2447', paddingHorizontal: 12, paddingVertical: 8 },
  selected: { borderColor: '#ffc651', backgroundColor: '#234b83' },
})
