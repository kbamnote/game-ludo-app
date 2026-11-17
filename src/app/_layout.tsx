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

SplashScreenModule.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
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
      />
    </SafeAreaProvider>
  )
}
