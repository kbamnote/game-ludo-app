import { router } from 'expo-router'
import { ArcadePage, MenuRow, TableArt } from '../ui/ArcadePage'
import { GlobeEmblem, HeartsEmblem, PassPlayEmblem, VsEmblem } from '../ui/ArcadeIcons'
import { practice } from '../game/localTable'

export default function Modes() {
  return <ArcadePage title="Game modes">
    <TableArt title="Pick a table" subtitle="Classic Ludo, four ways to play." />
    <MenuRow art={<GlobeEmblem />} title="Public table" detail="Find other online players." onPress={() => router.push('/online')} />
    <MenuRow art={<HeartsEmblem />} title="Friends room" detail="Invite friends with a six-digit code." onPress={() => router.push('/friends')} />
    <MenuRow art={<PassPlayEmblem />} title="Pass & play" detail="Share one phone with up to four players." onPress={() => router.push('/pass-play')} />
    <MenuRow art={<VsEmblem />} title="Computer" detail="Play solo against three rivals." onPress={practice} />
  </ArcadePage>
}
