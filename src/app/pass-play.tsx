import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Action, ArcadePage, TableArt, s } from '../ui/ArcadePage'
import { Pawn } from '../ui/ArcadeIcons'
import { SEAT_HEX, type Seat } from '../game/rules'
import { openTable } from '../game/localTable'
import { useIdentity } from '../game/identity'

export default function PassPlay() {
  const [count, setCount] = useState(2)
  const [names, setNames] = useState([useIdentity.getState().name, '', '', ''])
  return <ArcadePage title="Pass & play">
    <TableArt title="One phone" subtitle="Pass the phone when the turn changes." />
    <View style={s.card}><Text style={s.heading}>Players at the table</Text>
      <View style={s.line}>{[2, 3, 4].map((n) => <Pressable key={n} accessibilityRole="button"
        accessibilityState={{ selected: count === n }} onPress={() => setCount(n)}
        style={[s.back, count === n && { borderColor: '#ffcf64', backgroundColor: '#345487' }]}><Text style={s.heading}>{n}</Text></Pressable>)}</View>
      {names.slice(0, count).map((name, i) => <View key={i} style={s.line}>
        <Pawn color={SEAT_HEX[i as Seat]} dark="#14264c" size={25} />
        <TextInput accessibilityLabel={`Player ${i + 1} name`} placeholder={`Player ${i + 1}`} placeholderTextColor="#aac1df"
          maxLength={16} style={[s.input, { flex: 1 }]} value={name}
          onChangeText={(value) => setNames((prev) => prev.map((old, index) => index === i ? value : old))} />
      </View>)}
    </View>
    <Action label="Start local match" onPress={() => openTable(names.slice(0, count).map((name, i) => ({
      seat: i as Seat, name: name.trim() || `Player ${i + 1}`, kind: 'human',
    })))} />
  </ArcadePage>
}
