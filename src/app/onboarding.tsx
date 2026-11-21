import { useEffect, useRef, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Linking, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Pressable from '../ui/SoundPressable'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CREW, DEFAULT_CHARACTER_MODEL } from '../game/character'
import { SEAT_HEX, type Seat } from '../game/rules'
import { cancelProvider, chooseAvatar, finishProvider, playAsGuest, startProvider, useAccount, type Provider } from '../net/account'
import CharacterPreview from '../three/CharacterPreview'
import SceneBoundary from '../three/SceneBoundary'
import { Action, s } from '../ui/ArcadePage'
import { Coin, Gem } from '../ui/ArcadeIcons'
import Backdrop from '../ui/Backdrop'
import ArcadeArt from '../ui/ArcadeArt'
import { ArtAccent, HomeArtMotion, HomeBrand } from '../ui/HomeArt'

function SignIn() {
  const { width, height } = useWindowDimensions()
  const [busy, setBusy] = useState<Provider | 'guest' | 'finishing' | null>(null)
  const [message, setMessage] = useState('')
  const [waiting, setWaiting] = useState(false)
  const received = useRef<string | null>(null)
  const { receipt } = useLocalSearchParams<{ receipt?: string }>()

  useEffect(() => {
    if (typeof receipt !== 'string' || received.current === receipt) return
    received.current = receipt
    void (async () => {
      setWaiting(false)
      setBusy('finishing')
      setMessage('Finishing sign-in…')
      try {
        await finishProvider(receipt)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Please try signing in again.')
        router.setParams({ receipt: undefined })
      } finally {
        setBusy(null)
      }
    })()
  }, [receipt])

  async function signIn(method: Provider | 'guest') {
    const popup = method !== 'guest' && Platform.OS === 'web' ? window.open('about:blank', '_blank') : null
    if (popup) popup.opener = null
    setMessage('')
    setBusy(method)
    try {
      if (method === 'guest') {
        await playAsGuest()
      } else {
        const url = await startProvider(method)
        if (popup) popup.location.replace(url)
        else await Linking.openURL(url)
        setWaiting(true)
        setMessage('Finish signing in in your browser. Tap Return to the game if it doesn’t reopen automatically.')
      }
    } catch (error) {
      popup?.close()
      setMessage(error instanceof Error ? error.message : 'Please try signing in again.')
    } finally {
      setBusy(null)
    }
  }

  return <HomeArtMotion style={styles.signIn}>
    <View style={styles.brand}><HomeBrand size={Math.min(width * .64, height * .29, 238)} /></View>
    <Text accessibilityRole="header" style={styles.title}>Welcome to the game</Text>
    <View style={[s.card, styles.bonus]}>
      <View style={styles.reward}>
        <ArtAccent group={0}><Coin size={26} /></ArtAccent>
        <Text style={styles.rewardLabel}>1,000 coins</Text>
      </View>
      <View style={styles.reward}>
        <ArtAccent group={2}><Gem size={25} /></ArtAccent>
        <Text style={styles.rewardLabel}>10 diamonds</Text>
      </View>
    </View>
    <Text style={[s.copy, styles.center]}>Free when you create your account.</Text>
    <View style={styles.buttons}>
      <Action label="Sign in with Google" icon={<ArtAccent group={0}><MaterialCommunityIcons name="google" size={19} color="#a92f21" /></ArtAccent>}
        disabled={busy !== null || waiting} onPress={() => void signIn('google')} />
      <Action label="Sign in with Facebook" icon={<ArtAccent group={1}><MaterialCommunityIcons name="facebook" size={20} color="#1856b3" /></ArtAccent>}
        disabled={busy !== null || waiting} onPress={() => void signIn('facebook')} />
      <Action label={busy === 'guest' ? 'Connecting…' : 'Play as a guest'} secondary icon={<ArcadeArt name="lucky7" size={22} />}
        disabled={busy !== null || waiting} onPress={() => void signIn('guest')} />
      {waiting && <Pressable accessibilityRole="button" onPress={() => {
        void cancelProvider().then(() => {
          setWaiting(false)
          setMessage('')
        }).catch(() => setMessage('Could not cancel sign-in. Try again.'))
      }}><Text style={[s.copy, styles.center]}>Cancel sign-in</Text></Pressable>}
    </View>
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
  </HomeArtMotion>
}

function PickAvatar() {
  const [model, setModel] = useState<Seat>(DEFAULT_CHARACTER_MODEL)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function save() {
    setBusy(true)
    setMessage('')
    try {
      await chooseAvatar(model)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your avatar. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <View style={[s.line, styles.options]}>
      <ArcadeArt name="character" size={38} />
      <Text accessibilityRole="header" style={styles.title}>Choose your avatar</Text>
    </View>
    <Text style={[s.copy, styles.center]}>Your character will appear on the board when you play.</Text>
    <View style={styles.preview}>
      <SceneBoundary label="Avatar preview unavailable">
        <CharacterPreview character={{ model }} />
      </SceneBoundary>
    </View>
    <View style={[s.line, styles.options]}>
      {CREW.map((name, index) => <Pressable key={name} accessibilityRole="radio"
        accessibilityState={{ checked: index === model, disabled: busy }} disabled={busy} onPress={() => setModel(index as Seat)}
        style={[styles.choice, index === model && { borderColor: SEAT_HEX[model], backgroundColor: '#254478' }]}>
        <Text style={s.copy}>{name}</Text>
      </Pressable>)}
    </View>
    <Action label={busy ? 'Saving…' : 'Continue to home'} disabled={busy} onPress={() => void save()} />
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
  </>
}

export default function Onboarding() {
  const ready = useAccount(state => state.ready)
  const account = useAccount(state => state.session?.account)
  if (ready && account && account.avatar !== null) return <Redirect href="/home" />
  return <View style={styles.root}>
    <Backdrop />
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {ready ? account ? <PickAvatar /> : <SignIn /> : <Text style={s.notice}>Loading your account…</Text>}
      </ScrollView>
    </SafeAreaView>
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#102d5f' },
  safe: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  signIn: { gap: 12 },
  brand: { alignItems: 'center' },
  title: { ...s.headerTitle, fontSize: 28, textAlign: 'center' },
  center: { textAlign: 'center' },
  bonus: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, padding: 10, backgroundColor: '#0c244d', borderColor: '#756543' },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardLabel: { ...s.heading, fontSize: 16 },
  buttons: { gap: 10 },
  preview: { height: 265, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0b1e38' },
  options: { justifyContent: 'center' },
  choice: { minHeight: 44, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 10, borderWidth: 2, borderColor: '#355889', backgroundColor: '#0a2044' },
})
