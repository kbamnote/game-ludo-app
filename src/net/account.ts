import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { getRandomBytesAsync } from 'expo-crypto'
import { createURL } from 'expo-linking'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'
import { type CharacterModel } from '../game/character'
import { identityReady, useIdentity } from '../game/identity'
import { useProfile } from '../game/profile'
import { SERVER_URL } from './config'

export type Provider = 'google' | 'facebook'
type Account = { id: string; name: string; coins: number; diamonds: number; avatar: CharacterModel | null }
type Session = { token: string; account: Account }

const sessionKey = 'cgp.account-session'
const guestKey = 'cgp.guest-key'
const oauthKey = 'cgp.oauth-key'
const storage = Platform.OS === 'web' ? AsyncStorage : {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
}

class AccountError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}

async function request<T>(path: string, options: { method?: string; data?: object; token?: string } = {}) {
  const aborter = new AbortController()
  const timeout = setTimeout(() => aborter.abort(), 10000)
  try {
    const response = await fetch(SERVER_URL + '/auth/' + path, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.data && { 'Content-Type': 'application/json' }),
        ...(options.token && { Authorization: 'Bearer ' + options.token }),
      },
      body: options.data && JSON.stringify(options.data),
      signal: aborter.signal,
    })
    if (response.status === 404) throw new AccountError(404, 'The sign-in server is being set up. Please try again later.')
    const data = await response.json()
    if (!response.ok) throw new AccountError(response.status, data.error ?? 'Sign-in is temporarily unavailable.')
    return data as T
  } catch (error) {
    if (error instanceof AccountError) throw error
    throw new AccountError(0, 'Could not reach the sign-in server. Check your connection and try again.')
  } finally {
    clearTimeout(timeout)
  }
}

export const useAccount = create<{ session: Session | null; ready: boolean }>(() => ({ session: null, ready: false }))
let restoration: Promise<void> | undefined

async function activate(session: Session) {
  const identity = await identityReady()
  if (!useProfile.persist.hasHydrated()) await useProfile.persist.rehydrate()
  const { account } = session
  if (useProfile.getState().accountId !== account.id) {
    useProfile.setState({
      ...useProfile.getInitialState(),
      accountId: account.id, name: account.name, level: 1, xp: 0,
      coins: account.coins, gems: account.diamonds, nextChestAt: Date.now(),
    })
  }
  if (identity.playerId !== account.id || (!identity.character && account.avatar !== null)) {
    useIdentity.setState({
      playerId: account.id,
      name: identity.playerId === account.id ? identity.name : account.name,
      named: identity.playerId === account.id && identity.named,
      character: account.avatar === null ? null : { model: account.avatar },
    })
  }
  useAccount.setState({ session })
}

async function accept(session: Session) {
  await storage.setItem(sessionKey, JSON.stringify(session))
  await activate(session)
}

export function restoreAccount() {
  restoration ??= (async () => {
    try {
      const saved = await storage.getItem(sessionKey)
      if (!saved) return
      const session = JSON.parse(saved) as Session
      try {
        const account = await request<Account>('me', { token: session.token })
        await accept({ ...session, account })
      } catch (error) {
        if (error instanceof AccountError && error.status === 401) await storage.removeItem(sessionKey)
        else await activate(session)
      }
    } catch (error) {
      console.warn('[auth] Could not restore session', error instanceof Error ? error.name : '')
    } finally {
      useAccount.setState({ ready: true })
    }
  })()
  return restoration
}

export async function playAsGuest() {
  let key = await storage.getItem(guestKey)
  if (!key) {
    const bytes = await getRandomBytesAsync(32)
    key = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
    await storage.setItem(guestKey, key)
  }
  await accept(await request<Session>('guest', { method: 'POST', data: { key } }))
}

export async function startProvider(provider: Provider) {
  const web = Platform.OS === 'web'
  const expoGoReturnUrl = !web && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? createURL('onboarding') : undefined
  try {
    const result = await request<{ url: string; requestKey: string; returnTarget?: string }>('oauth/start', {
      method: 'POST', data: { provider, web, expoGoReturnUrl },
    })
    if (expoGoReturnUrl && result.returnTarget !== 'expoGo') {
      throw new Error(`Deploy the updated backend and set AUTH_EXPO_GO_RETURN_URL to ${expoGoReturnUrl}.`)
    }
    await storage.setItem(oauthKey, result.requestKey)
    return result.url
  } catch (error) {
    if (expoGoReturnUrl && error instanceof AccountError && error.status === 409) {
      throw new Error(`In Railway, set AUTH_EXPO_GO_RETURN_URL to ${expoGoReturnUrl}, then deploy.`)
    }
    throw error
  }
}

export async function finishProvider(receipt: string) {
  const requestKey = await storage.getItem(oauthKey)
  if (!requestKey) throw new Error('Start sign-in on this device and try again.')
  await accept(await request<Session>('oauth/result', { method: 'POST', data: { requestKey, receipt } }))
  await storage.removeItem(oauthKey)
}

export function cancelProvider() {
  return storage.removeItem(oauthKey)
}

export async function logOut() {
  await cancelProvider()
  await storage.removeItem(sessionKey)
  useAccount.setState({ session: null })
}

export async function chooseAvatar(avatar: CharacterModel) {
  const session = useAccount.getState().session
  if (!session) throw new Error('Please sign in first.')
  const account = await request<Account>('avatar', { method: 'PUT', token: session.token, data: { avatar } })
  useIdentity.getState().equipCharacter({ model: avatar })
  await accept({ ...session, account })
}
