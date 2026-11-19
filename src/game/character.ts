import type { Seat } from './rules'

export const VARSITY = 4
export const CREW = ['Ruby', 'Jade', 'Amber', 'Sapphire', 'Varsity'] as const
export type CharacterModel = Seat | typeof VARSITY
export const FACE_SIZE = 64

export interface Character {
  model: CharacterModel
  /** Opaque model ID on the game server. Older clients display Varsity. */
  avatarId?: string
  /** 68 image-space landmark pairs estimated from the selected portrait. */
  fit?: string
  /** Base64 RGB pixels, top row first. Contains no source image metadata. */
  face?: string
}

export function isCharacter(value: unknown): value is Character {
  if (!value || typeof value !== 'object' || !('model' in value)) return false
  if ('avatarId' in value) return value.model === VARSITY && typeof value.avatarId === 'string'
    && /^[a-f0-9]{64}$/.test(value.avatarId) && !('face' in value) && !('fit' in value)
  return typeof value.model === 'number' && Number.isInteger(value.model) && value.model >= 0 && value.model < CREW.length
    && (value.model !== VARSITY || !('face' in value) || ('fit' in value && typeof value.fit === 'string' && /^[A-Za-z0-9+/]{182}==$/.test(value.fit)))
    && (!('face' in value) || (typeof value.face === 'string' && value.face.length === FACE_SIZE * FACE_SIZE * 4
      && /^[A-Za-z0-9+/]+$/.test(value.face)))
}
