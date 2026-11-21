import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Pressable from './SoundPressable'
import { A } from '../theme'

/** expo-linear-gradient requires at least two stops. */
type Gradient = readonly [string, string, ...string[]]

/** RN 0.88 dropped `StyleSheet.absoluteFillObject` from its public types. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const

export const DISPLAY = 'LuckiestGuy_400Regular'
export const NUMERIC = 'Baloo2_800ExtraBold'
export const LABEL = 'Baloo2_700Bold'

/**
 * Chunky display text with a hard outline, the signature of this lobby style.
 * React Native has no text-stroke, and `textShadow` only draws one shadow, so
 * the outline is eight offset copies behind a solid fill.
 */
export function OutlineText({
  children,
  size = 20,
  color = A.text,
  outline = A.textOutline,
  width = 2.5,
  font = DISPLAY,
  style,
  numberOfLines,
}: {
  children: ReactNode
  size?: number
  color?: string
  outline?: string
  width?: number
  font?: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
}) {
  const base: TextStyle = {
    fontFamily: font,
    fontSize: size,
    lineHeight: size * 1.3,
    textAlign: 'center',
    includeFontPadding: false,
  }

  const offsets: Array<[number, number]> = [
    [-width, 0],
    [width, 0],
    [0, -width],
    [0, width],
    [-width * 0.7, -width * 0.7],
    [width * 0.7, -width * 0.7],
    [-width * 0.7, width * 0.7],
    [width * 0.7, width * 0.7],
  ]

  return (
    <View style={[{ position: 'relative' }, style]}>
      {offsets.map(([dx, dy], i) => (
        <Text
          key={i}
          numberOfLines={numberOfLines}
          style={[
            base,
            FILL as TextStyle,
            { color: outline, transform: [{ translateX: dx }, { translateY: dy }] },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text numberOfLines={numberOfLines} style={[base, { color }]}>
        {children}
      </Text>
    </View>
  )
}

/**
 * The gold-rimmed blue panel everything in this lobby is built from: a gold
 * outer frame, a dark seat beneath it for depth, and a glossy blue face.
 */
export function GoldPanel({
  children,
  radius = 14,
  style,
  contentStyle,
  onPress,
  accessibilityLabel,
  depth = 5,
  face = [A.panelTop, A.panelBot],
  rim = [A.goldLite, A.gold, A.goldMid],
  disabled,
}: {
  children?: ReactNode
  radius?: number
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  onPress?: () => void
  accessibilityLabel?: string
  depth?: number
  face?: Gradient
  rim?: Gradient
  disabled?: boolean
}) {
  const body = (
    <View style={[{ borderRadius: radius }, style]}>
      {/* Seat — the dark ledge the panel sits on */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: depth,
          bottom: -depth,
          borderRadius: radius,
          backgroundColor: A.goldShadow,
          opacity: 0.55,
        }}
      />
      {/* Gold rim */}
      <LinearGradient
        colors={rim}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ borderRadius: radius, padding: 3 }}
      >
        {/* Inner dark line, so the rim reads as metal rather than a border */}
        <View style={{ borderRadius: radius - 2, backgroundColor: A.panelDeep, padding: 1.5 }}>
          <LinearGradient
            colors={face}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[{ borderRadius: radius - 3, overflow: 'hidden' }, contentStyle]}
          >
            {/* Top gloss */}
            <LinearGradient
              colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%' }}
            />
            {children}
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  )

  if (!onPress) return body
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({ transform: [{ translateY: pressed ? depth - 1 : 0 }], opacity: disabled ? 0.6 : 1 })}
    >
      {body}
    </Pressable>
  )
}

/** The gold action bar used for a tile's caption and for CTA buttons. */
export function GoldBar({
  label,
  size = 15,
  style,
  onPress,
  radius = 10,
  paddingVertical = 5,
  labelShadow = false,
}: {
  label: string
  size?: number
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  radius?: number
  paddingVertical?: number
  labelShadow?: boolean
}) {
  const bar = (
    <LinearGradient
      colors={[A.goldLite, A.gold, A.goldMid]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        {
          borderRadius: radius,
          paddingVertical,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: A.goldDeep,
        },
        style,
      ]}
    >
      {labelShadow ? (
        <Text numberOfLines={1} style={[styles.barLabel, { fontSize: size, lineHeight: size * 1.3 }]}>{label}</Text>
      ) : (
        <OutlineText size={size} width={2} outline={A.goldShadow}>{label}</OutlineText>
      )}
    </LinearGradient>
  )

  if (!onPress) return bar
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] })}>
      {bar}
    </Pressable>
  )
}

/** Circular gold badge used by the left and right promo rails. */
export function RailBadge({
  children,
  size = 46,
  onPress,
  caption,
  captionColor = A.gold,
  style,
}: {
  children: ReactNode
  size?: number
  onPress?: () => void
  caption?: string
  captionColor?: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ alignItems: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] }, style]}
    >
      <LinearGradient
        colors={[A.goldLite, A.gold, A.goldMid]}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: 2.5,
          shadowColor: '#000',
          shadowOpacity: 0.45,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 3 },
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={[A.panelTop, A.panelDeep]}
          style={{
            flex: 1,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </LinearGradient>
      </LinearGradient>
      {caption && (
        <View style={{ marginTop: -5 }}>
          <OutlineText size={9} width={1.6} color={captionColor} outline={A.goldShadow}>
            {caption}
          </OutlineText>
        </View>
      )}
    </Pressable>
  )
}

/** Dark currency capsule with a value and a green add button. */
export function CurrencyPill({
  icon,
  value,
  onAdd,
  minWidth = 72,
}: {
  icon: ReactNode
  value: string
  onAdd?: () => void
  minWidth?: number
}) {
  return (
    <View style={styles.pill}>
      <View style={{ marginLeft: -10 }}>{icon}</View>
      <Text style={[styles.pillValue, { minWidth }]} numberOfLines={1}>
        {value}
      </Text>
      <Pressable onPress={onAdd} style={styles.plus}>
        <Text style={styles.plusText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  barLabel: { fontFamily: DISPLAY, color: A.text, textAlign: 'center', includeFontPadding: false, textShadowColor: A.goldShadow, textShadowOffset: { width: 0, height: 1.5 }, textShadowRadius: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3,16,46,0.85)',
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 3,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(120,170,255,0.35)',
    gap: 4,
  },
  pillValue: {
    fontFamily: NUMERIC,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'right',
    includeFontPadding: false,
  },
  plus: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: A.green,
    borderWidth: 1,
    borderColor: A.greenDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontFamily: NUMERIC,
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
    includeFontPadding: false,
  },
})
