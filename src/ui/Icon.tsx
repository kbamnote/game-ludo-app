import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type MI = ComponentProps<typeof MaterialIcons>['name']
type MCI = ComponentProps<typeof MaterialCommunityIcons>['name']

/**
 * The Stitch designs use Material Symbols names. A few have no equivalent in
 * the older MaterialIcons set shipped with @expo/vector-icons, so those fall
 * through to MaterialCommunityIcons.
 */
const COMMUNITY: Record<string, MCI> = {
  swords: 'sword-cross',
  casino: 'dice-5',
  toys: 'ferris-wheel',
  'dance-ballroom': 'dance-ballroom',
  'sports-esports': 'gamepad-variant',
}

export interface IconProps {
  name: string
  size?: number
  color?: string
  style?: ComponentProps<typeof MaterialIcons>['style']
}

export default function Icon({ name, size = 20, color = '#dfe2f1', style }: IconProps) {
  const community = COMMUNITY[name]
  if (community) {
    return <MaterialCommunityIcons name={community} size={size} color={color} style={style} />
  }
  return <MaterialIcons name={name as MI} size={size} color={color} style={style} />
}
