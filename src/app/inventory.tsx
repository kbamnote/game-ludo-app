import { Text, View } from 'react-native'
import { ArcadePage, Action, s } from '../ui/ArcadePage'
import { Coin, Gem, Pawn } from '../ui/ArcadeIcons'
import { BADGES, useProfile } from '../game/profile'

export default function Inventory() {
  const { coins, gems, badge, ownedBadges, equipBadge } = useProfile()
  return <ArcadePage title="Inventory" art="inventory">
    <View style={[s.card, s.line]}><Coin /><Text style={s.heading}>{coins.toLocaleString()}</Text><Gem /><Text style={s.heading}>{gems.toLocaleString()}</Text></View>
    <Text style={s.heading}>Lobby pawns</Text>
    <Text style={s.copy}>Equip a pawn for your home avatar. Unlocked colours stay in your collection.</Text>
    {BADGES.map((item) => {
      const owned = ownedBadges.includes(item.id)
      const selected = badge === item.id
      return <View key={item.id} style={[s.card, s.line, selected && { borderColor: '#dcb659' }]}>
        <View style={s.medal}><Pawn size={34} color={item.color} dark={item.dark} /></View>
        <View style={{ flex: 1, minWidth: 105 }}><Text style={s.heading}>{item.name}</Text><Text style={s.copy}>{owned ? 'In collection' : item.price + ' coins'}</Text></View>
        <Action label={selected ? 'Equipped' : owned ? 'Equip' : coins < item.price ? 'Need coins' : 'Unlock'} disabled={selected || (!owned && coins < item.price)} onPress={() => equipBadge(item.id)} />
      </View>
    })}
  </ArcadePage>
}
