import { Text, View } from 'react-native'
import { ArcadePage, TableArt, Action, s } from '../ui/ArcadePage'
import ArcadeArt from '../ui/ArcadeArt'
import { CUP_ROUNDS, useProfile } from '../game/profile'
import { CUP_RIVALS, openTable } from '../game/localTable'
import { useIdentity } from '../game/identity'
import Icon from '../ui/Icon'

export default function Tournament() {
  const round = useProfile((p) => p.cupRound)
  const wins = useProfile((p) => p.cupWins)
  const name = useIdentity((p) => p.name)
  const rival = CUP_RIVALS[round]
  return <ArcadePage title="Tournament" art="tournament">
    <TableArt art="tournament" title="Midnight Cup" subtitle="Win three solo duels to take the trophy." />
    <View style={[s.card, s.line]}><ArcadeArt name="tournament" /><View style={{ flex: 1 }}><Text style={s.heading}>1,000 coin prize</Text><Text style={s.copy}>Cups won · {wins}</Text></View></View>
    <View style={s.card}><Text style={s.heading}>Cup ladder</Text>
      {CUP_ROUNDS.map((stage, i) => <View key={stage} style={s.line}>
        <Icon name={i < round ? 'check-circle' : i === round ? 'play-circle-filled' : 'lock'} color={i <= round ? '#ffd47a' : '#93a8c5'} />
        <Text style={[s.copy, { flex: 1 }]}>{stage}</Text><Text style={s.heading}>{CUP_RIVALS[i].name}</Text>
      </View>)}
      <Text style={s.copy}>A win advances you. A loss starts a new cup. Leaving a round lets you replay it.</Text>
    </View>
    <Action label={`Play ${CUP_ROUNDS[round].toLowerCase()}`} onPress={() => openTable([
      { seat: 0, name, kind: 'human' }, { seat: 2, name: rival.name, kind: 'bot', difficulty: rival.difficulty },
    ], round)} />
  </ArcadePage>
}
