import { useEffect, useState, type ReactNode } from 'react'
import { router } from 'expo-router'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { A } from '../theme'
import { useProfile } from '../game/profile'
import Icon from './Icon'
import { DISPLAY, LABEL, NUMERIC } from './arcade'

export function useClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function ArcadePage({ title, children, onBack, footer }: {
  title: string; children: ReactNode; onBack?: () => void; footer?: ReactNode
}) {
  const [ready, setReady] = useState(useProfile.persist.hasHydrated)
  useEffect(() => {
    const unsub = useProfile.persist.onFinishHydration(() => setReady(true))
    setReady(useProfile.persist.hasHydrated())
    return unsub
  }, [])
  return (
    <LinearGradient colors={['#173d78', '#0b214a', '#07152e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" style={s.back}
            onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/home'))}>
            <Icon name="arrow-back" color={A.goldLite} />
          </Pressable>
          <Text accessibilityRole="header" style={s.headerTitle}>{title}</Text>
        </View>
        <ScrollView style={footer ? s.pageScroll : undefined} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
          {ready ? children : <Text style={s.copy}>Loading your profile…</Text>}
        </ScrollView>
        {ready && footer && <View style={s.pageFooter}>{footer}</View>}
      </SafeAreaView>
    </LinearGradient>
  )
}

export function TableArt({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <ImageBackground source={require('../../assets/arcade-table.jpg')} resizeMode="cover" imageStyle={{ width: '100%', height: '100%' }} style={s.art}>
      <LinearGradient colors={['rgba(4,13,32,0.90)', 'rgba(4,13,32,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.artText}>
        <Text style={s.heroTitle}>{title}</Text><Text style={s.heroCopy}>{subtitle}</Text>
      </LinearGradient>
    </ImageBackground>
  )
}

export function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, { opacity: disabled ? 0.55 : pressed ? 0.83 : 1 }]}>
    <Text style={s.actionText}>{label}</Text>
  </Pressable>
}

export function MenuRow({ art, title, detail, onPress }: { art: ReactNode; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}>
    <View style={s.medal}>{art}</View>
    <View style={{ flex: 1 }}><Text style={s.heading}>{title}</Text><Text style={s.copy}>{detail}</Text></View>
    <Icon name="chevron-right" color={A.goldLite} />
  </Pressable>
}

export const s = StyleSheet.create({
  pageScroll: { flex: 1 },
  pageFooter: { flexShrink: 0, alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: 16, paddingVertical: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10, width: '100%', maxWidth: 560, alignSelf: 'center' },
  back: { width: 44, height: 44, backgroundColor: '#0b234e', borderColor: '#4265a1', borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, color: '#fff3cc', fontSize: 23, flexShrink: 1 },
  body: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  art: { minHeight: 160, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#9d753b', justifyContent: 'center' },
  artText: { flex: 1, justifyContent: 'center', padding: 18 },
  heroTitle: { fontFamily: DISPLAY, fontSize: 32, color: '#ffdb78', maxWidth: '58%', lineHeight: 36 },
  heroCopy: { fontFamily: LABEL, color: '#f1e6ce', fontSize: 14, maxWidth: '52%', lineHeight: 19, marginTop: 5 },
  card: { padding: 17, borderRadius: 18, gap: 10, backgroundColor: '#132e57', borderWidth: 1, borderColor: '#355889' },
  row: { flexDirection: 'row', padding: 14, alignItems: 'center', gap: 12, borderRadius: 17, backgroundColor: '#153360', borderWidth: 1, borderColor: '#365b91' },
  medal: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#091e40' },
  heading: { color: '#fff2cf', fontFamily: NUMERIC, fontSize: 19, lineHeight: 26 },
  copy: { color: '#c5d7ee', fontFamily: LABEL, fontSize: 15, lineHeight: 21 },
  notice: { color: '#ffe08a', fontFamily: NUMERIC, fontSize: 16, textAlign: 'center' },
  action: { backgroundColor: '#ffc651', borderColor: '#ffe49c', borderWidth: 1, borderBottomColor: '#be7d18', borderBottomWidth: 4, borderRadius: 14, alignItems: 'center', justifyContent: 'center', minHeight: 49, padding: 9 },
  actionText: { fontFamily: NUMERIC, color: '#372508', fontSize: 17, textAlign: 'center' },
  input: { borderRadius: 12, borderColor: '#5875a0', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, minHeight: 44, backgroundColor: '#0a2044', color: '#fff', fontFamily: LABEL, fontSize: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
})
