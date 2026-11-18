import { router } from 'expo-router'
import { useOnline } from '../net/online'
import { useMatch, type PlayerConfig } from './store'
import { useIdentity } from './identity'
import type { Difficulty } from './ai'

export function openTable(players: PlayerConfig[], cupRound?: number) {
  if (useOnline.getState().room) useOnline.getState().leaveRoom()
  useMatch.getState().start(players)
  router.push({ pathname: '/match', params: { table: JSON.stringify(players),
    ...(cupRound === undefined ? {} : { cupRound: String(cupRound) }) } })
}

export function practice() {
  openTable([
    { seat: 0, name: useIdentity.getState().name, kind: 'human' },
    { seat: 1, name: 'Vikram', kind: 'bot', difficulty: 'sharp' },
    { seat: 2, name: 'Raj', kind: 'bot', difficulty: 'sharp' },
    { seat: 3, name: 'Elena', kind: 'bot', difficulty: 'casual' },
  ])
}

export const CUP_RIVALS: { name: string; difficulty: Difficulty }[] = [
  { name: 'Elena', difficulty: 'casual' }, { name: 'Vikram', difficulty: 'sharp' }, { name: 'Raj', difficulty: 'ruthless' },
]
