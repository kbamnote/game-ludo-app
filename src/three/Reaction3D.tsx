import { useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import type { Group, MeshBasicMaterial, Object3D } from 'three'
import { BOMB_SCORCH_END, REACTION_HIT, type Reaction, type ReactionKind } from '../game/reactions'
import { cellFor } from '../game/rules'
import { DECK_Y, toWorld, YARD_PLATES, YARD_SIZE } from './layout'

export function ReactionModel({ kind }: { kind: ReactionKind }) {
  switch (kind) {
    case 'bomb':
      return <group>
        <mesh position={[0, -.08, 0]}><sphereGeometry args={[.43, 22, 16]} /><meshStandardMaterial color="#37416c" metalness={.25} roughness={.34} /></mesh>
        <mesh position={[0, .33, 0]}><cylinderGeometry args={[.14, .19, .16, 12]} /><meshStandardMaterial color="#667aa7" /></mesh>
        <mesh position={[.14, .49, 0]} rotation={[0, 0, -.77]}><capsuleGeometry args={[.038, .23, 4, 8]} /><meshStandardMaterial color="#ffc685" /></mesh>
        <mesh position={[.23, .60, 0]}><octahedronGeometry args={[.13]} /><meshBasicMaterial color="#ffd337" /></mesh>
      </group>
    case 'knife':
      return <group rotation={[0, 0, -.4]}>
        <mesh position={[0, .22, 0]}><cylinderGeometry args={[0, .24, .94, 3]} /><meshStandardMaterial color="#b7ddff" metalness={.46} roughness={.28} /></mesh>
        <mesh position={[0, -.29, 0]}><boxGeometry args={[.38, .08, .14]} /><meshStandardMaterial color="#ffcc60" /></mesh>
        <mesh position={[0, -.50, 0]}><cylinderGeometry args={[.088, .105, .38, 9]} /><meshStandardMaterial color="#463056" /></mesh>
      </group>
    case 'heart':
      return <group>
        {[-.22, .22].map(x => <mesh key={x} position={[x, .20, 0]} scale={[1, 1, .75]}>
          <sphereGeometry args={[.30, 18, 12]} /><meshStandardMaterial color="#ff3c79" roughness={.33} />
        </mesh>)}
        <mesh position={[0, -.11, 0]} rotation={[0, 0, Math.PI]} scale={[1, 1, .65]}>
          <coneGeometry args={[.44, .69, 20]} /><meshStandardMaterial color="#ff3c79" roughness={.33} />
        </mesh>
      </group>
    case 'cactus':
      return <group>
        <mesh position={[0, .12, 0]}><capsuleGeometry args={[.15, .73, 5, 12]} /><meshStandardMaterial color="#2ac477" /></mesh>
        {[-1, 1].map(side => <mesh key={side} position={[side * .22, side * .09 + .14, 0]} rotation={[0, 0, -side * .62]}>
          <capsuleGeometry args={[.09, .33, 4, 10]} /><meshStandardMaterial color="#42db81" />
        </mesh>)}
        <mesh position={[0, -.45, 0]}><cylinderGeometry args={[.27, .19, .30, 12]} /><meshStandardMaterial color="#ec7543" /></mesh>
      </group>
    case 'orange':
      return <group>
        <mesh><sphereGeometry args={[.42, 24, 16]} /><meshStandardMaterial color="#ff8d16" roughness={.49} /></mesh>
        <mesh position={[.11, .43, 0]} rotation={[0, 0, .35]} scale={[.21, .073, .12]}>
          <sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color="#2cba55" />
        </mesh>
      </group>
    case 'snowball':
      return <group>
        <mesh><icosahedronGeometry args={[.43, 2]} /><meshStandardMaterial color="#edfcff" roughness={1} /></mesh>
        <mesh position={[.22, .20, .20]}><icosahedronGeometry args={[.21, 1]} /><meshStandardMaterial color="#d0edff" /></mesh>
      </group>
    case 'duck':
      return <group>
        <mesh position={[0, -.13, 0]} scale={[1.38, .80, 1]}><sphereGeometry args={[.33, 18, 12]} /><meshStandardMaterial color="#ffd329" /></mesh>
        <mesh position={[.19, .20, 0]}><sphereGeometry args={[.24, 16, 12]} /><meshStandardMaterial color="#ffdf33" /></mesh>
        <mesh position={[.43, .14, 0]} scale={[1.28, .54, 1]}><sphereGeometry args={[.13, 14, 8]} /><meshStandardMaterial color="#ff7e2e" /></mesh>
        {[-.165, .165].map(z => <mesh key={z} position={[.285, .27, z]}><sphereGeometry args={[.039, 10, 8]} /><meshStandardMaterial color="#162136" /></mesh>)}
      </group>
    case 'gift':
      return <group>
        <mesh><boxGeometry args={[.67, .66, .67]} /><meshStandardMaterial color="#824be2" /></mesh>
        <mesh><boxGeometry args={[.18, .68, .69]} /><meshStandardMaterial color="#ffd460" /></mesh>
        <mesh><boxGeometry args={[.69, .68, .18]} /><meshStandardMaterial color="#ffd460" /></mesh>
        {[-.13, .13].map(x => <mesh key={x} position={[x, .41, 0]}><torusGeometry args={[.12, .034, 6, 14]} /><meshStandardMaterial color="#ffd460" /></mesh>)}
      </group>
  }
}

export function reactionPath(reaction: Reaction, elapsed: number, scene?: Object3D) {
  const [startX, startZ] = toWorld(cellFor(reaction.sender))
  const bomb = reaction.kind === 'bomb'
  const endCell = bomb ? YARD_PLATES[reaction.to].center : cellFor(reaction.receiver)
  const [endX, endZ] = toWorld(endCell)
  // Pawn groups are direct scene children. Skip traversing every rig and mesh.
  const sender = scene?.children.find(child => child.name === reaction.sender.id)?.position
  const receiver = bomb ? undefined : scene?.children.find(child => child.name === reaction.receiver.id)?.position
  const fromX = sender?.x ?? startX, fromZ = sender?.z ?? startZ
  const toX = receiver?.x ?? endX, toZ = receiver?.z ?? endZ
  const travel = Math.max(0, Math.min(1, (elapsed - 180) / (REACTION_HIT - 180)))
  return {
    x: fromX + (toX - fromX) * travel, z: fromZ + (toZ - fromZ) * travel,
    y: DECK_Y + .95 + 2.5 * Math.sin(travel * Math.PI),
    yaw: Math.atan2(toX - fromX, toZ - fromZ),
  }
}

export function FlyingReaction({ reaction }: { reaction: Reaction }) {
  const projectile = useRef<Group>(null)
  const burst = useRef<Group>(null)
  const scorch = useRef<MeshBasicMaterial>(null)
  const bomb = reaction.kind === 'bomb'
  const [yardX, yardZ] = toWorld(YARD_PLATES[reaction.to].center)
  useFrame(({ scene }) => {
    const elapsed = Date.now() - reaction.startedAt
    const impact = (elapsed - REACTION_HIT) / (bomb ? 580 : 430)
    const inFlight = elapsed >= 0 && elapsed < REACTION_HIT
    const showingImpact = impact >= 0 && impact <= 1
    if (projectile.current) projectile.current.visible = inFlight
    if (burst.current) burst.current.visible = showingImpact
    if (inFlight || showingImpact) {
      const path = reactionPath(reaction, elapsed, scene)
      if (inFlight && projectile.current) {
        projectile.current.position.set(path.x, path.y, path.z)
        projectile.current.rotation.set(elapsed * .006, path.yaw, elapsed * .009)
      }
      if (showingImpact && burst.current) {
        burst.current.position.set(path.x, path.y, path.z)
        burst.current.scale.setScalar(.6 + impact * (bomb ? 6 : 1.6))
      }
    }
    if (scorch.current) {
      const remaining = Math.min(1, (BOMB_SCORCH_END - elapsed) / 750)
      scorch.current.opacity = elapsed < REACTION_HIT ? 0 : .84 * Math.max(0, remaining)
    }
  })
  return <>
    <group ref={projectile} scale={1.35} visible={false}><ReactionModel kind={reaction.kind} /></group>
    <group ref={burst} visible={false}>
      <mesh><torusGeometry args={[.36, .035, 6, 24]} /><meshBasicMaterial color={bomb ? '#ff741b' : '#ffe08b'} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.36, .035, 6, 24]} /><meshBasicMaterial color={bomb ? '#ffcb37' : '#fff2bc'} /></mesh>
      {bomb && <mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[.5, .05, 6, 28]} /><meshBasicMaterial color="#ff481c" /></mesh>}
    </group>
    {bomb && <mesh position={[yardX, DECK_Y + .065, yardZ]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[YARD_SIZE, YARD_SIZE]} />
      <meshBasicMaterial ref={scorch} color="#24100b" transparent opacity={0} depthWrite={false} />
    </mesh>}
  </>
}

