import { create } from 'zustand'
import type { Character } from './character'
import { presentationMs } from './moveTiming'
import { chooseMove, type Difficulty } from './ai'
import {
  applyMove,
  createTokens,
  grantsExtraTurn,
  hasWon,
  legalMoves,
  rollDie,
  YARD,
  type Move,
  type Seat,
  type Token,
} from './rules'

export type PlayerKind = 'human' | 'bot'

export interface PlayerConfig {
  seat: Seat
  name: string
  kind: PlayerKind
  difficulty?: Difficulty
  character?: Character | null
}

export type Phase =
  /** Waiting for the seat to tap the dice. */
  | 'await-roll'
  /** Dice is tumbling; the value is already decided. */
  | 'rolling'
  /** Dice settled, seat must pick a token. */
  | 'await-move'
  /** A token is walking its path. */
  | 'moving'
  | 'ended'

export interface MoveAnimation {
  startedAt: number
  before: Token[]
  tokenId: string
  seat: Seat
  tokenIndex: number
  /** Progress values to walk through, in order. */
  path: number[]
  captures: string[]
}

export interface LogEntry {
  id: number
  seat: Seat
  text: string
}

/** Where the authority for this match lives. */
export type MatchMode = 'local' | 'online'
export type LocalVariant = 'classic' | 'teams' | 'quick'

/** A move the server has already resolved, waiting to be animated. */
export interface PendingServerMove {
  tokenId: string
  path: number[]
  captures: string[]
  tokens: Token[]
  current: Seat
  die: number | null
  phase: Phase
  ranking: Seat[]
  movableTokenIds: string[]
}

export interface MatchState {
  mode: MatchMode
  variant: LocalVariant
  /** Which seat this device controls online; null when playing locally. */
  mySeat: Seat | null
  /** Set by the net layer so roll/pick can be forwarded to the server. */
  netRoll: (() => void) | null
  netMove: ((tokenId: string) => void) | null
  pendingServer: PendingServerMove | null

  players: PlayerConfig[]
  seats: Seat[]
  tokens: Token[]
  current: Seat
  die: number | null
  passedRoll: { seat: Seat; die: number; reason: 'no-move' | 'three-sixes' } | null
  phase: Phase
  moves: Move[]
  animation: MoveAnimation | null
  consecutiveSixes: number
  /** Seats in finishing order. */
  ranking: Seat[]
  log: LogEntry[]
  turnCount: number
  startedAt: number

  start: (players: PlayerConfig[], variant?: LocalVariant) => void
  /** Hand control of this match to a server. */
  attachServer: (opts: {
    players: PlayerConfig[]
    mySeat: Seat
    roll: () => void
    move: (tokenId: string) => void
  }) => void
  applyServerState: (s: {
    tokens: Token[]
    current: Seat
    die: number | null
    phase: Phase
    ranking: Seat[]
    movableTokenIds: string[]
  }, resync?: boolean) => void
  applyServerMove: (m: PendingServerMove) => void
  detachServer: () => void
  roll: () => void
  settleRoll: () => void
  pickToken: (tokenId: string) => void
  finishAnimation: () => void
  reset: () => void
}

let logId = 0
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function later(fn: () => void, ms: number) {
  clearTimer()
  timer = setTimeout(fn, ms)
}

function pathFor(move: Move): number[] {
  if (move.from === YARD) return [0]
  const steps: number[] = []
  for (let p = move.from + 1; p <= move.to; p++) steps.push(p)
  return steps
}

/**
 * The server sends only the ids of movable tokens. The UI uses `moves` purely
 * to decide what is tappable, so a stub carrying the id is enough.
 */
function movesFromIds(ids: string[]): Move[] {
  return ids.map((tokenId) => ({ tokenId, from: 0, to: 0, captures: [], finishes: false, entersBoard: false }))
}

function nameOf(players: PlayerConfig[], seat: Seat) {
  return players.find((p) => p.seat === seat)?.name ?? `Seat ${seat + 1}`
}

export const useMatch = create<MatchState>((set, get) => {
  const queued: MoveAnimation[] = []
  const present = (animation: MoveAnimation) => {
    animation.startedAt = Date.now()
    set({ phase: 'moving', animation })
    later(() => {
      if (get().animation === animation) get().finishAnimation()
    }, presentationMs(animation.path.length, animation.captures.length))
  }
  const appendLog = (seat: Seat, text: string) => {
    set({ log: [...get().log, { id: ++logId, seat, text }].slice(-40) })
  }

  /** Bots roll by themselves a beat after their turn opens. */
  const maybeBot = () => {
    const { players, current, phase } = get()
    const player = players.find((p) => p.seat === current)
    if (player?.kind === 'bot' && phase === 'await-roll') {
      later(() => get().roll(), 700)
    }
  }

  const advance = (reason?: 'no-move' | 'three-sixes') => {
    const { seats, current, die, ranking, turnCount } = get()
    const remaining = seats.filter((s) => !ranking.includes(s))
    if (remaining.length === 0) {
      set({ phase: 'ended' })
      return
    }
    const pos = seats.indexOf(current)
    let next = remaining[0]
    for (let i = 1; i <= seats.length; i++) {
      const candidate = seats[(pos + i) % seats.length]
      if (!ranking.includes(candidate)) {
        next = candidate
        break
      }
    }
    set({
      current: next,
      passedRoll: reason && die !== null ? { seat: current, die, reason } : null,
      phase: 'await-roll',
      moves: [],
      consecutiveSixes: 0,
      turnCount: turnCount + 1,
    })
    maybeBot()
  }

  return {
    mode: 'local',
    variant: 'classic',
    mySeat: null,
    netRoll: null,
    netMove: null,
    pendingServer: null,

    players: [],
    seats: [],
    tokens: [],
    current: 0,
    die: null,
    passedRoll: null,
    phase: 'await-roll',
    moves: [],
    animation: null,
    consecutiveSixes: 0,
    ranking: [],
    log: [],
    turnCount: 0,
    startedAt: 0,

    start: (players, variant = 'classic') => {
      clearTimer()
      queued.length = 0
      const seats = players.map((p) => p.seat)
      set({
        mode: 'local',
        variant,
        mySeat: null,
        netRoll: null,
        netMove: null,
        pendingServer: null,
        players,
        seats,
        tokens: createTokens(seats),
        current: seats[0],
        die: null,
        passedRoll: null,
        phase: 'await-roll',
        moves: [],
        animation: null,
        consecutiveSixes: 0,
        ranking: [],
        log: [{ id: ++logId, seat: seats[0], text: `${nameOf(players, seats[0])} opens the match` }],
        turnCount: 0,
        startedAt: Date.now(),
      })
      maybeBot()
    },

    roll: () => {
      const { phase, mode, mySeat, current, netRoll } = get()
      if (phase !== 'await-roll') return

      if (mode === 'online') {
        // The server owns the dice; it will broadcast the result.
        if (mySeat !== current) return
        netRoll?.()
        return
      }

      set({ phase: 'rolling', die: rollDie(), passedRoll: null })
      later(() => get().settleRoll(), 900)
    },

    settleRoll: () => {
      const state = get()
      const { tokens, current, players } = state
      const die = state.die ?? 1
      const sixes = die === 6 ? state.consecutiveSixes + 1 : 0

      // Three sixes in a row burns the turn.
      if (sixes >= 3) {
        appendLog(current, `${nameOf(players, current)} rolled three sixes — turn forfeited`)
        set({ consecutiveSixes: 0 })
        advance('three-sixes')
        return
      }

      const moves = legalMoves(tokens, current, die, state.variant === 'teams')
      set({ moves, consecutiveSixes: sixes })

      if (moves.length === 0) {
        appendLog(current, `${nameOf(players, current)} rolled ${die} — no legal move`)
        if (die === 6) {
          set({ phase: 'await-roll' })
          maybeBot()
        } else {
          advance('no-move')
        }
        return
      }

      const player = players.find((p) => p.seat === current)
      set({ phase: 'await-move' })

      if (player?.kind === 'bot') {
        const choice = chooseMove(tokens, current, moves, player.difficulty ?? 'sharp')
        if (choice) later(() => get().pickToken(choice.tokenId), 620)
        return
      }

      // A human with a single forced move plays it automatically.
      if (moves.length === 1) {
        later(() => get().pickToken(moves[0].tokenId), 380)
      }
    },

    pickToken: (tokenId) => {
      const { phase, moves, tokens, mode, mySeat, current, netMove } = get()
      if (phase !== 'await-move') return

      if (mode === 'online') {
        if (mySeat !== current) return
        netMove?.(tokenId)
        return
      }

      const move = moves.find((m) => m.tokenId === tokenId)
      if (!move) return
      const token = tokens.find((t) => t.id === tokenId)
      if (!token) return

      set({ tokens: applyMove(tokens, move) })
      present({
        before: tokens,
        startedAt: 0,
        tokenId,
        seat: token.seat,
        tokenIndex: token.index,
        path: pathFor(move),
        captures: move.captures,
      })
    },

    finishAnimation: () => {
      const state = get()
      const { animation, tokens, moves, players, current, seats } = state
      if (!animation) return

      if (state.mode === 'online') {
        const next = queued.shift()
        if (next) {
          present(next)
          return
        }
        const pending = state.pendingServer
        set({
          animation: null,
          pendingServer: null,
          ...(pending
            ? {
                tokens: pending.tokens,
                current: pending.current,
                die: pending.die,
                phase: pending.phase,
                ranking: pending.ranking,
                moves: movesFromIds(pending.movableTokenIds),
              }
            : {}),
        })
        return
      }
      const move = moves.find((m) => m.tokenId === animation.tokenId)
      if (!move) {
        set({ animation: null })
        return
      }

      const next = tokens
      const die = state.die ?? 0
      const who = nameOf(players, current)

      if (move.captures.length) {
        appendLog(current, `${who} knocked out ${move.captures.length} token${move.captures.length > 1 ? 's' : ''}`)
      } else if (move.finishes) {
        appendLog(current, `${who} brought a token home`)
      } else if (move.entersBoard) {
        appendLog(current, `${who} opened a token with a six`)
      }

      set({ animation: null, moves: [] })

      const ranking = [...state.ranking]
      const partner = ((current + 2) % 4) as Seat
      if (state.variant === 'quick' && move.finishes) {
        set({ ranking: [current], phase: 'ended' })
        clearTimer()
        return
      }
      if (state.variant === 'teams' && hasWon(next, current) && hasWon(next, partner)) {
        set({ ranking: [current, partner], phase: 'ended' })
        clearTimer()
        return
      }
      if (hasWon(next, current) && !ranking.includes(current)) {
        ranking.push(current)
        appendLog(current, `${who} finished #${ranking.length}`)
        set({ ranking })
      }

      const remaining = seats.filter((s) => !ranking.includes(s))
      if (remaining.length <= 1) {
        for (const s of remaining) if (!ranking.includes(s)) ranking.push(s)
        set({ ranking, phase: 'ended' })
        clearTimer()
        return
      }

      if (grantsExtraTurn(die, move) && !ranking.includes(current)) {
        set({ phase: 'await-roll' })
        maybeBot()
        return
      }

      advance()
    },

    attachServer: ({ players, mySeat, roll, move }) => {
      clearTimer()
      queued.length = 0
      set({
        mode: 'online',
        variant: 'classic',
        mySeat,
        netRoll: roll,
        netMove: move,
        pendingServer: null,
        players,
        seats: players.map((p) => p.seat),
        tokens: createTokens(players.map((p) => p.seat)),
        current: players[0]?.seat ?? 0,
        die: null,
        passedRoll: null,
        phase: 'await-roll',
        moves: [],
        animation: null,
        ranking: [],
        log: [],
        turnCount: 0,
        startedAt: Date.now(),
      })
    },

    /** Replace local state wholesale with the server's view. */
    applyServerState: (snap, resync = false) => {
      if (get().mode !== 'online') return
      if (resync) {
        clearTimer()
        queued.length = 0
      } else {
        const pending = get().pendingServer
        if (pending && get().animation) {
          set({ tokens: snap.tokens, pendingServer: { ...pending, ...snap } })
          return
        }
      }
      set({
        animation: null, pendingServer: null,
        tokens: snap.tokens,
        current: snap.current,
        die: snap.die,
        phase: snap.phase,
        ranking: snap.ranking,
        moves: movesFromIds(snap.movableTokenIds),
      })
    },

    /** Animate a move the server already resolved, then adopt its state. */
    applyServerMove: (m) => {
      if (get().mode !== 'online') return
      const before = get().tokens
      const token = before.find((t) => t.id === m.tokenId)
      if (!token || !m.path.length) {
        get().applyServerState(m, true)
        return
      }
      if (token.progress === m.path[m.path.length - 1]) return
      const animation: MoveAnimation = {
        before, startedAt: 0,
        tokenId: m.tokenId,
        seat: token.seat,
        tokenIndex: token.index,
        path: m.path,
        captures: m.captures,
      }
      set({ tokens: m.tokens, pendingServer: m })
      if (get().animation) queued.push(animation)
      else present(animation)
    },

    detachServer: () => {
      clearTimer()
      queued.length = 0
      set({ mode: 'local', mySeat: null, netRoll: null, netMove: null, pendingServer: null, animation: null })
    },

    reset: () => {
      clearTimer()
      queued.length = 0
      set({
        tokens: [],
        pendingServer: null,
        players: [],
        seats: [],
        phase: 'await-roll',
        die: null,
        passedRoll: null,
        moves: [],
        animation: null,
        ranking: [],
        log: [],
      })
    },
  }
})
