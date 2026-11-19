import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { CREW, VARSITY, type Character, type CharacterModel } from '../game/character'
import { loadAvatar } from '../three/useCharacterModel'
import { useIdentity } from '../game/identity'
import { SEAT_HEX } from '../game/rules'
import CharacterPreview from '../three/CharacterPreview'
import type { CharacterPose } from '../three/Pawn3D'
import SceneBoundary from '../three/SceneBoundary'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import MetaPersonCreator from '../ui/MetaPersonCreator'

function Editor() {
  const equipped = useIdentity(s => s.character)
  const equip = useIdentity(s => s.equipCharacter)
  const [draft, setDraft] = useState<Character>(equipped ?? { model: VARSITY })
  const [close, setClose] = useState(false)
  const [creating, setCreating] = useState(false)
  const { avatar } = useLocalSearchParams<{ avatar?: string }>()
  const [message, setMessage] = useState('')
  const [sampleClip, setSampleClip] = useState<CharacterPose['clip'] | null>(null)
  const [sampleClose, setSampleClose] = useState(true)

  const showAvatar = useCallback((id: string) => {
    setDraft({ model: VARSITY, avatarId:id }); setClose(true); setCreating(false); setMessage('')
  },[])
  useEffect(() => {
    if (!__DEV__ || typeof avatar !== 'string' || !/^[a-f0-9]{64}$/.test(avatar)) return
    let active = true
    loadAvatar(avatar).then(() => { if (active) showAvatar(avatar) }, e => {
      if (active) setMessage('Could not load the test avatar. '+(e instanceof Error ? e.message : ''))
    })
    return () => { active = false }
  },[avatar,showAvatar])
  const isEquipped = equipped?.model === draft.model && equipped?.face === draft.face && equipped?.avatarId === draft.avatarId
  if (creating) return <MetaPersonCreator onReady={showAvatar} onBack={() => setCreating(false)} />
  if (__DEV__ && sampleClip) return <>
    <View style={{ height: 330, borderRadius: 18, overflow: 'hidden' }}>
      <SceneBoundary label="Character preview unavailable">
        <CharacterPreview character={{ model: VARSITY }} clip={sampleClip} close={sampleClose}
          previewModel={require('../../assets/models/VarsityScan.glb')} />
      </SceneBoundary>
    </View>
    <Text style={s.copy}>Drag to rotate · Sample head scan by Lee Perry-Smith (CC BY 3.0)</Text>
    <View style={s.line}>{([['Idle','Idle'], ['Walk','Walk'], ['SwordSwipe','Sword swing'], ['Knockout','Knockout']] as const).map(([clip, label]) =>
      <Pressable key={clip} accessibilityRole="radio" accessibilityState={{ checked: clip === sampleClip }}
        style={[s.card, clip === sampleClip && { borderColor: '#ffc651' }]} onPress={() => {
          if (clip !== 'Idle') setSampleClose(false)
          setSampleClip(clip)
        }}>
        <Text style={s.copy}>{label}</Text>
      </Pressable>)}</View>
    <Action label={sampleClose ? 'Full body' : 'Close-up'} onPress={() => setSampleClose(v => !v)} />
    <Action label="Back to my character" onPress={() => setSampleClip(null)} />
  </>
  return <>
      <View style={{ height: 270, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0b1e38' }}>
        <SceneBoundary label="Character preview unavailable"><CharacterPreview character={draft} close={close} /></SceneBoundary>
      </View>
      <View style={[s.line, { justifyContent: 'space-between' }]}><Text style={s.copy}>Drag to rotate</Text>
        <Pressable accessibilityRole="button" onPress={() => setClose(v => !v)}><Text style={s.copy}>{close ? 'Full body' : 'Close-up'}</Text></Pressable></View>
      <View style={s.card}><Text style={s.heading}>Choose your character</Text>
        <View style={s.line}>{CREW.map((name, i) => {
          const model = i as CharacterModel
          const selected = !draft.avatarId && draft.model === model
          return <Pressable key={name} accessibilityRole="radio" accessibilityState={{ checked: selected }}
            onPress={() => {
              if (draft.avatarId || model !== draft.model) setDraft(model === VARSITY || draft.model === VARSITY ? { model } : { ...draft, model })
              setMessage('')
            }}
            style={{ padding: 10, borderWidth: 2, borderRadius: 12, borderColor: selected ? (model === VARSITY ? '#f0909b' : SEAT_HEX[model]) : '#355889', backgroundColor: '#0a2044' }}>
            <Text style={s.copy}>{name}</Text></Pressable>
        })}</View>
        {__DEV__ && draft.model === VARSITY && !draft.avatarId && <Action label="Preview 3D head sample" onPress={() => {
          setSampleClose(true); setSampleClip('Idle')
        }} />}
        <Action label="Create avatar from selfie" onPress={() => setCreating(true)} />
        {draft.face && <Pressable accessibilityRole="button" onPress={() => { setDraft({ model: draft.model }); setMessage('') }}>
          <Text style={s.copy}>Remove selfie</Text></Pressable>}
      </View>
      <Text style={s.copy}>{draft.avatarId ? 'Your MetaPerson avatar' : 'Your selected character'} will be visible to players at your table when equipped.</Text>
      <Action label={isEquipped ? 'Equipped' : 'Equip for matches'}
        disabled={isEquipped}
        onPress={() => { equip(draft); setMessage((draft.avatarId ? 'MetaPerson' : CREW[draft.model]) + ' equipped for your next match.') }} />
      {equipped && <Pressable accessibilityRole="button" onPress={() => { equip(null); setDraft({ model: VARSITY }); setMessage('Your seat’s default character is equipped.') }}>
        <Text style={s.copy}>Reset to seat character</Text></Pressable>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
  </>
}

export default function CharacterScreen() {
  const hydrated = useIdentity(s => s.hydrated)
  return <ArcadePage title="My character">{hydrated ? <Editor /> : <Text style={s.copy}>Loading character…</Text>}</ArcadePage>
}
