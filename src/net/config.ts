import Constants from 'expo-constants'

/**
 * Where the room server lives.
 *
 * Set `EXPO_PUBLIC_SERVER_URL` for a build (Expo inlines `EXPO_PUBLIC_*` at
 * bundle time), or `extra.serverUrl` in app.json. The localhost fallback only
 * works in the web preview or a simulator on the same machine — a physical
 * phone cannot reach your PC's localhost, so point it at the deployed URL or
 * your machine's LAN address.
 */
const fromEnv = process.env.EXPO_PUBLIC_SERVER_URL
const fromConfig = (Constants.expoConfig?.extra as { serverUrl?: string } | undefined)?.serverUrl

export const SERVER_URL = (fromEnv || fromConfig || 'http://localhost:8080').replace(/\/+$/, '')

export const IS_LOCAL_SERVER = /localhost|127\.0\.0\.1|^https?:\/\/10\.|^https?:\/\/192\.168\./.test(SERVER_URL)
