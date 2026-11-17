import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber/native'
import { ContactShadows, PerspectiveCamera } from '@react-three/drei/native'
import * as THREE from 'three'
import { cellForProgress, HOME_STEP, SEAT_HEX, YARD, type Token } from '../game/rules'
import { useMatch, type MoveAnimation } from '../game/store'
import Board3D from './Board3D'
import Dice3D from './Dice3D'
import Pawn3D, { type PawnAction } from './Pawn3D'
import { DECK_Y, toWorld } from './layout'

/** One token: walks its path cell by cell, then tells the store it is done. */
function AnimatedToken({
  token,
  anim,
  selectable,
  onSelect,
}: {
  token: Token
  anim: MoveAnimation | null
  selectable: boolean
  onSelect: () => void
}) {
  const group = useRef<THREE.Group>(null)
  // Step is held in a ref: advancing it must not re-render during the frame loop.
  const step = useRef(0)
  const settled = useRef(false)
  const finishAnimation = useMatch((s) => s.finishAnimation)

  const walking = anim !== null

  useEffect(() => {
    step.current = 0
    settled.current = false
  }, [anim])

  // Drop into place on first mount so tokens do not slide in from the origin.
  useEffect(() => {
    const g = group.current
    if (!g) return
    const [x, z] = toWorld(cellForProgress(token.seat, token.progress, token.index))
    g.position.set(x, DECK_Y + 0.06, z)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return

    const progress = walking ? anim.path[Math.min(step.current, anim.path.length - 1)] : token.progress
    const [tx, tz] = toWorld(cellForProgress(token.seat, progress, token.index))

    const dx = tx - g.position.x
    const dz = tz - g.position.z
    const dist = Math.hypot(dx, dz)

    if (dist > 0.004) {
      const k = Math.min(1, delta * (walking ? 11 : 6))
      g.position.x += dx * k
      g.position.z += dz * k
      const heading = Math.atan2(dx, dz)
      g.rotation.y +=
        Math.atan2(Math.sin(heading - g.rotation.y), Math.cos(heading - g.rotation.y)) * Math.min(1, delta * 12)
      g.position.y = DECK_Y + 0.06 + Math.abs(Math.sin(state.clock.elapsedTime * 14)) * 0.07
    } else {
      g.position.y += (DECK_Y + 0.06 - g.position.y) * Math.min(1, delta * 10)
    }

    if (walking && dist < 0.05 && !settled.current) {
      if (step.current < anim.path.length - 1) {
        step.current += 1
      } else {
        settled.current = true
        // Hand control back to the store outside the frame callback.
        Promise.resolve().then(finishAnimation)
      }
    }
  })

  let action: PawnAction = 'idle'
  if (walking) action = 'run'
  else if (token.progress === HOME_STEP) action = 'yes'
  else if (token.progress === YARD) action = 'idle'

  return (
    <group ref={group}>
      <Pawn3D seat={token.seat} action={action} selectable={selectable} onSelect={onSelect} />
    </group>
  )
}

function Tokens() {
  const tokens = useMatch((s) => s.tokens)
  const animation = useMatch((s) => s.animation)
  const moves = useMatch((s) => s.moves)
  const phase = useMatch((s) => s.phase)
  const current = useMatch((s) => s.current)
  const players = useMatch((s) => s.players)
  const pickToken = useMatch((s) => s.pickToken)

  const humanTurn = players.find((p) => p.seat === current)?.kind === 'human'
  const movable = new Set(phase === 'await-move' && humanTurn ? moves.map((m) => m.tokenId) : [])

  return (
    <>
      {tokens.map((token) => (
        <AnimatedToken
          key={token.id}
          token={token}
          anim={animation?.tokenId === token.id ? animation : null}
          selectable={movable.has(token.id)}
          onSelect={() => pickToken(token.id)}
        />
      ))}
    </>
  )
}

/**
 * The physical die, sitting on its tray in front of the board. Tapping it is
 * how a human seat rolls, matching the design's bottom-centre dice trigger.
 */
function DiceStage() {
  const die = useMatch((s) => s.die)
  const phase = useMatch((s) => s.phase)
  const turnCount = useMatch((s) => s.turnCount)
  const current = useMatch((s) => s.current)
  const players = useMatch((s) => s.players)
  const roll = useMatch((s) => s.roll)

  const human = players.find((p) => p.seat === current)?.kind === 'human'
  const canRoll = phase === 'await-roll' && human

  return (
    <group position={[0, 1.5, 9.1]}>
      <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial color="#0a1230" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.32, 1.52, 32]} />
        <meshBasicMaterial color={canRoll ? SEAT_HEX[current] : '#2a3357'} toneMapped={false} />
      </mesh>

      <group
        onPointerDown={(e) => {
          e.stopPropagation()
          if (canRoll) roll()
        }}
      >
        <Dice3D value={die ?? 6} rolling={phase === 'rolling'} seed={turnCount} scale={1.15} />
      </group>
    </group>
  )
}

/** Slow idle orbit so the diorama never feels static. */
function CameraRig() {
  const cam = useRef<THREE.PerspectiveCamera>(null)

  useFrame((state) => {
    const c = cam.current
    if (!c) return
    const t = state.clock.elapsedTime
    c.position.x = Math.sin(t * 0.08) * 0.5
    c.position.y = 23 + Math.sin(t * 0.11) * 0.4
    c.position.z = 20.5
    c.lookAt(0, 0, 1.2)
  })

  return <PerspectiveCamera ref={cam} makeDefault fov={34} near={0.5} far={120} position={[0, 23, 20.5]} />
}

function Lighting() {
  return (
    <>
      <hemisphereLight args={['#5f7bb8', '#06080f', 0.55]} />
      <directionalLight
        position={[6, 18, 8]}
        intensity={2.1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0006}
      />
      <pointLight position={[-11, 5, -11]} intensity={70} color={SEAT_HEX[0]} distance={34} />
      <pointLight position={[11, 5, -11]} intensity={70} color={SEAT_HEX[1]} distance={34} />
      <pointLight position={[11, 5, 11]} intensity={70} color={SEAT_HEX[2]} distance={34} />
      <pointLight position={[-11, 5, 11]} intensity={70} color={SEAT_HEX[3]} distance={34} />
      <spotLight position={[0, 20, 0]} angle={0.75} penumbra={0.9} intensity={160} color="#cdd8ff" distance={44} />
    </>
  )
}

export default function MatchScene() {
  return (
    <Canvas
      shadows
      // The native canvas takes its drawing-buffer size from the GL surface,
      // so there is no `dpr` here as there is on the web.
      gl={{ antialias: true }}
      onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color('#0b0f19')
        scene.fog = new THREE.Fog('#0b0f19', 26, 54)
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}
    >
      <CameraRig />
      <Lighting />
      {/* The board and dice are procedural, so they must never be held back by
          a suspended model load — only the tokens wait on the character GLB. */}
      <Board3D />
      <DiceStage />
      <Suspense fallback={null}>
        <Tokens />
      </Suspense>
      <ContactShadows position={[0, -0.27, 0]} opacity={0.55} scale={30} blur={2.4} far={6} />
    </Canvas>
  )
}
