import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { Action, ArcadePage, MenuRow, TableArt, s } from '../ui/ArcadePage'
import { HeartsEmblem } from '../ui/ArcadeIcons'
import { useOnline } from '../net/online'
import FriendsScreen from '../screens/FriendsScreen'

export default function Online() {
  const { room, createRoom, busy, error } = useOnline()
  if (room) return <FriendsScreen />
  return <ArcadePage title="Online play">
    <TableArt title="Open tables" subtitle="Classic Ludo for 2–4 players." />
    <View style={s.card}><Text style={s.heading}>Take a seat</Text>
      <Text style={s.copy}>Join an open table or host the next one. Once everyone is ready, the host starts the game.</Text>
      <Action label={busy ? 'Finding a table…' : 'Find a public table'} disabled={busy} onPress={() => void createRoom(true)} />
      {!!error && <Text accessibilityLiveRegion="polite" style={s.notice}>{error}</Text>}
    </View>
    <MenuRow art={<HeartsEmblem />} title="Play with friends" detail="Create a private table or use a room code." onPress={() => router.push('/friends')} />
  </ArcadePage>
}
