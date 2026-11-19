import { HOME_STEP, type Seat, type Token } from './rules'

export const REACTIONS = [
  { id: 'knife', label: 'Knife' }, { id: 'heart', label: 'Heart' }, { id: 'cactus', label: 'Cactus' },
  { id: 'orange', label: 'Orange' }, { id: 'snowball', label: 'Snowball' },
  { id: 'duck', label: 'Rubber duck' }, { id: 'gift', label: 'Gift' },
  { id: 'bomb', label: 'Bomb' },
] as const

export type ReactionKind = typeof REACTIONS[number]['id']
export type ReactionRequest = { kind: ReactionKind; from: Seat; to: Seat }
export type Reaction = ReactionRequest & { startedAt: number; sender: Token; receiver: Token }
export const REACTION_HIT = 1050
export const REACTION_LAUNCH_DELAY = 2000
export const REACTION_DURATION = 2750
export const BOMB_SCORCH_END = 4800

export function reactionAnchor(tokens: Token[], seat: Seat) {
  const pieces = tokens.filter(token => token.seat === seat)
  return pieces.find(token => token.progress >= 0 && token.progress < HOME_STEP)
    ?? pieces.find(token => token.progress < 0) ?? pieces[0]
}
