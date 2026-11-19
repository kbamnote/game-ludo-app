import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { isCharacter, type Character } from './character'

/**
 * Who this device is in an online room. No account and no password — a random
 * id generated once plus a nickname the player can change.
 */
export interface Identity {
  playerId: string
  name: string
  /** False until the player has picked a name, so we can prompt once. */
  named: boolean
  hydrated: boolean
  character: Character | null
  equipCharacter: (character: Character | null) => void

  setName: (name: string) => void
}

function newPlayerId() {
  const rand = () => Math.random().toString(36).slice(2, 10)
  return `p_${Date.now().toString(36)}_${rand()}`
}

const SUGGESTIONS = ['Rolot', 'Dicey', 'Pawnstar', 'SixSeeker', 'Blue', 'Amber', 'Ruby', 'Jade']

export function suggestName() {
  const base = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]
  return `${base}${Math.floor(10 + Math.random() * 90)}`
}

export const useIdentity = create<Identity>()(
  persist(
    (set) => ({
      playerId: newPlayerId(),
      name: suggestName(),
      named: false,
      hydrated: false,
      character: null,
      equipCharacter: (character) => set({ character }),
      setName: (name) => set({ name: name.trim().slice(0, 16) || suggestName(), named: true }),
    }),
    {
      name: 'ludo-after-dark-identity',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ playerId: s.playerId, name: s.name, named: s.named, character: s.character }),
      merge: (saved, current) => {
        const previous = saved as Partial<Identity> | null
        return { ...current, ...previous, character: isCharacter(previous?.character) ? previous.character : null }
      },
      onRehydrateStorage: () => (state) => {
        // Mark hydration so the net layer waits for the persisted id rather
        // than connecting with a freshly generated one.
        useIdentity.setState({ hydrated: true, ...(state ? {} : {}) })
      },
    },
  ),
)

/** Resolves once the persisted identity has been read back from storage. */
export function identityReady(): Promise<Identity> {
  const current = useIdentity.getState()
  if (current.hydrated) return Promise.resolve(current)
  return new Promise((resolve) => {
    const unsub = useIdentity.subscribe((s) => {
      if (s.hydrated) {
        unsub()
        resolve(s)
      }
    })
  })
}
