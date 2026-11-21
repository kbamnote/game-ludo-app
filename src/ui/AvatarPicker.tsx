import { StyleSheet, Text, View } from 'react-native'
import Pressable from './SoundPressable'
import { CREW, VARSITY, type Character, type CharacterModel } from '../game/character'
import { bundledMetaPerson, METAPERSON_ROSTER } from '../game/metapersonRoster'
import { useIdentity } from '../game/identity'
import CharacterPreview from '../three/CharacterPreview'
import SceneBoundary from '../three/SceneBoundary'
import { s } from './ArcadePage'

type CharacterOption = { label: string; character: Character }
type SelectionProps = { selected: Character; onSelect: (character: Character) => void }

const builtIn: CharacterOption[] = CREW.map((label, index) => ({
  label, character: { model: index as CharacterModel },
}))
const imported: CharacterOption[] = METAPERSON_ROSTER.map(({ label, id }) => ({ label, character: { model: VARSITY, avatarId: id } }))

function Options({ choices, selected, onSelect, grid = false }: SelectionProps & { choices: readonly CharacterOption[]; grid?: boolean }) {
  return <View style={s.line}>
    {choices.map(({ label, character }) => {
      const checked = selected.model === character.model && selected.avatarId === character.avatarId
      return <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label} aria-checked={checked}
        onPress={() => onSelect(character)} style={[styles.option, grid && styles.gridOption, checked && styles.selected]}>
        <Text style={s.copy}>{label}</Text>
      </Pressable>
    })}
  </View>
}

export function AvatarOptions({ selected, onSelect }: SelectionProps) {
  const equipped = useIdentity(state => state.character)
  const choices = equipped?.model === VARSITY && (equipped.avatarId || equipped.face) && !bundledMetaPerson(equipped.avatarId)
    ? [...builtIn, { label: 'My avatar', character: equipped }] : builtIn
  return <>
    <Options choices={choices} selected={selected} onSelect={onSelect} />
    <Text accessibilityRole="header" style={s.heading}>MetaPerson characters</Text>
    <Options choices={imported} selected={selected} onSelect={onSelect} grid />
  </>
}

export function AvatarPickerPreview({ character, hint = 'Drag to rotate', expanded = false }: {
  character: Character; hint?: string; expanded?: boolean
}) {
  return <>
    <View style={[styles.preview, expanded && styles.expandedPreview]}>
      <SceneBoundary label="Avatar preview unavailable"><CharacterPreview character={character} /></SceneBoundary>
    </View>
    <Text style={s.copy}>{hint}</Text>
  </>
}

export default function AvatarPicker({ selected, onSelect, hint }: SelectionProps & { hint?: string }) {
  return <>
    <AvatarPickerPreview character={selected} hint={hint} />
    <AvatarOptions selected={selected} onSelect={onSelect} />
  </>
}

const styles = StyleSheet.create({
  preview: { height: 150, borderRadius: 14, overflow: 'hidden', backgroundColor: '#0b1e38' },
  expandedPreview: { flex: 1, height: undefined },
  option: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#42659b', borderRadius: 12, backgroundColor: '#0d2447', paddingHorizontal: 12, paddingVertical: 8 },
  gridOption: { width: '47%', alignItems: 'center', paddingHorizontal: 5 },
  selected: { borderColor: '#ffc651', backgroundColor: '#234b83' },
})
