import { useRef, type RefObject } from 'react'
import { StyleSheet, View } from 'react-native'
import type { Group } from 'three'
import { Canvas, useFrame } from '@react-three/fiber/native'
import type { Character } from '../game/character'
import Pawn3D, { type CharacterPose } from './Pawn3D'

interface PreviewProps {
  character: Character
  close?: boolean
  clip?: CharacterPose['clip']
  previewModel?: number
}

function Figure({ character, angle, close, clip = 'Idle', previewModel }: PreviewProps & { angle: RefObject<number> }) {
  const figure = useRef<Group>(null)
  const pose = useRef<CharacterPose>({ clip: 'Idle', seconds: 0 })
  useFrame(({ clock }) => {
    pose.current.clip = clip
    pose.current.seconds = clock.elapsedTime
    if (figure.current) figure.current.rotation.y = angle.current
  }, -2)
  const zoom = previewModel ? (close ? 4.25 : .87) : (close ? 2.9 : 1)
  const offset = previewModel ? (close ? -6.42 : -.76) : (close ? -4.2 : -.82)
  return <group ref={figure} scale={zoom} position={[0, offset, 0]}>
    <Pawn3D seat={character.model === 4 ? 0 : character.model} character={character} pose={pose} selectable={false} preview previewModel={previewModel} />
  </group>
}

const touchLayer = { ...StyleSheet.absoluteFill, touchAction: 'none' } as const
export default function CharacterPreview(props: PreviewProps) {
  const angle = useRef(0), start = useRef({ x: 0, angle: 0 })
  return <View style={{ flex: 1 }}><Canvas camera={{ position: [0, 0, 3.2], fov: 32 }}>
    <color attach="background" args={['#0b1e38']} />
    <hemisphereLight args={['#fff6ed', '#b3caf0', 1.7]} />
    <directionalLight position={[2, 3, 4]} intensity={2.1} />
    <Figure {...props} angle={angle} />
  </Canvas>
    <View style={touchLayer} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}
      onResponderGrant={e => { start.current = { x: e.nativeEvent.pageX, angle: angle.current } }}
      onResponderMove={e => { angle.current = start.current.angle + (e.nativeEvent.pageX-start.current.x)*.014 }} />
  </View>
}
