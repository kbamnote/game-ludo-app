import type { Seat } from './rules'

export const PODIUM_HEIGHT = 1.65
export const CORONATION_YAW = .38
export const THRONE_SEAT_HEIGHT = .49

export function coronationDuration(place: 1 | 2) {
  return place === 1 ? 12_500 : 8_600
}

export type Coronation = {
  seat: Seat
  place: 1 | 2
  tokenId: string
  startedAt: number
}
