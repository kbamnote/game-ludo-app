import { router } from 'expo-router'
import { ArcadePage, MenuRow, TableArt } from '../ui/ArcadePage'
import ArcadeArt from '../ui/ArcadeArt'

export default function Modes() {
  return <ArcadePage title="Game modes" art="board">
    <TableArt art="team" title="Pick a table" subtitle="Classic Ludo, four ways to play." />
    <MenuRow art={<ArcadeArt name="online" />} title="Public table" detail="Find other online players." onPress={() => router.push('/online')} />
    <MenuRow art={<ArcadeArt name="friends" />} title="Friends room" detail="Invite friends with a six-digit code." onPress={() => router.push('/friends')} />
    <MenuRow art={<ArcadeArt name="passPlay" />} title="Pass & play" detail="Share one phone with up to four players." onPress={() => router.push('/pass-play')} />
    <MenuRow art={<ArcadeArt name="computer" />} title="Computer" detail="Play against one or three bots." onPress={() => router.push('/computer')} />
  </ArcadePage>
}
