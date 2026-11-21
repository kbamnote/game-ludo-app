import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { AccessibilityInfo, Keyboard, type ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import Pressable from '../ui/SoundPressable'
import { LinearGradient } from 'expo-linear-gradient'
import { Action, ArcadePage, s } from '../ui/ArcadePage'
import ArcadeArt from '../ui/ArcadeArt'
import DieTumble from '../ui/DieTumble'
import { LUCKY_PAYOUTS, type LuckyGuess, useProfile } from '../game/profile'

const guesses: LuckyGuess[] = ['Under 7', 'Exactly 7', 'Over 7']
const presets = [50, 100, 250, 500]
const ROLL_MS = 820

export default function LuckySeven() {
  const { coins, luckyRolls, rollLucky } = useProfile()
  const [guess, setGuess] = useState<LuckyGuess>('Exactly 7')
  const [amount, setAmount] = useState(() => String(Math.min(100, Math.max(1, coins))))
  const [result, setResult] = useState<ReturnType<typeof rollLucky>>(null)
  const [error, setError] = useState('')
  const [rollStart, setRollStart] = useState<number | null>(null)
  const [progress, setProgress] = useState(1)
  const [reduceMotion, setReduceMotion] = useState(true)
  const spinning = useRef(false)
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const { width } = useWindowDimensions()
  const diceSize = Math.min(136, Math.floor((width - 68) / 2))
  const rolling = rollStart !== null
  const [left, right] = result?.dice ?? [3, 4]
  const balance = rolling && result ? coins - result.reward : coins
  const freeRolls = luckyRolls + Number(rolling && result?.stake === 0)
  const stake = /^\d+$/.test(amount) ? Number(amount) : 0
  const payout = stake * LUCKY_PAYOUTS[guess]
  const validStake = Number.isSafeInteger(stake) && stake > 0
  const affordable = validStake && stake <= balance
  const safePayout = Number.isSafeInteger(payout) && Number.isSafeInteger(balance - stake + payout)
  const net = result ? result.reward - result.stake : 0

  useEffect(() => {
    let current = true
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      current = false
      setReduceMotion(value)
    })
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (current) setReduceMotion(value)
    }).catch(() => {})
    return () => { current = false; subscription.remove() }
  }, [])

  useEffect(() => {
    if (rollStart === null) return
    const startedAt = rollStart
    function tick() {
      const next = reduceMotion ? 1 : Math.min(1, (Date.now() - startedAt) / ROLL_MS)
      setProgress(next)
      if (next < 1) frame = requestAnimationFrame(tick)
      else {
        spinning.current = false
        setRollStart(null)
      }
    }
    let frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion, rollStart])

  function roll(stakeForRoll: number) {
    if (spinning.current) return
    const next = rollLucky(guess, stakeForRoll)
    if (!next) {
      setError('This spin is unavailable. Check your balance or free rolls.')
      return
    }
    setError('')
    setResult(next)
    Keyboard.dismiss()
    scroll.current?.scrollTo({ y: 0, animated: !reduceMotion })
    if (!reduceMotion) {
      spinning.current = true
      setProgress(0)
      setRollStart(Date.now())
    }
  }

  return <ArcadePage title="Lucky 7" art="lucky7" scrollRef={scroll} footer={<View style={styles.actions}>
    <Action label={rolling ? 'Spinning…' : affordable && safePayout ? `Spin dice · ${stake.toLocaleString()} coins` : 'Spin dice'}
      disabled={rolling || !affordable || !safePayout} icon={<ArcadeArt name="lucky7" size={22} />} onPress={() => roll(stake)} />
    {freeRolls > 0 && <Action label={`Use free roll (${freeRolls})`} secondary disabled={rolling} onPress={() => roll(0)} />}
  </View>}>
    <LinearGradient colors={['#244d8e', '#0e2955', '#081b3d']} style={styles.table}>
      <Text style={styles.tableTitle}>The dice table</Text>
      <View style={styles.dice} accessible={!rolling} accessibilityLabel={rolling ? undefined : `Dice showing ${left} and ${right}`}>
        <LinearGradient pointerEvents="none" colors={['#143c63', '#0c2141']} style={styles.felt} />
        <View style={styles.dicePair}>
          <DieTumble progress={progress} value={left} color="#ffedc2" pipColor="#172c55" tableSize={diceSize} />
          <DieTumble progress={Math.min(1, progress * 1.12)} value={right} color="#2e63c0" pipColor="#fff5dc" tableSize={diceSize} direction={-1} />
        </View>
      </View>
      <Text accessibilityLiveRegion="polite" style={s.notice}>{rolling ? 'Spinning the dice…' : result ?
        `Total ${left + right} · ${net ? (net > 0 ? '+' : '−') + Math.abs(net).toLocaleString() + ' coins' : 'No prize this roll'}` : 'Predict the total of two dice.'}</Text>
    </LinearGradient>
    <View style={s.card}>
      <View style={s.line}>
        <Text style={[s.heading, { flex: 1 }]}>Coin stake</Text>
        <Text style={s.copy}>{balance.toLocaleString()} coins available</Text>
      </View>
      <View style={styles.presets}>
        {presets.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityLabel={`${value} coins`}
          aria-checked={stake === value} disabled={rolling || value > balance} onPress={() => setAmount(String(value))}
          style={[styles.preset, stake === value && styles.selected, value > balance && styles.unavailable]}>
          <Text style={s.copy}>{value}</Text>
        </Pressable>)}
      </View>
      <TextInput accessibilityLabel="Custom coin stake" placeholder="Enter coin amount" placeholderTextColor="#a7bbd8"
        inputMode="numeric" maxLength={16} editable={!rolling} value={amount} onChangeText={setAmount} style={s.input} />
      {!rolling && (!affordable || !safePayout) && <Text accessibilityLiveRegion="polite" style={s.copy}>
        {!validStake ? 'Enter a whole number of coins above zero.' : !affordable ? 'Your stake is above your coin balance.' : 'Choose a smaller coin stake.'}
      </Text>}
    </View>
    <View style={s.card}><Text style={s.heading}>Pick your prediction</Text>
      {guesses.map((choice) => <Pressable key={choice} accessibilityRole="radio" aria-checked={guess === choice} disabled={rolling} onPress={() => setGuess(choice)}
        style={[s.row, guess === choice && styles.selected]}>
        <View style={[styles.radio, guess === choice && styles.radioSelected]} />
        <Text style={[s.copy, { flex: 1 }]}>{choice}</Text><Text style={s.notice}>{LUCKY_PAYOUTS[choice]}× stake</Text>
      </Pressable>)}
      {affordable && safePayout && <Text style={s.copy}>Correct prediction returns {payout.toLocaleString()} coins, including your stake.</Text>}
      {freeRolls > 0 && <Text style={s.copy}>Free roll prizes are 100 coins for Under or Over, or 300 for Exactly 7.</Text>}
    </View>
    {!!error && <Text accessibilityLiveRegion="polite" style={s.notice}>{error}</Text>}
  </ArcadePage>
}

const styles = StyleSheet.create({
  table: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, borderRadius: 21, borderWidth: 1,
    borderColor: '#e6bf63', borderBottomWidth: 4, borderBottomColor: '#98713d' },
  tableTitle: { ...s.heading, color: '#fff3ca', fontSize: 22 },
  dice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  dicePair: { flexDirection: 'row', zIndex: 1 },
  felt: { position: 'absolute', width: '88%', bottom: 5, height: 45, borderRadius: 90, borderWidth: 1, borderColor: '#b88b49', borderBottomWidth: 3, borderBottomColor: '#684624' },
  actions: { gap: 7 },
  presets: { flexDirection: 'row', gap: 6 },
  preset: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderColor: '#537ab1', borderWidth: 1, borderRadius: 10, backgroundColor: '#193b6c' },
  unavailable: { opacity: .48 },
  selected: { borderColor: '#ffd06c', backgroundColor: '#23497d' },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#90aed9' },
  radioSelected: { backgroundColor: '#ffd06c', borderColor: '#fff2c2' },
})
