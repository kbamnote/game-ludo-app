import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SEAT_HEX, type Seat } from '../game/rules'
import { teamModels, useGameModel } from './useCharacterModel'

export interface CharacterPose {
  clip: 'Idle' | 'Walk' | 'SwordSwipe' | 'Knockout'
  seconds: number
}

function StreetCharacter({ model, pose }: { model: GLTF; pose: RefObject<CharacterPose> }) {
  const rig = useMemo(() => {
    const root = clone(model.scene)
    const mixer = new THREE.AnimationMixer(root)
    const actions = new Map(model.animations.map((clip) => [clip.name, mixer.clipAction(clip)]))
    root.traverse((child) => { child.frustumCulled = false })
    return { root, mixer, actions }
  }, [model])
  const previous = useRef<THREE.AnimationAction | null>(null)
  useFrame(() => {
    const { clip, seconds } = pose.current
    const action = rig.actions.get(clip)
    if (!action) return
    if (action !== previous.current) {
      previous.current?.stop()
      action.reset().play()
      previous.current = action
    }
    const duration = action.getClip().duration
    action.time = clip === 'Walk' || clip === 'Idle' ? seconds % duration : Math.min(seconds, duration - .001)
    rig.mixer.update(0)
  }, -1)
  useEffect(() => () => {
    rig.mixer.stopAllAction()
    rig.mixer.uncacheRoot(rig.root)
    rig.root.traverse((o) => { if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose() })
  }, [rig])
  return <primitive object={rig.root} scale={.87} />
}

export default function Pawn3D({ seat, pose, selectable }: {
  seat: Seat; pose: RefObject<CharacterPose>; selectable: boolean
}) {
  const model = useGameModel(teamModels[seat])
  return <group>
    {model ? <StreetCharacter model={model} pose={pose} /> : <group>
      <mesh position={[0, .48, 0]}><capsuleGeometry args={[.23, .48, 3, 10]} /><meshStandardMaterial color={SEAT_HEX[seat]} /></mesh>
      <mesh position={[0, 1.03, 0]}><sphereGeometry args={[.23, 12, 10]} /><meshStandardMaterial color="#a87656" /></mesh>
    </group>}
    {selectable && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]}>
      <ringGeometry args={[.38, .48, 32]} /><meshBasicMaterial color={SEAT_HEX[seat]} toneMapped={false} />
    </mesh>}
  </group>
}
