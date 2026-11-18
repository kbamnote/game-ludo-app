import { useCallback, useState } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from '../ui/Icon'
import { s } from '../ui/ArcadePage'
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
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#0c2043' }}>
    <View style={s.header}>
      <Pressable accessibilityLabel="Back" accessibilityRole="button" style={s.back}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
        <Icon name="arrow-back" color="#ffe587" />
      </Pressable>
      <Text accessibilityRole="header" style={s.headerTitle}>Voice Adda</Text>
    </View>
    {focused && ready && <VoiceLounge uri={uri} />}
  </SafeAreaView>
}
