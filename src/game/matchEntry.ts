export const ENTRY_TIERS = [100, 300, 500, 1000, 2000] as const
export type CoinEntry = typeof ENTRY_TIERS[number]
