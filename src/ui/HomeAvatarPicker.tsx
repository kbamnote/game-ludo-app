import { useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DEFAULT_CHARACTER_MODEL, VARSITY, type Character } from '../game/character'
import { useIdentity } from '../game/identity'
import { characterName } from '../game/metapersonRoster'
import ArcadeArt from './ArcadeArt'
import { Action, s } from './ArcadePage'
import { AvatarOptions, AvatarPickerPreview } from './AvatarPicker'
import Icon from './Icon'
import Pressable from './SoundPressable'

export default function HomeAvatarPicker({ close }: { close: () => void }) {
  const equipped = useIdentity(state => state.character)
  const equip = useIdentity(state => state.equipCharacter)
  const [selected, setSelected] = useState<Character>(() => equipped ?? { model: DEFAULT_CHARACTER_MODEL })
  const [expanded, setExpanded] = useState(false)
  const name = characterName(selected)

  function backToAvatars() {
    setExpanded(false)
  }

  function choose(character: Character) {
    setSelected(previous => {
      if (previous.model === character.model && previous.avatarId === character.avatarId) return previous
      return previous.model !== VARSITY && character.model !== VARSITY ? { ...previous, model: character.model } : character
    })
    setExpanded(true)
  }

  return <Modal visible transparent animationType="fade" onRequestClose={expanded ? backToAvatars : close}>
    <SafeAreaView style={styles.scrim}>
      <View style={[s.card, styles.panel, expanded && styles.expandedPanel]} accessibilityViewIsModal>
        <View style={styles.header}>
          {expanded ? <Pressable accessibilityRole="button" accessibilityLabel="Back to avatars" onPress={backToAvatars} style={styles.close}>
            <Icon name="arrow-back" size={21} color="#fff2cf" />
          </Pressable> : <ArcadeArt name="character" size={42} />}
          <Text accessibilityRole="header" style={[s.heading, styles.title]}>{expanded ? name : 'Select avatar'}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close avatar picker" onPress={close} style={styles.close}>
            <Icon name="close" size={21} color="#fff2cf" />
          </Pressable>
        </View>
        <AvatarPickerPreview character={selected} expanded={expanded} />
        {!expanded && <ScrollView style={styles.options} contentContainerStyle={styles.optionContent} keyboardShouldPersistTaps="handled">
          <AvatarOptions selected={selected} onSelect={choose} />
        </ScrollView>}
        <Action label={`Equip ${name}`} onPress={() => { equip(selected); close() }} />
      </View>
    </SafeAreaView>
  </Modal>
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#050e24cc' },
  panel: { width: '100%', maxWidth: 500, maxHeight: '95%', flexShrink: 1, borderColor: '#c99543', padding: 12 },
  expandedPanel: { height: '95%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 23 },
  close: { width: 44, height: 44, borderRadius: 11, backgroundColor: '#193b6c', alignItems: 'center', justifyContent: 'center' },
  options: { flexShrink: 1, flexGrow: 0 },
  optionContent: { gap: 8, paddingBottom: 4 },
})
