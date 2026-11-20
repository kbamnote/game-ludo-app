import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Profile {
  accountId: string | null
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
  lastSpinPrize: number
  ownedBadges: string[]
  badge: string
  animateWheel: boolean
  cupWins: number
  seasonPoints: number
  claimedMilestones: number[]
  claimMilestone: (goal: number) => boolean
  cupRound: number
  lastCupMatch: number
  spinWheel: () => number | null
  rollLucky: (guess: LuckyGuess) => { dice: [number, number]; reward: number } | null
  equipBadge: (id: string) => boolean
  finishCupRound: (round: number, matchId: number, won: boolean) => void
  toggleWheel: () => void

  addCoins: (n: number) => void
  addGems: (n: number) => void
  spendCoins: (n: number) => boolean
  claimChest: () => number
}

const CHEST_COOLDOWN = 3 * 60 * 60 * 1000
export const SPIN_COOLDOWN = 24 * 60 * 60 * 1000
export const WHEEL_PRIZES = [100, 250, 75, 500, 150, 300]
export type LuckyGuess = 'Under 7' | 'Exactly 7' | 'Over 7'
export const BADGES = [
  { id: 'sapphire', name: 'Sapphire', color: '#55b9ff', dark: '#174588', price: 0 },
  { id: 'ruby', name: 'Ruby', color: '#ff6780', dark: '#8d203f', price: 300 },
  { id: 'jade', name: 'Jade', color: '#56e6a3', dark: '#176b51', price: 400 },
  { id: 'amber', name: 'Amber', color: '#ffda59', dark: '#925121', price: 600 },
]
export const CUP_ROUNDS = ['Quarterfinal', 'Semifinal', 'Final']
export const MILESTONES = [{ goal: 3, gems: 10 }, { goal: 8, gems: 25 }, { goal: 15, gems: 50 }]

export const useProfile = create<Profile>()(
  persist(
    (set, get) => ({
      accountId: null,
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
      lastSpinPrize: 0,
      ownedBadges: ['sapphire'],
      badge: 'sapphire',
      animateWheel: true,
      cupWins: 0,
      seasonPoints: 0,
      claimedMilestones: [],
      claimMilestone: (goal) => {
        const state = get()
        const prize = MILESTONES.find((item) => item.goal === goal)
        if (!prize || state.seasonPoints < goal || state.claimedMilestones.includes(goal)) return false
        set({ gems: state.gems + prize.gems, claimedMilestones: [...state.claimedMilestones, goal] })
        return true
      },
      cupRound: 0,
      lastCupMatch: 0,

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

      spinWheel: () => {
        const state = get()
        if (!spinReady(state.lastSpinAt)) return null
        const index = Math.floor(Math.random() * WHEEL_PRIZES.length)
        const prize = WHEEL_PRIZES[index]
        set({ lastSpinAt: Date.now(), lastSpinPrize: prize, coins: state.coins + prize, luckyRolls: state.luckyRolls + 1, seasonPoints: state.seasonPoints + 1 })
        return index
      },
      rollLucky: (guess) => {
        const state = get()
        if (!state.luckyRolls) return null
        const face = () => Math.floor(Math.random() * 6) + 1
        const dice: [number, number] = [face(), face()]
        const sum = dice[0] + dice[1]
        const result: LuckyGuess = sum < 7 ? 'Under 7' : sum > 7 ? 'Over 7' : 'Exactly 7'
        const reward = result === guess ? (sum === 7 ? 300 : 100) : 0
        set({ coins: state.coins + reward, luckyRolls: state.luckyRolls - 1, seasonPoints: state.seasonPoints + 1 })
        return { dice, reward }
      },
      equipBadge: (id) => {
        const item = BADGES.find((b) => b.id === id)
        if (!item) return false
        const state = get()
        const owned = state.ownedBadges.includes(id)
        if (!owned && state.coins < item.price) return false
        set({ badge: id, coins: state.coins - (owned ? 0 : item.price),
          ownedBadges: owned ? state.ownedBadges : [...state.ownedBadges, id] })
        return true
      },
      finishCupRound: (round, matchId, won) => {
        const state = get()
        if (state.lastCupMatch === matchId || state.cupRound !== round) return
        const champion = won && round === CUP_ROUNDS.length - 1
        set({ lastCupMatch: matchId, cupRound: won && !champion ? round + 1 : 0,
          cupWins: state.cupWins + Number(champion), coins: state.coins + (champion ? 1000 : 0),
          seasonPoints: state.seasonPoints + Number(won) })
      },
      toggleWheel: () => set({ animateWheel: !get().animateWheel }),
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
