import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Backdrop from '../ui/Backdrop'
import { ArcadeHeader, s } from '../ui/ArcadePage'
import VoiceLounge from '../voice/VoiceLounge'
import { SERVER_URL } from '../net/config'
import { useIdentity } from '../game/identity'

export default function Voice() {
  const name = useIdentity((player) => player.name)
  const ready = useIdentity((player) => player.hydrated)
  const [focused, setFocused] = useState(false)
  useFocusEffect(useCallback(() => {
    setFocused(true)
    return () => setFocused(false)
  }, []))
  const uri = SERVER_URL + '/voice/#name=' + encodeURIComponent(name)
  return <View style={s.page}>
    <Backdrop />
    <SafeAreaView style={{ flex: 1 }}>
      <ArcadeHeader title="Voice Adda" art="voice" />
      {focused && ready && <VoiceLounge uri={uri} />}
    </SafeAreaView>
  </View>
}
