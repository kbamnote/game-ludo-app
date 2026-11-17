import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei/native'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { SEAT_HEX, type Seat } from '../game/rules'

/** Metro bundles the model as an asset module; drei/native resolves it. */
export const CHARACTER_MODEL = require('../../assets/models/character.glb')

/** Clip names inside Ludo_Character_Red.glb. */
const CLIP = {
  idle: 'CharacterArmature|Idle',
  run: 'CharacterArmature|Run',
  walk: 'CharacterArmature|Walk',
  jump: 'CharacterArmature|Jump',
  wave: 'CharacterArmature|Wave',
  death: 'CharacterArmature|Death',
  punch: 'CharacterArmature|Punch',
  yes: 'CharacterArmature|Yes',
} as const

export type PawnAction = keyof typeof CLIP

/** How tall a token should stand, in world units (one grid cell = 1). */
const TARGET_HEIGHT = 1.4

/**
 * Root-to-head bone span as a fraction of a character's full height. Bone
 * positions stop at the head joint and start at the ankles, so the skeleton
 * measures shorter than the silhouette.
 */
const SKELETON_FRACTION = 0.82

/**
 * The export mixes scales — the pedestal mesh is 1.24 units across while the
 * skinned character sits under a x100 armature node — so Box3.setFromObject
 * reports ~15000 units and cannot be used to fit the model. Bone world
 * positions do reflect the real rendered pose, so the rig is measured instead.
 */
function measureScale(root: THREE.Object3D): number {
  root.scale.setScalar(1)
  root.position.set(0, 0, 0)
  root.updateWorldMatrix(true, true)

  const box = new THREE.Box3()
  const p = new THREE.Vector3()
  let bones = 0

  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) {
      box.expandByPoint(p.setFromMatrixPosition(o.matrixWorld))
      bones++
    }
  })

  if (bones < 2 || box.isEmpty()) return 1
  const span = box.max.y - box.min.y
  if (!Number.isFinite(span) || span < 1e-6) return 1
  return TARGET_HEIGHT / (span / SKELETON_FRACTION)
}

export interface Pawn3DProps {
  seat: Seat
  action: PawnAction
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
}

/** useGLTF is typed for URL strings; Metro hands us an asset module id. */
interface LoadedCharacter {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
}

export default function Pawn3D({ seat, action, selectable, selected, onSelect }: Pawn3DProps) {
  const { scene, animations } = useGLTF(CHARACTER_MODEL as string) as unknown as LoadedCharacter

  // Skinned meshes cannot be shared between instances — clone the rig per token.
  const cloned = useMemo(() => cloneSkinned(scene) as THREE.Group, [scene])

  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned])
  const actions = useMemo(() => {
    const map = new Map<string, THREE.AnimationAction>()
    for (const clip of animations) map.set(clip.name, mixer.clipAction(clip))
    return map
  }, [animations, mixer])

  // Tint per seat. Shadow casting is left off: sixteen skinned rigs casting
  // shadows is far too expensive on a phone, and the contact discs read better.
  useLayoutEffect(() => {
    const tint = new THREE.Color(SEAT_HEX[seat])
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = false
      mesh.receiveShadow = false
      // Cloned skinned meshes keep the source bounding volume, which no longer
      // matches once the rig is re-posed — culling would make tokens vanish.
      mesh.frustumCulled = false

      const source = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[]
      const clone = (m: THREE.MeshStandardMaterial) => {
        const next = m.clone()
        next.color.lerp(tint, 0.32)
        next.emissive = tint.clone()
        next.emissiveIntensity = 0.1
        return next
      }
      mesh.material = Array.isArray(source) ? source.map(clone) : clone(source)
    })
  }, [cloned, seat])

  useLayoutEffect(() => {
    // The pedestal is authored at a different scale to the character, so it
    // would read as a speck; the seat-coloured ring below replaces it.
    cloned.traverse((child) => {
      if (/pedestal/i.test(child.name)) child.visible = false
    })

    cloned.scale.setScalar(measureScale(cloned))

    cloned.updateWorldMatrix(true, true)
    const box = new THREE.Box3()
    const p = new THREE.Vector3()
    cloned.traverse((o) => {
      if ((o as THREE.Bone).isBone) box.expandByPoint(p.setFromMatrixPosition(o.matrixWorld))
    })
    if (!box.isEmpty()) cloned.position.y = -box.min.y
  }, [cloned])

  // Cross-fade between clips as the token's state changes.
  useEffect(() => {
    const name = CLIP[action] ?? CLIP.idle
    const next = actions.get(name) ?? actions.get(CLIP.idle)
    if (!next) return
    next.reset().fadeIn(0.22).play()
    if (action === 'jump' || action === 'wave' || action === 'punch' || action === 'yes') {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity)
    }
    return () => {
      next.fadeOut(0.22)
    }
  }, [action, actions])

  useFrame((_, delta) => mixer.update(delta))

  useEffect(
    () => () => {
      mixer.stopAllAction()
    },
    [mixer],
  )

  return (
    <group
      onPointerDown={
        selectable
          ? (e) => {
              e.stopPropagation()
              onSelect?.()
            }
          : undefined
      }
    >
      <primitive object={cloned} />

      {/* Tinted contact shadow, per the design system's token ambient occlusion */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* Selection ring when this token is a legal move */}
      {selectable && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.46, 0.58, 28]} />
          <meshBasicMaterial
            color={selected ? '#ffffff' : SEAT_HEX[seat]}
            toneMapped={false}
            transparent
            opacity={selected ? 0.95 : 0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}

useGLTF.preload(CHARACTER_MODEL)
