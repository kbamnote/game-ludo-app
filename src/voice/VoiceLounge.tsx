import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, Share, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { Action, s } from '../ui/ArcadePage'

export default function VoiceLounge({ uri, speakerMuted }: { uri: string; speakerMuted?: boolean }) {
  const view = useRef<WebView<object>>(null)
  const [failed, setFailed] = useState(false)
  const syncSpeaker = useCallback(() => {
    if (speakerMuted === undefined) return
    view.current?.injectJavaScript(
      "document.dispatchEvent(new CustomEvent('voice-speaker', { detail: " + speakerMuted + " })); true;",
    )
  }, [speakerMuted])
  useEffect(syncSpeaker, [syncSpeaker])
  useEffect(() => {
    const change = AppState.addEventListener('change', (state) => {
      if (state === 'background') view.current?.injectJavaScript("document.dispatchEvent(new Event('voice-background')); true;")
    })
    return () => change.remove()
  }, [])
  if (failed) return <View style={s.body}>
    <Text style={s.copy}>The Ludo voice lounge is unavailable. Check your connection and try again.</Text>
    <Action label="Retry voice lounge" onPress={() => setFailed(false)} />
  </View>
  return <WebView<object> ref={view} source={{ uri }} style={{ flex: 1, backgroundColor: '#0c2043' }}
    onLoad={syncSpeaker}
    originWhitelist={['*']} setSupportMultipleWindows={false} allowsInlineMediaPlayback
    mediaPlaybackRequiresUserAction={false} mediaCapturePermissionGrantType="grantIfSameHostElseDeny"
    onShouldStartLoadWithRequest={({ url }) => url === 'about:blank' || url.split('#')[0] === uri.split('#')[0]}
    onHttpError={() => setFailed(true)} onError={() => setFailed(true)}
    onMessage={({ nativeEvent }) => {
      if (nativeEvent.url.split('#')[0] !== uri.split('#')[0]) return
      try {
        const { shareCode } = JSON.parse(nativeEvent.data)
        if (typeof shareCode === 'string' && /^[A-Z2-9]{8}$/.test(shareCode)) {
          void Share.share({ message: 'Join my Ludo voice room. Open Voice Adda and enter ' + shareCode }).catch(() => {})
        }
      } catch { /* Ignore unrelated messages. */ }
    }} />
}
