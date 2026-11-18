import { Text, View } from 'react-native'
import { ArcadePage, TableArt, s } from '../ui/ArcadePage'

const rules = [
  ['Leave the yard', 'Roll a six to bring a pawn onto its starting square. Tap a highlighted pawn to choose your move.'],
  ['Follow the track', 'Land on an opponent on an unprotected square to send their pawn back to the yard. Stars and starting squares are safe.'],
  ['Finish the race', 'Use an exact roll to reach home. Bring all four pawns home to win.'],
  ['Play across phones', 'Open Friends to create a room. Share its six-digit code, then have everyone tap Ready. The host starts the match.'],
]
export default function Help() {
  return <ArcadePage title="How to play"><TableArt title="Ludo rules" subtitle="Four pawns. One race home." />
    {rules.map(([title, body]) => <View key={title} style={s.card}><Text style={s.heading}>{title}</Text><Text style={s.copy}>{body}</Text></View>)}
  </ArcadePage>
}
