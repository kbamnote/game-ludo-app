import { useContext, type ComponentProps } from 'react'
import { Pressable } from 'react-native'
import { ButtonAudio } from '../game/AppAudio'

export default function SoundPressable({ onPress, ...props }: ComponentProps<typeof Pressable>) {
  const playPress = useContext(ButtonAudio)
  return <Pressable {...props} android_disableSound onPress={onPress && (event => {
    onPress(event)
    playPress()
  })} />
}
