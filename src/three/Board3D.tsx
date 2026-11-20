import { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei/native'
import { useFrame } from '@react-three/fiber/native'
import * as THREE from 'three'
import { HOME_TRIANGLE_DIRECTIONS, SEAT_HEX, type Seat } from '../game/rules'
import { useMatch } from '../game/store'
import { buildTiles, CELL, TILE_H, TILE_Y, toWorld, YARD_PLATES, YARD_SIZE } from './layout'

const CHASSIS = '#1e2640'
const CHASSIS_RIM = '#38b6ff'
const DECK = '#121826'
const TILE = '#e8ecf8'

const SEATS: Seat[] = [0, 1, 2, 3]

export function useYardGlow(yards: Partial<Record<Seat, THREE.MeshStandardMaterial>>) {
  const targets = useRef(yards)
  useLayoutEffect(() => { targets.current = yards }, [yards])
  useFrame(({ clock }) => {
    const { current, phase, seats } = useMatch.getState()
    const active = phase === 'ended' || !seats.includes(current) ? null : current
    const intensity = .29 + .15 * Math.sin(clock.elapsedTime * Math.PI * 1.15)
    for (const seat of SEATS) {
      const yard = targets.current[seat]
      if (yard) yard.emissiveIntensity = seat === active ? intensity : 0
    }
  })
}

function plastic(color: string, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.25,
    ...opts,
  })
}

function starShape() {
  const s = new THREE.Shape()
  const outer = 0.3
  const inner = 0.13
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

/** The four home triangles that make the centre star. */
function CenterStar({ material }: { material: Record<Seat, THREE.MeshPhysicalMaterial> }) {
  const geometry = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-1.5, -1.5)
    s.lineTo(1.5, -1.5)
    s.lineTo(0, 0)
    s.closePath()
    return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false })
  }, [])

  return (
    <group position={[0, TILE_Y + TILE_H / 2, 0]}>
      {SEATS.map((seat) => {
        const [x, z] = HOME_TRIANGLE_DIRECTIONS[seat]
        return <mesh key={seat} geometry={geometry} rotation={[-Math.PI / 2, 0, Math.atan2(x, z)]}>
          <primitive object={material[seat]} attach="material" />
        </mesh>
      })}
    </group>
  )
}

export default function Board3D() {
  const tiles = useMemo(() => buildTiles(), [])
  const starGeometry = useMemo(() => new THREE.ShapeGeometry(starShape()), [])

  const materials = useMemo(() => {
    const seatTile = Object.fromEntries(
      SEATS.map((s) => [
        s,
        plastic(SEAT_HEX[s], { emissive: new THREE.Color(SEAT_HEX[s]), emissiveIntensity: 0.22 }),
      ]),
    ) as Record<Seat, THREE.MeshPhysicalMaterial>

    return {
      chassis: plastic(CHASSIS, { roughness: 0.5, clearcoat: 0.45 }),
      rim: new THREE.MeshBasicMaterial({ color: new THREE.Color(CHASSIS_RIM), toneMapped: false }),
      deck: plastic(DECK, { roughness: 0.65, clearcoat: 0.2 }),
      tile: plastic(TILE, { roughness: 0.28 }),
      seatTile,
      seatStar: Object.fromEntries(
        SEATS.map((s) => [
          s,
          plastic(SEAT_HEX[s], { emissive: new THREE.Color(SEAT_HEX[s]), emissiveIntensity: 0.4 }),
        ]),
      ) as Record<Seat, THREE.MeshPhysicalMaterial>,
      yard: Object.fromEntries(
        SEATS.map((s) => [
          s,
          plastic(SEAT_HEX[s], { emissive: new THREE.Color(SEAT_HEX[s]), emissiveIntensity: 0.3, roughness: 0.45 }),
        ]),
      ) as Record<Seat, THREE.MeshPhysicalMaterial>,
      yardInset: Object.fromEntries(SEATS.map(seat => [seat, plastic(DECK, {
        emissive: new THREE.Color(SEAT_HEX[seat]), emissiveIntensity: 0, roughness: .65, clearcoat: .2,
      })])) as Record<Seat, THREE.MeshPhysicalMaterial>,
      pip: new THREE.MeshBasicMaterial({ color: new THREE.Color('#5b6480'), toneMapped: false }),
    }
  }, [])
  useYardGlow(materials.yardInset)

  return (
    <group>
      {/* Chassis slab */}
      <RoundedBox args={[16.4, 0.8, 16.4]} radius={0.34} smoothness={4} receiveShadow>
        <primitive object={materials.chassis} attach="material" />
      </RoundedBox>

      {/* Emissive neon rim strip */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[16.1, 0.05, 16.1]} />
        <primitive object={materials.rim} attach="material" />
      </mesh>

      {/* Playing deck */}
      <RoundedBox args={[15.4, 0.3, 15.4]} radius={0.14} smoothness={4} position={[0, 0.5, 0]} receiveShadow>
        <primitive object={materials.deck} attach="material" />
      </RoundedBox>

      {/* Yard plates */}
      {YARD_PLATES.map(({ seat, center }) => {
        const [x, z] = toWorld(center)
        return (
          <group key={`yard-${seat}`} position={[x, 0, z]}>
            <RoundedBox
              args={[YARD_SIZE, TILE_H, YARD_SIZE]}
              radius={0.12}
              smoothness={4}
              position={[0, TILE_Y, 0]}
              receiveShadow
            >
              <primitive object={materials.yard[seat]} attach="material" />
            </RoundedBox>
            <RoundedBox
              args={[YARD_SIZE - 1.4, TILE_H, YARD_SIZE - 1.4]}
              radius={0.12}
              smoothness={4}
              position={[0, TILE_Y + 0.04, 0]}
              receiveShadow
            >
              <primitive object={materials.yardInset[seat]} attach="material" />
            </RoundedBox>
            {[
              [-0.95, -0.95],
              [0.95, -0.95],
              [-0.95, 0.95],
              [0.95, 0.95],
            ].map(([dx, dz], i) => (
              <mesh key={i} position={[dx, TILE_Y + TILE_H / 2 + 0.045, dz]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.42, 24]} />
                <meshBasicMaterial color={SEAT_HEX[seat]} toneMapped={false} transparent opacity={0.7} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* Track, star and home-column tiles */}
      {tiles.map((tile) => {
        if (tile.kind === 'home') return null
        const [x, z] = toWorld(tile.cell)
        const mat = tile.seat !== null ? materials.seatTile[tile.seat] : materials.tile
        return (
          <group key={tile.key} position={[x, 0, z]}>
            <RoundedBox
              args={[CELL * 0.9, TILE_H, CELL * 0.9]}
              radius={0.1}
              smoothness={3}
              position={[0, TILE_Y, 0]}
              receiveShadow
            >
              <primitive object={mat} attach="material" />
            </RoundedBox>
            {tile.kind === 'star' && (
              <mesh
                geometry={starGeometry}
                position={[0, TILE_Y + TILE_H / 2 + 0.005, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <primitive object={materials.pip} attach="material" />
              </mesh>
            )}
          </group>
        )
      })}

      <CenterStar material={materials.seatStar} />
    </group>
  )
}
