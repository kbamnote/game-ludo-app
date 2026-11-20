import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { SERVER_URL } from './config'
import { useAccount } from './account'
import { identityReady, useIdentity } from '../game/identity'
import { useMatch, type PlayerConfig, type Phase } from '../game/store'
import type { Seat, Token } from '../game/rules'
import { isCharacter, type Character } from '../game/character'
import { REACTIONS, type ReactionKind, type ReactionRequest } from '../game/reactions'
import { isSoundId } from '../game/soundboard'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

function identification() {
  const { playerId, name } = useIdentity.getState()
  return { playerId, name, token: useAccount.getState().session?.token }
}

export interface RoomMember {
  playerId: string
  name: string
  seat: Seat | null
  ready: boolean
  connected: boolean
  character?: Character
}

export interface RoomSnapshot {
  publicTable?: boolean
  code: string
  hostId: string
  phase: 'lobby' | 'playing' | 'finished'
  members: RoomMember[]
  match: {
    seats: Seat[]
    tokens: Token[]
    current: Seat
    die: number | null
    phase: Phase
    movableTokenIds: string[]
    ranking: Seat[]
    deadline: number
  } | null
}

interface Ack {
  ok: boolean
  error?: string
  snapshot?: RoomSnapshot
  ticket?: string
}

export async function requestMatchVoice() {
  const ack = await emitAck('match:voice')
  if (!ack.ok || !ack.ticket || !/^[A-Za-z0-9_-]{32}$/.test(ack.ticket)) {
    throw Error(ack.error ?? 'Match voice is unavailable on this server.')
  }
  return SERVER_URL + '/voice/#match=' + encodeURIComponent(ack.ticket)
}

interface OnlineState {
  status: ConnectionStatus
  error: string | null
  busy: boolean
  room: RoomSnapshot | null

  connect: () => Promise<void>
  disconnect: () => void
  createRoom: (publicTable?: boolean) => Promise<boolean>
  joinRoom: (code: string) => Promise<boolean>
  setReady: (ready: boolean) => void
  startMatch: () => Promise<boolean>
  leaveRoom: () => void
  clearError: () => void
}

let socket: Socket | null = null
const reactionListeners = new Set<(reaction: ReactionRequest) => void>()
const soundListeners = new Set<(clip: number) => void>()
export function onMatchSound(listener: (clip: number) => void) {
  soundListeners.add(listener)
  return () => { soundListeners.delete(listener) }
}
export async function sendMatchSound(clip: number) {
  const ack = await emitAck('match:sound', { clip })
  if (!ack.ok) throw Error(ack.error ?? 'Could not play the sound.')
}
export function onMatchReaction(listener: (reaction: ReactionRequest) => void) {
  reactionListeners.add(listener)
  return () => { reactionListeners.delete(listener) }
}
export async function sendMatchReaction(kind: ReactionKind, to: Seat) {
  const ack = await emitAck('match:reaction', { kind, to })
  if (!ack.ok) throw Error(ack.error ?? 'Could not send the reaction.')
}

function emitAck(event: string, payload: unknown = {}): Promise<Ack> {
  return new Promise((resolve) => {
    if (!socket) return resolve({ ok: false, error: 'Not connected' })
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve({ ok: false, error: 'Server did not respond' })
      }
    }, 10_000)

    socket.emit(event, payload, (ack: Ack) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(ack ?? { ok: false, error: 'Empty response' })
    })
  })
}

/** Turn the server's member list into the seat config the match store wants. */
function playersFrom(room: RoomSnapshot): PlayerConfig[] {
  return room.members
    .filter((m): m is RoomMember & { seat: Seat } => m.seat !== null)
    .sort((a, b) => a.seat - b.seat)
    .map((m) => ({
      seat: m.seat, name: m.name, kind: 'human' as const,
      character: isCharacter(m.character) ? m.character :
        m.playerId === useIdentity.getState().playerId ? useIdentity.getState().character : null,
    }))
}

export const useOnline = create<OnlineState>((set, get) => {
  /** Point the match store at this socket and seed it from the room. */
  const bindMatch = (room: RoomSnapshot) => {
    const me = useIdentity.getState().playerId
    const mySeat = room.members.find((m) => m.playerId === me)?.seat
    if (mySeat === null || mySeat === undefined) return

    useMatch.getState().attachServer({
      players: playersFrom(room),
      mySeat,
      roll: () => socket?.emit('match:roll', {}),
      move: (tokenId: string) => socket?.emit('match:move', { tokenId }),
    })

    if (room.match) useMatch.getState().applyServerState(room.match)
  }

  return {
    status: 'idle',
    error: null,
    busy: false,
    room: null,

    connect: async () => {
      if (socket?.connected) {
        socket.emit('identify', identification())
        set({ status: 'connected' })
        return
      }
      set({ status: 'connecting', error: null })

      await identityReady()

      if (!socket) {
        let restoringRoom = false
        socket = io(SERVER_URL, {
          // Prefer websocket, but keep long-polling as a fallback: some mobile
          // carriers and corporate Wi-Fi block raw websocket upgrades.
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 800,
          timeout: 10_000,
        })

        socket.on('connect', () => {
          const id = useIdentity.getState()
          socket?.emit('identify', identification())
          set({ status: 'connected', error: null })

          // Re-enter the room after a drop so a flaky network does not end the match.
          const code = get().room?.code
          restoringRoom = Boolean(code)
          if (code) socket?.emit('room:join', { code, character: id.character })
        })

        socket.on('disconnect', () => set({ status: 'reconnecting' }))
        socket.on('match:reaction', (event: (ReactionRequest & { roomCode: string }) | null) => {
          if (!event || event.roomCode !== get().room?.code || !REACTIONS.some(item => item.id === event.kind)) return
          for (const listener of reactionListeners) listener(event)
        })
        socket.on('match:sound', (event: { roomCode: string; clip: unknown } | null) => {
          if (!event || event.roomCode !== get().room?.code || !isSoundId(event.clip)) return
          for (const listener of soundListeners) listener(event.clip)
        })
        socket.on('connect_error', (err: Error) =>
          set({ status: 'error', error: `Cannot reach the server (${err.message})` }),
        )

        socket.on('room:state', (room: RoomSnapshot) => {
          const previous = get().room
          set({ room })

          if (room.phase === 'playing' && (previous?.phase !== 'playing' || useMatch.getState().mode !== 'online')) bindMatch(room)
          else if (room.match && useMatch.getState().mode === 'online') {
            useMatch.getState().applyServerState(room.match, restoringRoom)
          }
          restoringRoom = false
        })

        socket.on('match:started', (room: RoomSnapshot) => {
          set({ room })
          bindMatch(room)
        })

        socket.on('match:rolled', (event: { die: number }) => {
          useMatch.getState().applyServerRoll(event.die)
        })

        socket.on(
          'match:moved',
          (payload: { tokenId: string; path: number[]; captures: string[]; snapshot: RoomSnapshot }) => {
            set({ room: payload.snapshot })
            const m = payload.snapshot.match
            if (!m) return
            useMatch.getState().applyServerMove({
              tokenId: payload.tokenId,
              path: payload.path,
              captures: payload.captures,
              tokens: m.tokens,
              current: m.current,
              die: m.die,
              phase: m.phase,
              ranking: m.ranking,
              movableTokenIds: m.movableTokenIds,
            })
          },
        )
      }

      socket.connect()
      socket.emit('identify', identification())
    },

    createRoom: async (publicTable = false) => {
      set({ busy: true, error: null })
      await get().connect()
      const ack = await emitAck(publicTable ? 'room:quick' : 'room:create', { character: useIdentity.getState().character })
      set({ busy: false })
      if (!ack.ok) {
        set({ error: ack.error ?? 'Could not create the room' })
        return false
      }
      if (ack.snapshot) set({ room: ack.snapshot })
      return true
    },

    joinRoom: async (code: string) => {
      set({ busy: true, error: null })
      await get().connect()
      const ack = await emitAck('room:join', { code: code.trim(), character: useIdentity.getState().character })
      set({ busy: false })
      if (!ack.ok) {
        set({ error: ack.error ?? 'Could not join' })
        return false
      }
      if (ack.snapshot) set({ room: ack.snapshot })
      return true
    },

    setReady: (ready) => socket?.emit('room:ready', { ready }),

    startMatch: async () => {
      set({ busy: true, error: null })
      const ack = await emitAck('room:start')
      set({ busy: false })
      if (!ack.ok) {
        set({ error: ack.error ?? 'Could not start' })
        return false
      }
      return true
    },

    leaveRoom: () => {
      socket?.emit('room:leave')
      useMatch.getState().detachServer()
      set({ room: null, error: null })
    },

    disconnect: () => {
      get().leaveRoom()
      socket?.removeAllListeners().disconnect()
      socket = null
      useMatch.getState().reset()
      set({ status: 'idle', busy: false })
    },

    clearError: () => set({ error: null }),
  }
})
