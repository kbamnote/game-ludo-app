import { useEffect, useState, useSyncExternalStore, type ComponentRef, type ReactNode, type Ref } from 'react'
import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import Pressable from './SoundPressable'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { A } from '../theme'
import { useProfile } from '../game/profile'
import Icon from './Icon'
import Backdrop from './Backdrop'
import ArcadeArt, { type ArcadeArtName } from './ArcadeArt'
import { DISPLAY, LABEL, NUMERIC } from './arcade'

export function useClock() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function ArcadeHeader({ title, art, onBack }: { title: string; art: ArcadeArtName; onBack?: () => void }) {
  return <View style={s.header}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back" style={s.back}
      onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.replace('/home'))}>
      <Icon name="arrow-back" color={A.goldLite} />
    </Pressable>
    <Text accessibilityRole="header" style={s.headerTitle}>{title}</Text>
    <View style={s.headerArt}><ArcadeArt name={art} size={40} /></View>
  </View>
}

export function ArcadePage({ title, art, children, onBack, footer, scrollRef }: {
  title: string; art: ArcadeArtName; children: ReactNode; onBack?: () => void; footer?: ReactNode; scrollRef?: Ref<ComponentRef<typeof ScrollView>>
}) {
  const ready = useSyncExternalStore(useProfile.persist.onFinishHydration, useProfile.persist.hasHydrated, () => false)
  return (
    <View style={s.page}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }}>
        <ArcadeHeader title={title} art={art} onBack={onBack} />
        <ScrollView ref={scrollRef} style={footer ? s.pageScroll : undefined} keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
          {ready ? children : <Text style={s.copy}>Loading your profile…</Text>}
        </ScrollView>
        {ready && footer && <View style={s.pageFooter}>{footer}</View>}
      </SafeAreaView>
    </View>
  )
}

export function TableArt({ title, subtitle, art }: { title: string; subtitle: string; art: ArcadeArtName }) {
  return (
    <LinearGradient colors={['#265dab', '#102c5b', '#0a1b3f']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={s.art}>
      <View style={s.artText}>
        <Text style={s.heroTitle}>{title}</Text><Text style={s.heroCopy}>{subtitle}</Text>
      </View>
      <View style={s.artStage}>
        <View style={s.artHalo} />
        <ArcadeArt name={art} size={105} />
      </View>
    </LinearGradient>
  )
}

export function Action({ label, onPress, disabled = false, icon, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode; secondary?: boolean
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, secondary && s.secondaryAction, icon != null && s.actionWithIcon, { opacity: disabled ? 0.55 : pressed ? 0.83 : 1 }]}>
    <LinearGradient pointerEvents="none" colors={secondary ? ['#2c5186', '#132e5b'] : ['#ffe998', '#f7ad31']}
      style={StyleSheet.absoluteFill} />
    {icon != null && <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.actionIcon, secondary && s.secondaryIcon]}>{icon}</View>}
    <Text style={[s.actionText, secondary && s.secondaryActionText, icon != null && s.actionIconLabel]}>{label}</Text>
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
  page: { flex: 1, backgroundColor: A.bgDeep },
  pageScroll: { flex: 1 },
  pageFooter: { flexShrink: 0, alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: 16, paddingVertical: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, width: '100%', maxWidth: 560, alignSelf: 'center' },
  back: { width: 44, height: 44, backgroundColor: '#163566', borderColor: '#d9a84e', borderWidth: 1, borderBottomWidth: 3, borderBottomColor: '#795524', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: DISPLAY, color: '#fff3cc', fontSize: 24, flex: 1, textShadowColor: '#081832', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 3 },
  headerArt: { height: 48, width: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#cea65d', backgroundColor: '#143568' },
  body: { padding: 16, paddingTop: 4, gap: 14, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  art: { minHeight: 136, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderBottomWidth: 3, borderColor: '#bd8d48', flexDirection: 'row', alignItems: 'center', padding: 13, gap: 8 },
  artText: { flex: 1 },
  artStage: { width: 111, height: 110, alignItems: 'center', justifyContent: 'center' },
  artHalo: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: '#539ae43b', borderWidth: 1, borderColor: '#acd6ff4a' },
  heroTitle: { fontFamily: DISPLAY, fontSize: 27, color: '#ffdb78', lineHeight: 31 },
  heroCopy: { fontFamily: LABEL, color: '#e3edff', fontSize: 14, lineHeight: 19, marginTop: 4 },
  card: { padding: 16, borderRadius: 18, gap: 10, backgroundColor: '#112b54', borderWidth: 1, borderTopColor: '#6591cd', borderColor: '#385f95', borderBottomWidth: 3, borderBottomColor: '#091b39' },
  row: { flexDirection: 'row', padding: 12, alignItems: 'center', gap: 11, borderRadius: 15, backgroundColor: '#193b6c', borderWidth: 1, borderColor: '#537ab1' },
  medal: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10254b', borderWidth: 1, borderColor: '#9b7644' },
  heading: { color: '#fff2cf', fontFamily: NUMERIC, fontSize: 19, lineHeight: 26 },
  copy: { color: '#c5d7ee', fontFamily: LABEL, fontSize: 15, lineHeight: 21 },
  notice: { color: '#ffe08a', fontFamily: NUMERIC, fontSize: 16, textAlign: 'center' },
  action: { backgroundColor: '#ffc651', borderColor: '#ffe49c', borderWidth: 1, borderBottomColor: '#be7d18', borderBottomWidth: 4, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', minHeight: 49, padding: 9 },
  secondaryAction: { backgroundColor: '#142f5c', borderColor: '#7d6842', borderBottomColor: '#091b3e' },
  secondaryIcon: { backgroundColor: '#233e6d' },
  secondaryActionText: { color: '#fff1d2' },
  actionWithIcon: { flexDirection: 'row', gap: 9 },
  actionIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#fff1d2', alignItems: 'center', justifyContent: 'center' },
  actionIconLabel: { flexShrink: 1 },
  actionText: { fontFamily: NUMERIC, color: '#372508', fontSize: 17, textAlign: 'center' },
  input: { borderRadius: 12, borderColor: '#5875a0', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, minHeight: 44, backgroundColor: '#0a2044', color: '#fff', fontFamily: LABEL, fontSize: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
})
