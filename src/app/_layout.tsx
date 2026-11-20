import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreenModule from 'expo-splash-screen'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit'
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { Rubik_600SemiBold, Rubik_800ExtraBold, Rubik_900Black } from '@expo-google-fonts/rubik'
import { LuckiestGuy_400Regular } from '@expo-google-fonts/luckiest-guy'
import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2'
import { C } from '../theme'
import { restoreAccount, useAccount } from '../net/account'

SplashScreenModule.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const canPlay = useAccount(s => s.ready && s.session?.account.avatar != null)
  useEffect(() => { void restoreAccount() }, [])
  const [loaded, error] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Rubik_600SemiBold,
    Rubik_800ExtraBold,
    Rubik_900Black,
    LuckiestGuy_400Regular,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  })

  // Fonts are bundled assets, but a slow or stalled fetch must never strand
  // the player on a blank screen — give up waiting and render with fallbacks.
  const [waited, setWaited] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setWaited(true), 3000)
    return () => clearTimeout(id)
  }, [])

  const ready = loaded || !!error || waited

  useEffect(() => {
    if (ready) SplashScreenModule.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.canvas },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Protected guard={canPlay}>
          <Stack.Screen name="home" />
          <Stack.Screen name="character" />
          <Stack.Screen name="computer" />
          <Stack.Screen name="events" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="help" />
          <Stack.Screen name="inbox" />
          <Stack.Screen name="inventory" />
          <Stack.Screen name="lucky7" />
          <Stack.Screen name="match" />
          <Stack.Screen name="modes" />
          <Stack.Screen name="online" />
          <Stack.Screen name="pass-play" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="spin" />
          <Stack.Screen name="tournament" />
          <Stack.Screen name="voice" />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  )
}
