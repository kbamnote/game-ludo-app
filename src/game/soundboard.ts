export const SOUND_CLIPS = [
  { id: 17, label: 'Puneet voice', asset: require('../../assets/soundboard/clip-17.mp3') },
  { id: 18, label: 'Puneet voice 2', asset: require('../../assets/soundboard/clip-18.mp3') },
  { id: 7, label: 'Modi ji voice', asset: require('../../assets/soundboard/clip-07.mp3') },
  { id: 10, label: 'Modi ji voice 2', asset: require('../../assets/soundboard/clip-10.mp3') },
  { id: 8, label: 'Rahul Gandhi voice', asset: require('../../assets/soundboard/clip-08.mp3') },
  { id: 5, label: 'Mamta Banarjee voice', asset: require('../../assets/soundboard/clip-05.mp3') },
  { id: 1, label: 'Ae Baigan', asset: require('../../assets/soundboard/clip-01.mp3') },
  { id: 2, label: 'We are waiting for you', asset: require('../../assets/soundboard/clip-02.mp3') },
  { id: 3, label: 'Feeling proud Indian Army', asset: require('../../assets/soundboard/clip-03.mp3') },
  { id: 4, label: 'Tune', asset: require('../../assets/soundboard/clip-04.mp3') },
  { id: 6, label: 'Gian hai aap', asset: require('../../assets/soundboard/clip-06.mp3') },
  { id: 9, label: 'Wow beautiful', asset: require('../../assets/soundboard/clip-09.mp3') },
  { id: 12, label: 'Wanted tune', asset: require('../../assets/soundboard/clip-12.mp3') },
  { id: 13, label: 'America ky kehta tha', asset: require('../../assets/soundboard/clip-13.mp3') },
  { id: 14, label: 'Depression sound', asset: require('../../assets/soundboard/clip-14.mp3') },
  { id: 15, label: 'Wo alag level ka banda', asset: require('../../assets/soundboard/clip-15.mp3') },
  { id: 16, label: 'Chaloooo', asset: require('../../assets/soundboard/clip-16.mp3') },
] as const

export const DANCE_SONG = 11
export const AMBULANCE_SOUND = 19
export const DANCE_MS = 6000
const ambulanceAsset = require('../../assets/soundboard/clip-19.mp3')
const danceAsset = require('../../assets/soundboard/clip-11.mp3')

export function soundAsset(clip: number) {
  if (clip === AMBULANCE_SOUND) return ambulanceAsset
  if (clip === DANCE_SONG) return danceAsset
  return SOUND_CLIPS.find(sound => sound.id === clip)?.asset ?? null
}

export function isSoundId(value: unknown): value is number {
  return value === DANCE_SONG || SOUND_CLIPS.some(sound => sound.id === value)
}
