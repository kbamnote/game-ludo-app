import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { ArcadePage, MenuRow, s, useClock } from '../ui/ArcadePage'
import ArcadeArt from '../ui/ArcadeArt'
import { formatCountdown, MILESTONES, SPIN_COOLDOWN, useProfile } from '../game/profile'

export default function Inbox() {
  const { nextChestAt, lastSpinAt, claimedMilestones, seasonPoints } = useProfile()
  const now = useClock()
  const pending = MILESTONES.filter((m) => seasonPoints >= m.goal && !claimedMilestones.includes(m.goal)).length
  return <ArcadePage title="Reward inbox" art="inbox">
    <View style={s.card}><Text style={s.heading}>At your table</Text><Text style={s.copy}>Reward availability for this player profile.</Text></View>
    <MenuRow art={<ArcadeArt name="spin" />} title="Daily spin" detail={now >= lastSpinAt + SPIN_COOLDOWN ? 'A free spin is waiting.' : 'Next spin in ' + formatCountdown(lastSpinAt + SPIN_COOLDOWN - now)} onPress={() => router.push('/spin')} />
    <MenuRow art={<ArcadeArt name="inventory" />} title="Treasure chest" detail={now >= nextChestAt ? 'Ready to collect.' : 'Unlocks in ' + formatCountdown(nextChestAt - now)} onPress={() => router.push('/events')} />
    <MenuRow art={<ArcadeArt name="events" />} title="Season rewards" detail={pending ? pending + ' rewards ready to claim.' : seasonPoints + ' points earned this season.'} onPress={() => router.push('/events')} />
  </ArcadePage>
}
