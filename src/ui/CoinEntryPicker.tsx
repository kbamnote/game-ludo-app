import { StyleSheet, Text, View } from 'react-native'
import Pressable from './SoundPressable'
import { s } from './ArcadePage'
import { Coin } from './ArcadeIcons'
import { ENTRY_TIERS, type CoinEntry } from '../game/matchEntry'

export default function CoinEntryPicker({ selected, balance, onSelect, busy = false }: {
  selected: CoinEntry | null; balance: number; onSelect: (value: CoinEntry) => void; busy?: boolean
}) {
  return <View style={styles.entry}>
    <View style={s.line}>
      <Coin size={28} />
      <Text accessibilityRole="header" style={[s.heading, { flex: 1 }]}>Entry per player</Text>
    </View>
    <Text style={s.copy}>{balance.toLocaleString()} online coins available</Text>
    <View style={styles.tiers}>
      {ENTRY_TIERS.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} coin entry`}
        aria-checked={selected === value} disabled={busy || value > balance} onPress={() => onSelect(value)}
        style={[styles.tier, selected === value && styles.selected, value > balance && styles.unavailable]}>
        <Text style={styles.amount}>{value.toLocaleString()}</Text>
      </Pressable>)}
    </View>
    {selected !== null && <Text style={s.notice} accessibilityLiveRegion="polite">
      Prize pool {(selected * 2).toLocaleString()}–{(selected * 4).toLocaleString()} coins
    </Text>}
    {balance < ENTRY_TIERS[0] && <Text style={s.copy}>You need at least {ENTRY_TIERS[0]} online coins to enter.</Text>}
  </View>
}

const styles = StyleSheet.create({
  entry: { gap: 8 },
  tiers: { flexDirection: 'row', gap: 5 },
  tier: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#668ac0', borderBottomWidth: 3, borderRadius: 9,
    backgroundColor: '#143564', alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: '#ffd681', backgroundColor: '#31578a' },
  unavailable: { opacity: .45 },
  amount: { ...s.copy, color: '#fff3d3', fontSize: 13 },
})
