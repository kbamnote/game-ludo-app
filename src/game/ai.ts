import {
  HOME_STEP,
  LAST_TRACK_STEP,
  SAFE_CELLS,
  trackIndexFor,
  type Move,
  type Seat,
  type Token,
} from './rules'

export type Difficulty = 'casual' | 'sharp' | 'ruthless'

/** How much randomness each difficulty injects into the score. */
const NOISE: Record<Difficulty, number> = {
  casual: 26,
  sharp: 9,
  ruthless: 0,
}

/** How many steps behind a token an enemy counts as "breathing down its neck". */
const THREAT_WINDOW = 6

function isThreatened(tokens: Token[], seat: Seat, progress: number): boolean {
  if (progress < 0 || progress > LAST_TRACK_STEP) return false
  const idx = trackIndexFor(seat, progress)
  if (idx === null || SAFE_CELLS.has(idx)) return false

  return tokens.some((enemy) => {
    if (enemy.seat === seat) return false
    if (enemy.progress < 0 || enemy.progress > LAST_TRACK_STEP) return false
    const enemyIdx = trackIndexFor(enemy.seat, enemy.progress)
    if (enemyIdx === null) return false
    const gap = (idx - enemyIdx + 52) % 52
    return gap >= 1 && gap <= THREAT_WINDOW
  })
}

export function scoreMove(tokens: Token[], seat: Seat, move: Move, difficulty: Difficulty): number {
  let score = 0

  // Sending an opponent back is worth more the further along they were.
  for (const id of move.captures) {
    const victim = tokens.find((t) => t.id === id)
    score += 120 + (victim ? victim.progress : 0) * 1.6
  }

  if (move.finishes) score += 150
  if (move.entersBoard) score += 65

  // Escaping a token that is about to be hit.
  if (isThreatened(tokens, seat, move.from)) score += 55
  // Walking into a threatened square is bad.
  if (isThreatened(tokens, seat, move.to)) score -= 45

  // Landing on a safe cell or inside the home column.
  const toIdx = trackIndexFor(seat, move.to)
  if (toIdx !== null && SAFE_CELLS.has(toIdx)) score += 28
  if (move.to > LAST_TRACK_STEP && move.to < HOME_STEP) score += 24

  // Forming a blockade with a friendly token.
  if (toIdx !== null) {
    const friend = tokens.some(
      (t) =>
        t.id !== move.tokenId &&
        t.seat === seat &&
        t.progress >= 0 &&
        t.progress <= LAST_TRACK_STEP &&
        trackIndexFor(t.seat, t.progress) === toIdx,
    )
    if (friend) score += 32
  }

  // Baseline: make progress.
  score += move.to * 0.9

  const noise = NOISE[difficulty]
  return score + (noise ? (Math.random() - 0.5) * noise : 0)
}

export function chooseMove(
  tokens: Token[],
  seat: Seat,
  moves: Move[],
  difficulty: Difficulty = 'sharp',
): Move | null {
  if (moves.length === 0) return null
  let best = moves[0]
  let bestScore = -Infinity
  for (const move of moves) {
    const s = scoreMove(tokens, seat, move, difficulty)
    if (s > bestScore) {
      bestScore = s
      best = move
    }
  }
  return best
}
