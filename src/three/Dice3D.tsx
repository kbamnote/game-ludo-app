import { useEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei/native'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Pip layout per face value, in face-local units (-1..1). */
const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[0, 0]],
  2: [
    [-0.45, -0.45],
    [0.45, 0.45],
  ],
  3: [
    [-0.45, -0.45],
    [0, 0],
    [0.45, 0.45],
  ],
  4: [
    [-0.45, -0.45],
    [0.45, -0.45],
    [-0.45, 0.45],
    [0.45, 0.45],
  ],
  5: [
    [-0.45, -0.45],
    [0.45, -0.45],
    [0, 0],
    [-0.45, 0.45],
    [0.45, 0.45],
  ],
  6: [
    [-0.45, -0.5],
    [0.45, -0.5],
    [-0.45, 0],
    [0.45, 0],
    [-0.45, 0.5],
    [0.45, 0.5],
  ],
}

/** Face value -> [position on the cube, rotation of the pip plate]. */
const FACES: ReadonlyArray<{
  value: number
  position: [number, number, number]
  rotation: [number, number, number]
}> = [
  { value: 1, position: [0, 0.51, 0], rotation: [-Math.PI / 2, 0, 0] },
  { value: 6, position: [0, -0.51, 0], rotation: [Math.PI / 2, 0, 0] },
  { value: 3, position: [0.51, 0, 0], rotation: [0, Math.PI / 2, 0] },
  { value: 4, position: [-0.51, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  { value: 2, position: [0, 0, 0.51], rotation: [0, 0, 0] },
  { value: 5, position: [0, 0, -0.51], rotation: [0, Math.PI, 0] },
]

/** Resting orientation that puts `value` face up. */
const REST: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
}

export interface Dice3DProps {
  value: number
  rolling: boolean
  /** Extra spin added to the resting pose so repeat rolls still look alive. */
  seed?: number
  scale?: number
}

export default function Dice3D({ value, rolling, seed = 0, scale = 1 }: Dice3DProps) {
  const group = useRef<THREE.Group>(null)
  const target = useRef(new THREE.Quaternion())
  const spin = useRef(new THREE.Vector3())

  const materials = useMemo(
    () => ({
      body: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#fdfbf4'),
        roughness: 0.22,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        sheen: 0.5,
        sheenColor: new THREE.Color('#dfe2f1'),
      }),
      pip: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#141c33'),
        roughness: 0.35,
        metalness: 0.1,
      }),
    }),
    [],
  )

  useEffect(() => {
    const [x, y, z] = REST[value] ?? REST[1]
    const e = new THREE.Euler(x, y + Math.PI * 2 * ((seed % 3) + 1), z)
    target.current.setFromEuler(e)
  }, [value, seed])

  useEffect(() => {
    if (rolling) {
      spin.current.set(6 + Math.random() * 6, 5 + Math.random() * 6, 7 + Math.random() * 5)
    }
  }, [rolling])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    if (rolling) {
      g.rotation.x += spin.current.x * delta
      g.rotation.y += spin.current.y * delta
      g.rotation.z += spin.current.z * delta
      // Little hop while it tumbles.
      g.position.y = 0.35 + Math.abs(Math.sin(state.clock.elapsedTime * 11)) * 0.5
    } else {
      g.quaternion.slerp(target.current, 1 - Math.pow(0.0015, delta))
      g.position.y += (0.35 - g.position.y) * Math.min(1, delta * 9)
    }
  })

  return (
    <group ref={group} scale={scale} position={[0, 0.35, 0]}>
      <RoundedBox args={[1, 1, 1]} radius={0.18} smoothness={6} castShadow>
        <primitive object={materials.body} attach="material" />
      </RoundedBox>

      {FACES.map((face) => (
        <group key={face.value} position={face.position} rotation={face.rotation}>
          {PIPS[face.value].map(([px, py], i) => (
            <mesh key={i} position={[px * 0.62, py * 0.62, -0.02]}>
              <sphereGeometry args={[0.085, 16, 12]} />
              <primitive object={materials.pip} attach="material" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
