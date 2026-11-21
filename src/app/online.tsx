import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { Text, View } from 'react-native'
import { Action, ArcadePage, MenuRow, TableArt, s } from '../ui/ArcadePage'
import ArcadeArt from '../ui/ArcadeArt'
import { useOnline } from '../net/online'
import FriendsScreen from '../screens/FriendsScreen'
import CoinEntryPicker from '../ui/CoinEntryPicker'
import type { CoinEntry } from '../game/matchEntry'
import { refreshOnlineCoins, useAccount } from '../net/account'

export default function Online() {
  const { room, createRoom, busy, error } = useOnline()
  const balance = useAccount(state => state.session?.account.coins ?? 0)
  const [entry, setEntry] = useState<CoinEntry | null>(null)
  useFocusEffect(useCallback(() => { void refreshOnlineCoins() }, []))
  if (room) return <FriendsScreen />
  return <ArcadePage title="Online play" art="online">
    <TableArt art="online" title="Open tables" subtitle="Classic Ludo for 2–4 players." />
    <View style={s.card}>
      <CoinEntryPicker selected={entry} balance={balance} onSelect={setEntry} busy={busy} />
      <Text style={s.copy}>Your entry is charged when the match starts.</Text>
      <Action label={busy ? 'Finding a table…' : 'Find a public table'} disabled={busy || entry === null || entry > balance}
        onPress={() => { if (entry !== null) void createRoom(true, entry) }} />
      {!!error && <Text accessibilityLiveRegion="polite" style={s.notice}>{error}</Text>}
    </View>
    <MenuRow art={<ArcadeArt name="friends" />} title="Play with friends" detail="Create a private table or use a room code." onPress={() => router.push('/friends')} />
  </ArcadePage>
}
