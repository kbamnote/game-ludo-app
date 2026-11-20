import { router } from 'expo-router'
import { useOnline } from '../net/online'
import { useMatch, type LocalVariant, type PlayerConfig } from './store'
import { useIdentity } from './identity'
import type { Difficulty } from './ai'
import type { Character } from './character'

export function openTable(players: PlayerConfig[], cupRound?: number, variant?: LocalVariant) {
  if (useOnline.getState().room) useOnline.getState().leaveRoom()
  useMatch.getState().start(players, variant)
  router.push({ pathname: '/match', params: { table: JSON.stringify(players),
    ...(variant === undefined ? {} : { variant }),
    ...(cupRound === undefined ? {} : { cupRound: String(cupRound) }) } })
}

export function practice(count: 2 | 4, character: Character) {
  const rivals: PlayerConfig[] = [
    { seat: 1, name: 'Vikram', kind: 'bot', difficulty: 'sharp' },
    { seat: 2, name: 'Raj', kind: 'bot', difficulty: 'sharp' },
    { seat: 3, name: 'Elena', kind: 'bot', difficulty: 'casual' },
  ]
  openTable([
    // Older portrait textures are already available from the local identity.
    { seat: 0, name: useIdentity.getState().name, kind: 'human', character: character.face ? undefined : character },
    ...rivals.filter(rival => count === 4 || rival.seat === 2),
  ])
}

export const CUP_RIVALS: { name: string; difficulty: Difficulty }[] = [
  { name: 'Elena', difficulty: 'casual' }, { name: 'Vikram', difficulty: 'sharp' }, { name: 'Raj', difficulty: 'ruthless' },
]
