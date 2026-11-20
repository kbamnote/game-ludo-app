import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { LOCAL_DICE_ROLL_MS, ONLINE_DICE_ROLL_MS } from '../game/moveTiming'
import { SEAT_HEX, type Seat } from '../game/rules'
import { C } from '../theme'
import DieTumble, { DIE_PIPS } from './DieTumble'
const POSITIONS = [13, 26, 39]

export default function MatchDice({ seat, value, rolling, rollUntil = 0, canRoll, onRoll }: {
  seat: Seat
  value: number
  rolling: boolean
  rollUntil?: number
  canRoll: boolean
  onRoll: () => void
}) {
  const [tumble, setTumble] = useState<{ progress: number; rollUntil: number } | null>(null)
  useEffect(() => {
    const now = Date.now()
    const duration = rolling ? LOCAL_DICE_ROLL_MS : ONLINE_DICE_ROLL_MS
    const endsAt = rolling ? now + duration : rollUntil
    if (endsAt <= now) return

    function update() {
      const remaining = endsAt - Date.now()
      if (remaining <= 0) {
        setTumble(null)
        return
      }
      setTumble({ progress: Math.max(0, 1 - remaining / duration), rollUntil })
      frame = requestAnimationFrame(update)
    }
    let frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [rolling, rollUntil])

  const animation = rolling || (rollUntil > 0 && tumble?.rollUntil === rollUntil) ? tumble : null
  const face = DIE_PIPS[value]?.length ? value : 6
  const color = SEAT_HEX[seat]
  const pipColor = seat === 1 || seat === 2 ? '#182236' : '#fffbf1'
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={canRoll ? 'Roll dice' : `Dice showing ${face}`}
    accessibilityState={{ disabled: !canRoll, busy: animation !== null }}
    disabled={!canRoll}
    onPress={onRoll}
    style={({ pressed }) => [styles.button, canRoll && { borderColor: color }, pressed && styles.pressed]}
  >
    {animation ? <View pointerEvents="none" style={styles.tumble}>
      <DieTumble progress={animation.progress} value={face} color={color} pipColor={pipColor} />
    </View> : <View pointerEvents="none" style={[styles.die, { backgroundColor: color }]}>
        <LinearGradient colors={['#ffffff35', '#250e2b38']} style={StyleSheet.absoluteFill} />
        {DIE_PIPS[face].map(pip => <View key={pip} style={[styles.pip, {
          left: POSITIONS[pip % 3],
          top: POSITIONS[Math.floor(pip / 3)],
          backgroundColor: pipColor,
        }]} />)}
      </View>}
  </Pressable>
}

const styles = StyleSheet.create({
  button: {
    width: 71, height: 71, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.arenaHighest, backgroundColor: C.arenaHigh,
  },
  pressed: { transform: [{ scale: .94 }] },
  tumble: { position: 'absolute', left: '50%', top: '50%', marginLeft: -56, marginTop: -87 },
  die: {
    width: 52, height: 52, borderRadius: 13, borderColor: '#ffffff55', borderWidth: 1,
    borderBottomWidth: 4, borderBottomColor: '#250e2b65', overflow: 'hidden',
  },
  pip: {
    position: 'absolute', width: 7, height: 7, borderRadius: 4,
    marginLeft: -3.5, marginTop: -3.5,
  },
})
