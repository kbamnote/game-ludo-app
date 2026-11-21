import { create } from 'zustand'
import type { Character } from './character'
import { coronationDuration, type Coronation } from './coronation'
import { LOCAL_DICE_ROLL_MS, ONLINE_DICE_ROLL_MS, presentationMs } from './moveTiming'
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

export interface DiceRoll {
  die: number
  seat: Seat
  startedAt: number
  duration: number
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
  lastRoll: DiceRoll | null
  phase: Phase
  moves: Move[]
  animation: MoveAnimation | null
  consecutiveSixes: number
  /** Seats in finishing order. */
  ranking: Seat[]
  log: LogEntry[]
  coronation: Coronation | null
  turnCount: number
  startedAt: number
  pausedAt: number | null
  pausedMs: number

  start: (players: PlayerConfig[], variant?: LocalVariant) => void
  setPaused: (paused: boolean) => void
  /** Hand control of this match to a server. */
  attachServer: (opts: {
    players: PlayerConfig[]
    mySeat: Seat
    variant?: LocalVariant
    roll: () => void
    move: (tokenId: string) => void
  }) => void
  applyServerRoll: (die: number, seat?: Seat) => void
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

export function matchTime() {
  const { pausedAt, pausedMs } = useMatch.getState()
  return (pausedAt ?? Date.now()) - pausedMs
}

function matchTimer() {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending: { run: () => void; deadline: number } | undefined

  function pause() {
    clearTimeout(timer)
    timer = undefined
  }

  function resume() {
    if (!pending || timer !== undefined) return
    timer = setTimeout(() => {
      const task = pending
      pending = undefined
      timer = undefined
      task?.run()
    }, Math.max(0, pending.deadline - matchTime()))
  }

  return {
    clear() { pause(); pending = undefined },
    later(run: () => void, ms: number) {
      pause()
      pending = { run, deadline: matchTime() + ms }
      if (useMatch.getState().pausedAt === null) resume()
    },
    pause,
    resume,
  }
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
  const { clear: clearTimer, later, pause: pauseTurn, resume: resumeTurn } = matchTimer()
  const ceremony = matchTimer()

  function celebrate(ranking: Seat[], previous: Seat[], animation: MoveAnimation) {
    const limit = get().variant === 'teams' ? 1 : 2
    const awards = ranking.slice(0, limit).filter(seat => !previous.includes(seat))
    if (!awards.length) return
    ceremony.clear()
    function begin(index: number) {
      const seat = awards[index]
      const token = get().tokens.find(item => item.id === animation.tokenId && item.seat === seat)
        ?? get().tokens.find(item => item.seat === seat)
      if (!token) { set({ coronation: null }); maybeBot(); return }
      const place = seat === ranking[0] ? 1 : 2
      set({ coronation: { seat, place, tokenId: token.id, startedAt: matchTime() } })
      ceremony.later(() => {
        if (index + 1 < awards.length) begin(index + 1)
        else {
          set({ coronation: null })
          maybeBot()
        }
      }, coronationDuration(place))
    }
    begin(0)
  }

  const present = (animation: MoveAnimation) => {
    animation.startedAt = matchTime()
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
    const { players, current, phase, coronation } = get()
    const player = players.find((p) => p.seat === current)
    if (!coronation && player?.kind === 'bot' && phase === 'await-roll') {
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
    lastRoll: null,
    passedRoll: null,
    phase: 'await-roll',
    moves: [],
    animation: null,
    consecutiveSixes: 0,
    ranking: [],
    coronation: null,
    log: [],
    turnCount: 0,
    startedAt: 0,
    pausedAt: null,
    pausedMs: 0,

    setPaused: (paused) => {
      const { mode, pausedAt, pausedMs } = get()
      if (mode === 'online' || paused === (pausedAt !== null)) return
      if (paused) {
        pauseTurn()
        ceremony.pause()
        set({ pausedAt: Date.now() })
      } else if (pausedAt !== null) {
        set({ pausedAt: null, pausedMs: pausedMs + Date.now() - pausedAt })
        resumeTurn()
        ceremony.resume()
      }
    },

    start: (players, variant = 'classic') => {
      clearTimer()
      ceremony.clear()
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
        lastRoll: null,
        passedRoll: null,
        phase: 'await-roll',
        moves: [],
        animation: null,
        consecutiveSixes: 0,
        ranking: [],
        coronation: null,
        log: [{ id: ++logId, seat: seats[0], text: `${nameOf(players, seats[0])} opens the match` }],
        turnCount: 0,
        startedAt: Date.now(),
        pausedAt: null,
        pausedMs: 0,
      })
      maybeBot()
    },

    roll: () => {
      const { phase, mode, mySeat, current, netRoll } = get()
      if (phase !== 'await-roll' || get().coronation || get().pausedAt !== null) return

      if (mode === 'online') {
        // The server owns the dice; it will broadcast the result.
        if (mySeat !== current) return
        netRoll?.()
        return
      }

      const die = rollDie()
      set({
        phase: 'rolling', die, passedRoll: null,
        lastRoll: { die, seat: current, startedAt: matchTime(), duration: LOCAL_DICE_ROLL_MS },
      })
      later(() => get().settleRoll(), LOCAL_DICE_ROLL_MS)
    },

    settleRoll: () => {
      const state = get()
      if (state.pausedAt !== null) return
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
      if (phase !== 'await-move' || get().coronation || get().pausedAt !== null) return

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
      if (!animation || state.pausedAt !== null) return

      if (state.mode === 'online') {
        const next = queued.shift()
        if (next) {
          present(next)
          return
        }
        const pending = state.pendingServer
        if (pending && (state.variant !== 'teams' || pending.phase === 'ended')) celebrate(pending.ranking, state.ranking, animation)
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
        celebrate([current], state.ranking, animation)
        set({ ranking: [current], phase: 'ended' })
        clearTimer()
        return
      }
      if (state.variant === 'teams' && hasWon(next, current) && hasWon(next, partner)) {
        celebrate([current, partner], state.ranking, animation)
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
        celebrate(ranking, state.ranking, animation)
        set({ ranking, phase: 'ended' })
        clearTimer()
        return
      }

      if (state.variant !== 'teams') celebrate(ranking, state.ranking, animation)
      if (grantsExtraTurn(die, move) && !ranking.includes(current)) {
        set({ phase: 'await-roll' })
        maybeBot()
        return
      }

      advance()
    },

    attachServer: ({ players, mySeat, variant = 'classic', roll, move }) => {
      clearTimer()
      ceremony.clear()
      queued.length = 0
      set({
        mode: 'online',
        variant,
        mySeat,
        netRoll: roll,
        netMove: move,
        pendingServer: null,
        players,
        seats: players.map((p) => p.seat),
        tokens: createTokens(players.map((p) => p.seat)),
        current: players[0]?.seat ?? 0,
        die: null,
        lastRoll: null,
        passedRoll: null,
        phase: 'await-roll',
        moves: [],
        animation: null,
        ranking: [],
        coronation: null,
        log: [],
        turnCount: 0,
        startedAt: Date.now(),
        pausedAt: null,
        pausedMs: 0,
      })
    },

    applyServerRoll: (die, seat) => {
      const state = get()
      if (state.mode !== 'online') return
      set({ lastRoll: { die, seat: seat ?? state.current, startedAt: matchTime(), duration: ONLINE_DICE_ROLL_MS } })
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
        ...(resync ? { lastRoll: null } : {}),
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
      ceremony.clear()
      queued.length = 0
      set({ mode: 'local', mySeat: null, netRoll: null, netMove: null, pendingServer: null, animation: null, lastRoll: null, coronation: null,
        pausedAt: null, pausedMs: 0 })
    },

    reset: () => {
      clearTimer()
      ceremony.clear()
      queued.length = 0
      set({
        tokens: [],
        pendingServer: null,
        players: [],
        seats: [],
        phase: 'await-roll',
        die: null,
        lastRoll: null,
        passedRoll: null,
        moves: [],
        animation: null,
        ranking: [],
        coronation: null,
        pausedAt: null,
        pausedMs: 0,
        log: [],
      })
    },
  }
})
