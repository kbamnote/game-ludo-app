import { Image } from 'react-native'

const art = {
  online: require('../../assets/arcade-art/online.png'),
  friends: require('../../assets/arcade-art/friends.png'),
  computer: require('../../assets/arcade-art/computer.png'),
  passPlay: require('../../assets/arcade-art/pass-play.png'),
  lucky7: require('../../assets/arcade-art/lucky7.png'),
  spin: require('../../assets/arcade-art/spin.png'),
  tournament: require('../../assets/arcade-art/tournament.png'),
  events: require('../../assets/arcade-art/events.png'),
  inventory: require('../../assets/arcade-art/inventory.png'),
  inbox: require('../../assets/arcade-art/inbox.png'),
  profile: require('../../assets/arcade-art/profile.png'),
  voice: require('../../assets/arcade-art/voice.png'),
  help: require('../../assets/arcade-art/help.png'),
  character: require('../../assets/arcade-art/character.png'),
  board: require('../../assets/arcade-art/board.png'),
  team: require('../../assets/arcade-art/team.png'),
} as const

export type ArcadeArtName = keyof typeof art

export default function ArcadeArt({ name, size = 44 }: { name: ArcadeArtName; size?: number }) {
  return <Image accessible={false} source={art[name]} resizeMode="contain" fadeDuration={0}
    style={{ width: size, height: size }} />
}
