import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { requestMatchVoice } from '../net/online'
import VoiceLounge from './VoiceLounge'

export default function MatchVoice() {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    requestMatchVoice().then(
      value => { if (active) setUrl(value) },
      reason => { if (active) setError(reason instanceof Error ? reason.message : 'Voice is unavailable.') },
    )
    return () => { active = false }
  }, [])
  return <View style={styles.panel}>
    {url ? <VoiceLounge uri={url} /> : <Text accessibilityLiveRegion="polite" style={styles.status}>
      {error || 'Preparing match voice…'}
    </Text>}
  </View>
}

const styles = StyleSheet.create({
  panel: { height: 106, marginHorizontal: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0c2043' },
  status: { padding: 12, color: '#fff3cc', textAlign: 'center' },
})
