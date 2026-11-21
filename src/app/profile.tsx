import ArcadeArt from '../ui/ArcadeArt'
import { useState } from 'react'
import { router } from 'expo-router'
import { Switch, Text, TextInput, View } from 'react-native'
import { Action, ArcadePage, MenuRow, s } from '../ui/ArcadePage'
import { Pawn } from '../ui/ArcadeIcons'
import { BADGES, useProfile } from '../game/profile'
import { useIdentity } from '../game/identity'
import { characterName } from '../game/metapersonRoster'
import { logOut } from '../net/account'
import { useOnline } from '../net/online'
import Icon from '../ui/Icon'

export default function Profile() {
  const { name, setName, hydrated, character } = useIdentity()
  const { badge, animateWheel, toggleWheel, level, soundMuted, setSoundMuted } = useProfile()
  const pawn = BADGES.find((item) => badge === item.id) ?? BADGES[0]
  const [edit, setEdit] = useState<{ original: string; value: string } | null>(null)
  const draft = edit?.original === name ? edit.value : name
  const [leaving, setLeaving] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function signOut() {
    setLeaving(true)
    setLogoutError('')
    try {
      await logOut()
      useOnline.getState().disconnect()
      router.replace('/onboarding')
    } catch {
      setLogoutError('Could not log out. Please try again.')
      setLeaving(false)
    }
  }

  return <ArcadePage title="Player settings" art="profile">
    <View style={s.card}><View style={s.line}><Pawn size={42} color={pawn.color} dark={pawn.dark} />
      <View><Text style={s.heading}>{name}</Text><Text style={s.copy}>Level {level}</Text></View></View>
      <Text style={s.copy}>Name at the table</Text>
      <TextInput accessibilityLabel="Player name" value={draft} onChangeText={value => setEdit({ original: name, value })} maxLength={16} style={s.input} />
      <Action label={name === draft.trim() ? 'Name saved' : 'Save name'} disabled={!hydrated || !draft.trim() || draft.trim() === name}
        onPress={() => { setName(draft); setEdit(null) }} />
    </View>
    <MenuRow art={<ArcadeArt name="character" />} title="My character"
      detail={character ? characterName(character) + ' equipped' : 'Choose a character or create your 3D avatar'} onPress={() => router.push('/character')} />
    <View style={[s.card, s.line]}><Text style={[s.copy, { flex: 1 }]}>Animate the prize wheel</Text>
      <Switch accessibilityLabel="Animate the prize wheel" value={animateWheel} onValueChange={toggleWheel} /></View>
    <View style={[s.card, s.line]}><Text style={[s.copy, { flex: 1 }]}>Game audio</Text>
      <Switch accessibilityLabel="Game audio" value={!soundMuted} onValueChange={enabled => setSoundMuted(!enabled)} /></View>
    <MenuRow art={<Pawn size={25} color={pawn.color} dark={pawn.dark} />} title="Change lobby pawn" detail={pawn.name + ' equipped'} onPress={() => router.push('/inventory')} />
    <MenuRow art={<ArcadeArt name="help" />} title="How to play" detail="Ludo rules and private rooms" onPress={() => router.push('/help')} />
    <Action label={leaving ? 'Logging out…' : 'Log out'} icon={<Icon name="logout" size={18} color="#372508" />}
      disabled={leaving} onPress={() => void signOut()} />
    {!!logoutError && <Text accessibilityLiveRegion="polite" style={s.notice}>{logoutError}</Text>}
  </ArcadePage>
}
