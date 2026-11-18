import { useLayoutEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Canvas, useFrame, useThree } from '@react-three/fiber/native'
import * as THREE from 'three'
import { cellFor, SEAT_HEX, type Token } from '../game/rules'
import { RESCUE_MS, STEP_MS } from '../game/moveTiming'
import { useMatch, type MoveAnimation } from '../game/store'
import Board3D from './Board3D'
import Dice3D from './Dice3D'
import Pawn3D, { type CharacterPose } from './Pawn3D'
import Rescue3D from './Rescue3D'
import SceneErrorSink from './SceneErrorSink'
import { DECK_Y, toWorld } from './layout'
import { boardModel, useGameModel } from './useCharacterModel'
import { ease, rescuePose, rescueSite, rescueTime, walkingPose } from './moveScene'
import { useBoardGesture, type BoardView } from './useBoardGesture'
import { pickTokenAt } from './pickTokenAt'

function AnimatedToken({ token, move, selectable }: {
  token: Token; move: MoveAnimation | null; selectable: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const pose = useRef<CharacterPose>({ clip: 'Idle', seconds: 0 })
  const rest = useMemo(() => toWorld(cellFor(token)), [token])
  const victimIndex = move?.captures.indexOf(token.id) ?? -1
  const site = useMemo(() => victimIndex >= 0 ? rescueSite(token) : null, [token, victimIndex])
  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const p = pose.current
    p.clip = 'Idle'
    p.seconds = clock.elapsedTime + token.index * .31
    g.position.set(rest[0], DECK_Y + .07, rest[1])
    g.rotation.set(0, .48, 0, 'YXZ')
    g.visible = true
    if (!move) return
    const elapsed = Math.max(0, Date.now() - move.startedAt)
    if (move.tokenId === token.id) {
      const walk = walkingPose(token, move, elapsed)
      const after = (elapsed - move.path.length * STEP_MS) / 1000
      g.position.set(walk.x, DECK_Y + .07, walk.z)
      g.rotation.y = walk.yaw
      if (after < 0) {
        p.clip = 'Walk'
        p.seconds = elapsed / 520
      } else if (move.captures.length && after < .9) {
        p.clip = 'SwordSwipe'
        p.seconds = after
      }
    } else if (site) {
      const t = rescueTime(move, elapsed, victimIndex)
      if (t < 0) return
      const f = rescuePose(t, site.distance)
      const sin = Math.sin(site.yaw), cos = Math.cos(site.yaw)
      g.position.set(site.x + cos * f.patientX + sin * f.patientZ,
        DECK_Y + .07 + f.patientY, site.z - sin * f.patientX + cos * f.patientZ)
      g.rotation.set(f.patientTilt, site.yaw, 0, 'YXZ')
      g.visible = f.patientVisible
      if (t >= .26 && t < 6.22) {
        p.clip = 'Knockout'
        p.seconds = t - .26
      }
    }
  }, -2)
  return <group name={token.id} ref={group} position={[rest[0], DECK_Y + .07, rest[1]]}>
    <Pawn3D seat={token.seat} pose={pose} selectable={selectable} />
  </group>
}

function Players() {
  const currentTokens = useMatch((s) => s.tokens)
  const animation = useMatch((s) => s.animation)
  const moves = useMatch((s) => s.moves)
  const canPick = useMatch((s) => s.phase === 'await-move' && (s.mode === 'online'
    ? s.current === s.mySeat : s.players.some(p => p.seat === s.current && p.kind === 'human')))
  const tokens = animation?.before ?? currentTokens
  return <>
    {tokens.map(token => <AnimatedToken key={token.id} token={token} move={animation}
      selectable={canPick && moves.some(m => m.tokenId === token.id)} />)}
    {animation?.captures.map((id, index) => {
      const victim = tokens.find(t => t.id === id)
      return victim && <SceneErrorSink key={id} label="rescue">
        <Rescue3D move={animation} victim={victim} index={index} />
      </SceneErrorSink>
    })}
  </>
}

const TRAY_RADIUS = 2.20
const BOARD_HALF_SIDE = 8.35

function DiceStage({ view }: { view: BoardView }) {
  const tray = useRef<THREE.Group>(null)
  const die = useMatch((s) => s.die)
  const phase = useMatch((s) => s.phase)
  const turnCount = useMatch((s) => s.turnCount)
  const current = useMatch((s) => s.current)
  const canRoll = useMatch((s) => s.phase === 'await-roll' && (s.mode === 'online'
    ? s.current === s.mySeat : s.players.some(p => p.seat === s.current && p.kind === 'human')))
  useFrame(() => {
    if (!tray.current) return
    const angle = view.angle
    const distance = trayDistance(angle)
    tray.current.position.set(Math.sin(angle) * distance, .18, Math.cos(angle) * distance)
    tray.current.rotation.y = angle
  })
  return <group name="dice-tray" ref={tray}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[TRAY_RADIUS, 48]} /><meshStandardMaterial color="#263442" /></mesh>
    <mesh position={[0, .012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[TRAY_RADIUS - .1, TRAY_RADIUS, 48]} /><meshBasicMaterial color={canRoll ? SEAT_HEX[current] : '#ab8b5f'} />
    </mesh>
    <group position={[0, .82, 0]}>
      <Dice3D value={die ?? 6} rolling={phase === 'rolling'} seed={turnCount} scale={2.26} />
    </group>
  </group>
}

function trayDistance(angle: number) {
  return BOARD_HALF_SIDE * (Math.abs(Math.sin(angle)) + Math.abs(Math.cos(angle))) + TRAY_RADIUS + .3
}

function CameraRig({ view, setTapHandler }: Pick<ReturnType<typeof useBoardGesture>, 'view' | 'setTapHandler'>) {
  const move = useMatch((s) => s.animation)
  const get = useThree(s => s.get)
  useLayoutEffect(() => {
    const raycaster = new THREE.Raycaster()
    setTapHandler((x, y) => {
      const state = useMatch.getState()
      const human = state.mode === 'online' ? state.current === state.mySeat : state.players.some(p => p.seat === state.current && p.kind === 'human')
      if (!human || (state.phase !== 'await-roll' && state.phase !== 'await-move')) return
      const { camera, scene, size } = get()
      if (state.phase === 'await-move') {
        const id = pickTokenAt(x, y, camera, size, state.tokens, state.moves)
        if (id !== null) state.pickToken(id)
        return
      }
      const tray = scene.getObjectByName('dice-tray')
      if (!tray) return
      raycaster.setFromCamera(new THREE.Vector2(x / size.width * 2 - 1, 1 - y / size.height * 2), camera)
      if (raycaster.intersectObject(tray, true).length) state.roll()
    })
    return () => setTapHandler(null)
  }, [get, setTapHandler])
  useFrame(({ camera, size }) => {
    const cam = camera as THREE.OrthographicCamera
    const aspect = size.width / Math.max(1, size.height)
    let angle = view.angle
    const sin = Math.sin(angle), cos = Math.cos(angle)
    // Fit both the board corners and the off-board die throughout the rotation.
    const edge = BOARD_HALF_SIDE * (Math.abs(sin) + Math.abs(cos))
    const near = trayDistance(angle) + TRAY_RADIUS
    const midDepth = (near - edge) / 2
    let x = sin * midDepth, z = cos * midDepth
    const pitch = view.elevation
    let height = .85 + 19 * Math.tan(pitch)
    let width = Math.max((2 * edge + .35) / view.zoom,
      ((near + edge) * Math.sin(pitch) + 3.3 * Math.cos(pitch) + .45) * aspect)
    if (move?.captures.length) {
      const elapsed = Date.now() - move.startedAt
      const index = Math.max(0, Math.min(move.captures.length - 1,
        Math.floor((elapsed - move.path.length * STEP_MS) / RESCUE_MS)))
      const victim = move.before.find(token => token.id === move.captures[index])
      if (victim) {
        const site = rescueSite(victim)
        const t = rescueTime(move, elapsed, index)
        const focus = ease(t, -.45, .55) * (1 - ease(t, 5.8, 6.5))
        const f = rescuePose(t, site.distance)
        const arriving = ease(t, .42, .86) * (1 - ease(t, .94, 1.95))
        const follow = .48 + (f.van - .48) * (.5 * arriving + ease(t, 4.9, 6.15))
        x += focus * (site.x + Math.sin(site.yaw) * follow - x)
        z += focus * (site.z + Math.cos(site.yaw) * follow - z)
        width += focus * (Math.max(6.4 + arriving * f.van, 4.65 * aspect) - width)
        const toward = site.yaw + Math.PI * .65 - angle
        angle += focus * Math.atan2(Math.sin(toward), Math.cos(toward))
        height += focus * (21 - height)
      }
    }
    cam.position.set(x + 19 * Math.sin(angle), height, z + 19 * Math.cos(angle))
    cam.lookAt(x, .85, z)
    const zoom = size.width / width
    if (cam.zoom !== zoom) { cam.zoom = zoom; cam.updateProjectionMatrix() }
  })
  return null
}

function MatchBoard() {
  const board = useGameModel(boardModel)
  return board ? <primitive object={board.scene} /> : <Board3D />
}

// The web surface also suppresses the browser's native pan and pinch gestures.
const gestureSurface = { ...StyleSheet.absoluteFill, touchAction: 'none' } as const

export default function MatchScene() {
  const gesture = useBoardGesture()
  return <View style={{ flex: 1 }} onLayout={e => { gesture.setWidth(e.nativeEvent.layout.width) }}>
    <Canvas pointerEvents="none" orthographic camera={{ position: [11, 21, 16], near: .1, far: 180 }}
      gl={{ antialias: true }} onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color('#182934')
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}>
      <CameraRig view={gesture.view} setTapHandler={gesture.setTapHandler} />
      <hemisphereLight args={['#fff3e6', '#8292a5', 1.9]} />
      <directionalLight position={[-8, 16, 10]} intensity={2.4} color="#fff5e4" />
      <directionalLight position={[9, 7, -9]} intensity={1.5} color="#c5e3ff" />
      <MatchBoard />
      <DiceStage view={gesture.view} />
      <SceneErrorSink label="characters"><Players /></SceneErrorSink>
    </Canvas>
    <View collapsable={false} style={gestureSurface} {...gesture.handlers} />
  </View>
}
