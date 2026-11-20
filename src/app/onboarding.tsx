import { useEffect, useRef, useState } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CREW, VARSITY, type CharacterModel } from '../game/character'
import { SEAT_HEX } from '../game/rules'
import { cancelProvider, chooseAvatar, finishProvider, playAsGuest, startProvider, useAccount, type Provider } from '../net/account'
import CharacterPreview from '../three/CharacterPreview'
import SceneBoundary from '../three/SceneBoundary'
import { Action, s } from '../ui/ArcadePage'
import { Coin, Gem } from '../ui/ArcadeIcons'
import Backdrop from '../ui/Backdrop'
import BrandLockup from '../ui/BrandLockup'

function SignIn() {
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

  return <>
    <View style={styles.brand}><BrandLockup scale={.65} /></View>
    <Text accessibilityRole="header" style={styles.title}>Welcome to the game</Text>
    <View style={[s.card, styles.bonus]}>
      <Coin size={25} /><Text style={s.heading}>1,000 coins</Text>
      <Gem size={25} /><Text style={s.heading}>10 diamonds</Text>
    </View>
    <Text style={[s.copy, styles.center]}>Free when you create your account.</Text>
    <View style={styles.buttons}>
      <Action label="Sign in with Google" icon={<MaterialCommunityIcons name="google" size={17} color="#b73424" />}
        disabled={busy !== null || waiting} onPress={() => void signIn('google')} />
      <Action label="Sign in with Facebook" icon={<MaterialCommunityIcons name="facebook" size={18} color="#1856b3" />}
        disabled={busy !== null || waiting} onPress={() => void signIn('facebook')} />
      <Action label={busy === 'guest' ? 'Connecting…' : 'Play as a guest'} icon={<Text style={styles.guestEmoji}>👤</Text>}
        disabled={busy !== null || waiting} onPress={() => void signIn('guest')} />
      {waiting && <Pressable accessibilityRole="button" onPress={() => {
        void cancelProvider().then(() => {
          setWaiting(false)
          setMessage('')
        }).catch(() => setMessage('Could not cancel sign-in. Try again.'))
      }}><Text style={[s.copy, styles.center]}>Cancel sign-in</Text></Pressable>}
    </View>
    {!!message && <Text accessibilityLiveRegion="polite" style={s.notice}>{message}</Text>}
  </>
}

function PickAvatar() {
  const [model, setModel] = useState<CharacterModel>(VARSITY)
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
    <Text accessibilityRole="header" style={styles.title}>Choose your avatar</Text>
    <Text style={[s.copy, styles.center]}>Your character will appear on the board when you play.</Text>
    <View style={styles.preview}>
      <SceneBoundary label="Avatar preview unavailable">
        <CharacterPreview character={{ model }} />
      </SceneBoundary>
    </View>
    <View style={[s.line, styles.options]}>
      {CREW.map((name, index) => <Pressable key={name} accessibilityRole="radio"
        accessibilityState={{ checked: index === model, disabled: busy }} disabled={busy} onPress={() => setModel(index as CharacterModel)}
        style={[styles.choice, index === model && { borderColor: model === VARSITY ? '#ffc651' : SEAT_HEX[model], backgroundColor: '#254478' }]}>
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
  guestEmoji: { fontSize: 15, includeFontPadding: false },
  root: { flex: 1, backgroundColor: '#102d5f' },
  safe: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center', justifyContent: 'center', gap: 14, padding: 20 },
  brand: { alignItems: 'center' },
  title: { ...s.headerTitle, fontSize: 28, textAlign: 'center' },
  center: { textAlign: 'center' },
  bonus: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttons: { gap: 10 },
  preview: { height: 265, borderRadius: 18, overflow: 'hidden', backgroundColor: '#0b1e38' },
  options: { justifyContent: 'center' },
  choice: { minHeight: 44, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 10, borderWidth: 2, borderColor: '#355889', backgroundColor: '#0a2044' },
})
