import { useEffect, useState } from 'react'
import { requestRecordingPermissionsAsync } from 'expo-audio'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { requestMatchVoice } from '../net/online'
import VoiceLounge from './VoiceLounge'

export default function MatchVoice() {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [permission, setPermission] = useState<'checking' | 'granted' | 'denied' | 'blocked'>(
    Platform.OS === 'web' ? 'granted' : 'checking',
  )
  useEffect(() => {
    let active = true
    async function connectVoice() {
      if (Platform.OS !== 'web') {
        // This panel mounts when a player taps the microphone in the match.
        const result = await requestRecordingPermissionsAsync().catch(() => null)
        if (!active) return
        setPermission(result?.granted ? 'granted' : result?.canAskAgain === false ? 'blocked' : 'denied')
      }
      try {
        const value = await requestMatchVoice()
        if (active) setUrl(value)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Voice is unavailable.')
      }
    }
    void connectVoice()
    return () => { active = false }
  }, [])
  return <View>
    <View style={styles.panel}>
      {url && permission !== 'checking' ? <VoiceLounge uri={url} /> : <Text accessibilityLiveRegion="polite" style={styles.status}>
        {error || 'Preparing match voice…'}
      </Text>}
    </View>
    {url && permission === 'denied' && <Text style={styles.notice}>
      You can listen. Reopen match voice to allow your microphone.
    </Text>}
    {url && permission === 'blocked' && <Pressable accessibilityRole="button"
      onPress={() => { void Linking.openSettings().catch(() => {}) }}>
      <Text style={styles.notice}>You can listen. Tap to allow the microphone in Settings.</Text>
    </Pressable>}
  </View>
}

const styles = StyleSheet.create({
  panel: { height: 106, marginHorizontal: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: '#0c2043' },
  status: { padding: 12, color: '#fff3cc', textAlign: 'center' },
  notice: { paddingHorizontal: 8, paddingVertical: 4, color: '#fff3cc', textAlign: 'center' },
})
