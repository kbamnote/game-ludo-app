import { useState } from 'react'
import { router } from 'expo-router'
import { Text, View } from 'react-native'
import { Action, ArcadePage, MenuRow, s, useClock } from '../ui/ArcadePage'
import { Coin, SpinEmblem, TrophyEmblem } from '../ui/ArcadeIcons'
import { formatCountdown, MILESTONES, spinReady, useProfile } from '../game/profile'

export default function Events() {
  const { nextChestAt, claimChest, lastSpinAt, cupRound, cupWins, seasonPoints, claimedMilestones, claimMilestone } = useProfile()
  const [claimed, setClaimed] = useState(0)
  const now = useClock()
  const ready = now >= nextChestAt
  return <ArcadePage title="Arcade events">
    <View style={s.card}><View style={s.line}><Coin size={50} /><View style={{ flex: 1 }}>
      <Text style={s.heading}>Treasure chest</Text><Text style={s.copy}>Collect 250–999 coins every three hours.</Text>
    </View></View>
    <Action label={ready ? 'Open chest' : `Unlocks in ${formatCountdown(nextChestAt - now)}`} disabled={!ready} onPress={() => setClaimed(claimChest())} />
    {claimed > 0 && <Text style={s.notice}>Collected {claimed} coins</Text>}</View>
    <MenuRow art={<SpinEmblem />} title="Daily wheel" detail={spinReady(lastSpinAt) ? 'Your free spin is ready.' : 'See your spin reward and next unlock.'} onPress={() => router.push('/spin')} />
    <MenuRow art={<TrophyEmblem />} title="Midnight Cup" detail={`Round ${cupRound + 1} of 3 · ${cupWins} cups won`} onPress={() => router.push('/tournament')} />
    <View style={s.card}><Text style={s.heading}>Season 28 · {seasonPoints} points</Text>
      <Text style={s.copy}>Earn one point for each wheel spin, Lucky roll or cup-round win.</Text>
      {MILESTONES.map(({ goal, gems }) => {
        const claimed = claimedMilestones.includes(goal)
        return <Action key={goal} label={`${goal} points · ${gems} gems${claimed ? ' · Claimed' : seasonPoints >= goal ? ' · Claim' : ''}`}
          disabled={claimed || seasonPoints < goal} onPress={() => claimMilestone(goal)} />
      })}
    </View>
  </ArcadePage>
}
