import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Text, View } from 'react-native'
import { ArcadePage, Action, MenuRow, s, useClock } from '../ui/ArcadePage'
import { Die } from '../ui/ArcadeIcons'
import PrizeWheel from '../ui/PrizeWheel'
import { router } from 'expo-router'
import { SPIN_COOLDOWN, WHEEL_PRIZES, formatCountdown, spinReady, useProfile } from '../game/profile'

export default function Spin() {
  const { lastSpinAt, lastSpinPrize, spinWheel, animateWheel } = useProfile()
  const now = useClock()
  const initial = Math.max(0, WHEEL_PRIZES.indexOf(lastSpinPrize))
  const angle = useRef(new Animated.Value(-initial * 60)).current
  const [spinning, setSpinning] = useState(false)
  useEffect(() => () => angle.stopAnimation(), [angle])
  useEffect(() => {
    if (!spinning) angle.setValue(-initial * 60)
  }, [angle, initial, spinning])
  const play = () => {
    const index = spinWheel()
    if (index === null) return
    if (!animateWheel) { angle.setValue(-index * 60); return }
    setSpinning(true)
    Animated.timing(angle, { toValue: 1440 - index * 60, duration: 2300, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => { if (finished) setSpinning(false) })
  }
  const ready = spinReady(lastSpinAt)
  return <ArcadePage title="Daily spin">
    <View style={[s.card, s.center, { paddingVertical: 24 }]}>
      <Text style={s.heading}>The gold wheel</Text><PrizeWheel angle={angle} />
      <Text accessibilityLiveRegion="polite" style={s.notice}>{spinning ? 'Spinning…' : lastSpinPrize ? `Last spin · ${lastSpinPrize} coins + 1 Lucky roll` : 'Every spin wins coins and a Lucky roll.'}</Text>
    </View>
    <Action label={ready ? 'Take your free spin' : `Next spin in ${formatCountdown(lastSpinAt + SPIN_COOLDOWN - now)}`} disabled={!ready || spinning} onPress={play} />
    <MenuRow art={<Die />} title="Lucky 7" detail="Use your roll at the dice table." onPress={() => router.push('/lucky7')} />
  </ArcadePage>
}
