import { io, type Socket } from 'socket.io-client'
import { create } from 'zustand'
import { SERVER_URL } from './config'
import { identityReady, useIdentity } from '../game/identity'
import { useMatch, type PlayerConfig, type Phase } from '../game/store'
import type { Seat, Token } from '../game/rules'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface RoomMember {
  playerId: string
  name: string
  seat: Seat | null
  ready: boolean
  connected: boolean
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
}

interface OnlineState {
  status: ConnectionStatus
  error: string | null
  busy: boolean
  room: RoomSnapshot | null

  connect: () => Promise<void>
  createRoom: (publicTable?: boolean) => Promise<boolean>
  joinRoom: (code: string) => Promise<boolean>
  setReady: (ready: boolean) => void
  startMatch: () => Promise<boolean>
  leaveRoom: () => void
  clearError: () => void
}

let socket: Socket | null = null

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
    .map((m) => ({ seat: m.seat, name: m.name, kind: 'human' as const }))
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
        const { playerId, name } = useIdentity.getState()
        socket.emit('identify', { playerId, name })
        set({ status: 'connected' })
        return
      }
      set({ status: 'connecting', error: null })

      const identity = await identityReady()

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
          socket?.emit('identify', { playerId: id.playerId, name: id.name })
          set({ status: 'connected', error: null })

          // Re-enter the room after a drop so a flaky network does not end the match.
          const code = get().room?.code
          restoringRoom = Boolean(code)
          if (code) socket?.emit('room:join', { code })
        })

        socket.on('disconnect', () => set({ status: 'reconnecting' }))
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
      socket.emit('identify', { playerId: identity.playerId, name: identity.name })
    },

    createRoom: async (publicTable = false) => {
      set({ busy: true, error: null })
      await get().connect()
      const ack = await emitAck(publicTable ? 'room:quick' : 'room:create')
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
      const ack = await emitAck('room:join', { code: code.trim() })
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

    clearError: () => set({ error: null }),
  }
})
