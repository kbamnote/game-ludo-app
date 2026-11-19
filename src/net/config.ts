import Constants from 'expo-constants'
import { getBundleOrigin } from 'expo/internal/bundle-origin'
import { Platform } from 'react-native'

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

const configured = (fromEnv || fromConfig || 'http://localhost:8080').replace(/\/+$/, '')
// A USB-launched Expo Go session reaches Metro and the local backend via adb reverse.
const usbPreview = __DEV__ && Platform.OS === 'android' &&
  /^http:\/\/(?:localhost|127\.0\.0\.1)(?=[:/]|$)/.test(getBundleOrigin() ?? '')
export const SERVER_URL = usbPreview && fromEnv
  ? configured.replace(/^http:\/\/(?:192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?=[:/]|$)/, 'http://127.0.0.1')
  : configured

export const IS_LOCAL_SERVER = /localhost|127\.0\.0\.1|^https?:\/\/10\.|^https?:\/\/192\.168\./.test(SERVER_URL)
