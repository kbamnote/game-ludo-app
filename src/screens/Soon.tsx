import { router } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import Bevel from '../ui/Bevel'
import Icon from '../ui/Icon'
import { C, F, S, T } from '../theme'

/** Stand-in for screens not yet ported from the Stitch designs. */
export default function Soon({ title }: { title: string }) {
  return (
    <View style={styles.root}>
      <Icon name="construction" size={40} color={C.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>This screen is next in the build queue.</Text>
      <Bevel
        label="Back"
        icon="arrow-back"
        iconRight={false}
        style={{ width: 180, marginTop: S.md }}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
  },
  title: { fontFamily: F.headBold, ...T.headlineMd, color: C.onSurface, textAlign: 'center' },
  body: { fontFamily: F.body, ...T.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' },
})
