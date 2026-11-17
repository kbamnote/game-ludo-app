import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Profile {
  name: string
  level: number
  xp: number
  coins: number
  gems: number
  activeMiniature: string
  miniatureRarity: string
  luckyRolls: number
  /** Epoch ms when the next free chest unlocks. */
  nextChestAt: number
  /** Epoch ms of the last daily spin, or 0 when never spun. */
  lastSpinAt: number

  addCoins: (n: number) => void
  addGems: (n: number) => void
  spendCoins: (n: number) => boolean
  claimChest: () => number
  markSpun: () => void
  useLuckyRoll: () => boolean
}

const CHEST_COOLDOWN = 3 * 60 * 60 * 1000
const SPIN_COOLDOWN = 24 * 60 * 60 * 1000

export const useProfile = create<Profile>()(
  persist(
    (set, get) => ({
      name: 'Alex',
      level: 42,
      xp: 7340,
      coins: 18400,
      gems: 240,
      activeMiniature: 'Conehead Pete',
      miniatureRarity: 'Rare',
      luckyRolls: 1,
      nextChestAt: Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000 + 10 * 1000,
      lastSpinAt: 0,

      addCoins: (n) => set({ coins: get().coins + n }),
      addGems: (n) => set({ gems: get().gems + n }),

      spendCoins: (n) => {
        if (get().coins < n) return false
        set({ coins: get().coins - n })
        return true
      },

      claimChest: () => {
        if (Date.now() < get().nextChestAt) return 0
        const reward = 250 + Math.floor(Math.random() * 750)
        set({ coins: get().coins + reward, nextChestAt: Date.now() + CHEST_COOLDOWN })
        return reward
      },

      markSpun: () => set({ lastSpinAt: Date.now() }),

      useLuckyRoll: () => {
        if (get().luckyRolls <= 0) return false
        set({ luckyRolls: get().luckyRolls - 1 })
        return true
      },
    }),
    {
      name: 'ludo-after-dark-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

export function spinReady(lastSpinAt: number) {
  return Date.now() - lastSpinAt >= SPIN_COOLDOWN
}

/** "02:45:10" style countdown for the chest and event timers. */
export function formatCountdown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}

/** "14h 28m 05s" style countdown for the event banner. */
export function formatEventCountdown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

export function formatCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}
