import type { Seat } from './rules'

export const CORONATION_MS = 8600
export const PODIUM_HEIGHT = 1.65
export const CORONATION_YAW = .38

export type Coronation = {
  seat: Seat
  place: 1 | 2
  tokenId: string
  startedAt: number
}
