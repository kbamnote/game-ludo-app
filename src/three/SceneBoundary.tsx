import { Component, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { A, C } from '../theme'
import { LABEL, NUMERIC } from '../ui/arcade'

/**
 * Keeps a 3D failure inside the canvas.
 *
 * Without this, anything that throws while rendering the scene — a GL context
 * that will not initialise, a model that cannot be read — tears down the whole
 * React tree and the player sees a black screen with no way back. That is
 * exactly what happened in the first standalone build: it worked in Expo Go,
 * where Metro serves assets over HTTP, and died in release.
 *
 * The HUD lives outside this boundary, so the match stays playable (the board
 * is still rendered by the server) even if the scene cannot draw.
 */
interface Props {
  children: ReactNode
  /** Shown instead of the scene. Keep it small — it sits in the board slot. */
  label?: string
}

interface State {
  error: Error | null
}

export default class SceneBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Surfaces in `adb logcat` and in EAS build logs, which is the only
    // diagnostic channel available once the app is on a tester's phone.
    console.error('[scene] 3D scene failed:', error?.message, error?.stack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>{this.props.label ?? '3D view unavailable'}</Text>
        <Text style={styles.body} numberOfLines={4}>
          {error.message || 'The board could not be drawn on this device.'}
        </Text>
        <Text style={styles.hint}>The match is still running — use the controls below.</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  fallback: {
    // RN 0.88 dropped StyleSheet.absoluteFillObject from its public types.
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    backgroundColor: C.arenaLow,
  },
  title: { fontFamily: NUMERIC, fontSize: 16, color: A.gold, textAlign: 'center' },
  body: { fontFamily: LABEL, fontSize: 12, color: '#cfe0ff', textAlign: 'center' },
  hint: { fontFamily: LABEL, fontSize: 11, color: '#8fa8d4', textAlign: 'center', marginTop: 4 },
})
