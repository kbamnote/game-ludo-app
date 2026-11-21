import { Modal, StyleSheet, Switch, Text, View } from 'react-native'
import { useProfile } from '../game/profile'
import { SafeAreaView } from 'react-native-safe-area-context'
import ArcadeArt from './ArcadeArt'
import { Action, s } from './ArcadePage'

export default function MatchPauseMenu({ online, resume, leave }: {
  online: boolean; resume: () => void; leave: () => void
}) {
  const soundMuted = useProfile(state => state.soundMuted)
  const setSoundMuted = useProfile(state => state.setSoundMuted)

  return <Modal transparent animationType="fade" onRequestClose={resume}>
    <SafeAreaView style={styles.scrim}>
      <View accessibilityViewIsModal style={[s.card, styles.panel]}>
        <ArcadeArt name="board" size={57} />
        <Text accessibilityRole="header" style={styles.title}>{online ? 'Match menu' : 'Game paused'}</Text>
        {online && <Text style={[s.copy, styles.message]}>Online play continues while this menu is open.</Text>}
        <View style={styles.soundRow}>
          <View style={styles.soundText}>
            <Text style={s.heading}>Game sound</Text>
            <Text style={s.copy}>Music and sound effects</Text>
          </View>
          <Switch accessibilityLabel="Game sound" value={!soundMuted}
            onValueChange={enabled => setSoundMuted(!enabled)}
            trackColor={{ false: '#415a81', true: '#b5761d' }} thumbColor="#fff2cf" />
        </View>
        <View style={styles.actions}>
          <Action label="Resume" onPress={resume} />
          <Action label="Leave match" onPress={leave} secondary />
        </View>
      </View>
    </SafeAreaView>
  </Modal>
}

const styles = StyleSheet.create({
  scrim: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#050e24cc' },
  panel: { alignItems: 'center', width: '100%', maxWidth: 370, borderColor: '#c99543', padding: 19 },
  title: { ...s.heading, fontSize: 26, textAlign: 'center' },
  message: { textAlign: 'center' },
  soundRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: '#193b6c' },
  soundText: { flex: 1 },
  actions: { alignSelf: 'stretch', gap: 8, marginTop: 6 },
})
