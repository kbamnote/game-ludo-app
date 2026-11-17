import { CENTER_CELL, HOME_COLUMN_CELLS, SAFE_CELLS, TRACK_CELLS, type Seat } from '../game/rules'

/** World size of one grid cell. The board is 15 cells across. */
export const CELL = 1
export const GRID = 15
/**
 * Top surface of the painted tiles, where tokens stand.
 * Chassis spans -0.4..0.4, deck slab 0.35..0.65, tiles 0.57..0.83.
 */
export const DECK_Y = 0.83
/** Centre height of a tile / yard plate box. */
export const TILE_Y = 0.7
/** Thickness of a tile; its radius must stay under half of this. */
export const TILE_H = 0.26

/** Grid (col,row) -> world (x,z). Grid origin is top-left; world origin is board centre. */
export function toWorld([col, row]: readonly [number, number]): [number, number] {
  return [(col - (GRID - 1) / 2) * CELL, (row - (GRID - 1) / 2) * CELL]
}

export interface TileSpec {
  key: string
  cell: readonly [number, number]
  /** Seat whose colour this tile carries, or null for a plain white track tile. */
  seat: Seat | null
  kind: 'track' | 'entry' | 'star' | 'home-column' | 'home'
}

/**
 * Every painted tile on the deck: the 52 shared track cells (with each seat's
 * entry run and star tinted) plus the four home columns.
 */
export function buildTiles(): TileSpec[] {
  const tiles: TileSpec[] = []

  // The five cells that run out of each yard carry that seat's colour,
  // matching a printed board's coloured approach lane.
  const entryRun: Record<number, Seat> = {}
  const seats: Seat[] = [0, 1, 2, 3]
  const entryIndex: Record<Seat, number> = { 0: 0, 1: 13, 2: 26, 3: 39 }
  for (const seat of seats) {
    entryRun[entryIndex[seat]] = seat
  }

  TRACK_CELLS.forEach((cell, i) => {
    const seat = entryRun[i] ?? null
    const kind: TileSpec['kind'] = seat !== null ? 'entry' : SAFE_CELLS.has(i) ? 'star' : 'track'
    tiles.push({ key: `t${i}`, cell, seat, kind })
  })

  for (const seat of seats) {
    HOME_COLUMN_CELLS[seat].forEach((cell, i) => {
      tiles.push({ key: `h${seat}-${i}`, cell, seat, kind: 'home-column' })
    })
  }

  tiles.push({ key: 'center', cell: CENTER_CELL, seat: null, kind: 'home' })
  return tiles
}

/** The four yard plates, as [centreCol, centreRow, seat]. */
export const YARD_PLATES: ReadonlyArray<{ seat: Seat; center: readonly [number, number] }> = [
  { seat: 0, center: [2.75, 2.75] },
  { seat: 1, center: [11.25, 2.75] },
  { seat: 2, center: [11.25, 11.25] },
  { seat: 3, center: [2.75, 11.25] },
]

export const YARD_SIZE = 5.5
