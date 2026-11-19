import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Switch, Text, TextInput, View } from 'react-native'
import { Action, ArcadePage, MenuRow, s } from '../ui/ArcadePage'
import { Pawn } from '../ui/ArcadeIcons'
import { BADGES, useProfile } from '../game/profile'
import { useIdentity } from '../game/identity'
import { CREW } from '../game/character'

export default function Profile() {
  const { name, setName, hydrated, character } = useIdentity()
  const { badge, animateWheel, toggleWheel, level } = useProfile()
  const pawn = BADGES.find((item) => badge === item.id) ?? BADGES[0]
  const [draft, setDraft] = useState(name)
  useEffect(() => setDraft(name), [name])
  return <ArcadePage title="Player settings">
    <View style={s.card}><View style={s.line}><Pawn size={42} color={pawn.color} dark={pawn.dark} />
      <View><Text style={s.heading}>{name}</Text><Text style={s.copy}>Level {level}</Text></View></View>
      <Text style={s.copy}>Name at the table</Text>
      <TextInput accessibilityLabel="Player name" value={draft} onChangeText={setDraft} maxLength={16} style={s.input} />
      <Action label={name === draft.trim() ? 'Name saved' : 'Save name'} disabled={!hydrated || !draft.trim() || draft.trim() === name}
        onPress={() => setName(draft)} />
    </View>
    <MenuRow art={<Pawn size={28} color={pawn.color} dark={pawn.dark} />} title="My character"
      detail={character ? (character.avatarId ? 'MetaPerson' : CREW[character.model]) + ' equipped' : 'Choose a character or create your 3D avatar'} onPress={() => router.push('/character')} />
    <View style={[s.card, s.line]}><Text style={[s.copy, { flex: 1 }]}>Animate the prize wheel</Text>
      <Switch accessibilityLabel="Animate the prize wheel" value={animateWheel} onValueChange={toggleWheel} /></View>
    <MenuRow art={<Pawn size={25} color={pawn.color} dark={pawn.dark} />} title="Change lobby pawn" detail={pawn.name + ' equipped'} onPress={() => router.push('/inventory')} />
  </ArcadePage>
}
