import { useState } from 'react'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import { Die } from '../ui/ArcadeIcons'
import { type LuckyGuess, useProfile } from '../game/profile'

const guesses: LuckyGuess[] = ['Under 7', 'Exactly 7', 'Over 7']

export default function LuckySeven() {
  const { luckyRolls, rollLucky } = useProfile()
  const [guess, setGuess] = useState<LuckyGuess>('Exactly 7')
  const [result, setResult] = useState<ReturnType<typeof rollLucky>>(null)
  return <ArcadePage title="Lucky 7">
    <View style={[s.card, s.center, { paddingVertical: 24, backgroundColor: '#124e50', borderColor: '#60a995' }]}>
      <Text style={s.heading}>The dice table</Text>
      <View style={[s.line, { marginVertical: 12 }]}><Die size={78} pips={result?.dice[0] ?? 3} rotate={-9} /><Die size={78} pips={result?.dice[1] ?? 4} rotate={8} /></View>
      <Text accessibilityLiveRegion="polite" style={s.notice}>{result ? `Total ${result.dice[0] + result.dice[1]} · ${result.reward ? '+' + result.reward + ' coins' : 'No prize this roll'}` : 'Predict the total of two dice.'}</Text>
    </View>
    <View style={s.card}><Text style={s.heading}>Pick your prediction</Text>
      {guesses.map((choice) => <Pressable key={choice} accessibilityRole="radio" accessibilityState={{ checked: guess === choice }} onPress={() => setGuess(choice)}
        style={[s.row, guess === choice && { borderColor: '#ffd06c' }]}>
        <Text style={[s.copy, { flex: 1 }]}>{choice}</Text><Text style={s.notice}>{choice === 'Exactly 7' ? '300' : '100'} coins</Text>
      </Pressable>)}
      <Text style={s.copy}>{luckyRolls} Lucky {luckyRolls === 1 ? 'roll' : 'rolls'} available</Text>
    </View>
    {luckyRolls > 0 ? <Action label="Roll the dice" onPress={() => setResult(rollLucky(guess))} /> :
      <Action label="Visit daily spin for a roll" onPress={() => router.push('/spin')} />}
  </ArcadePage>
}
