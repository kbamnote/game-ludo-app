import { memo, useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import type { DiceRoll } from '../game/store'
import { SEAT_HEX, type Seat } from '../game/rules'
import { C } from '../theme'
import DieTumble, { DIE_PIPS } from './DieTumble'
import DiceRollFrames, { diceRollProgress, warmDiceFrames } from './DiceRollFrames'

export default memo(function MatchDice({ seat, value, animation, paused, canRoll, onRoll }: {
  seat: Seat
  value: number
  animation: DiceRoll | null
  paused: boolean
  canRoll: boolean
  onRoll: () => void
}) {
  const [finishedRoll, setFinishedRoll] = useState<DiceRoll | null>(null)
  const [readyRoll, setReadyRoll] = useState<DiceRoll | null>(null)
  useEffect(() => warmDiceFrames(seat), [seat])
  const markReady = useCallback(() => setReadyRoll(animation), [animation])
  const rolling = animation !== null && animation !== finishedRoll && diceRollProgress(animation) < 1
  const displaySeat = rolling ? animation.seat : seat
  const enabled = canRoll && !paused && !rolling
  const face = DIE_PIPS[value]?.length ? value : 6
  const color = SEAT_HEX[displaySeat]
  const pipColor = displaySeat === 1 || displaySeat === 2 ? '#182236' : '#fffbf1'
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={enabled ? 'Roll dice' : rolling ? 'Rolling dice' : `Dice showing ${face}`}
    accessibilityState={{ disabled: !enabled, busy: rolling }}
    disabled={!enabled}
    onPress={onRoll}
    style={({ pressed }) => [styles.button, enabled && { borderColor: color }, pressed && styles.pressed]}
  >
    <View pointerEvents="none" style={styles.tumble}>
      {(!rolling || readyRoll !== animation) && <DieTumble progress={0} value={face} color={color} pipColor={pipColor} />}
      {rolling && <DiceRollFrames key={animation.startedAt} roll={animation} paused={paused}
        onFinish={setFinishedRoll} onReady={markReady} />}
    </View>
  </Pressable>
})

const styles = StyleSheet.create({
  button: {
    width: 71, height: 71, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.arenaHighest, backgroundColor: C.arenaHigh,
  },
  pressed: { transform: [{ scale: .94 }] },
  tumble: { position: 'absolute', left: '50%', top: '50%', width: 112, height: 132, marginLeft: -56, marginTop: -87 },
})
