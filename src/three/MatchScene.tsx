import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { StyleSheet, View } from 'react-native'
import { Canvas, useFrame, useThree } from '@react-three/fiber/native'
import * as THREE from 'three'
import { cellFor, HOME_STEP, SEAT_HEX, type Seat, type Token } from '../game/rules'
import { CORONATION_YAW, type Coronation } from '../game/coronation'
import { RESCUE_MS, STEP_MS } from '../game/moveTiming'
import { useMatch, type MoveAnimation } from '../game/store'
import { useIdentity } from '../game/identity'
import Board3D, { useYardGlow } from './Board3D'
import Coronation3D from './Coronation3D'
import Pawn3D, { type CharacterPose } from './Pawn3D'
import Rescue3D from './Rescue3D'
import SceneErrorSink from './SceneErrorSink'
import { DECK_Y, toWorld } from './layout'
import { boardModel, useGameModel } from './useCharacterModel'
import { coronationFrame, ease, rescuePose, rescueSite, rescueTime, walkingPose } from './moveScene'
import { DEFAULT_BOARD_ZOOM, useBoardGesture, type BoardView } from './useBoardGesture'
import { pickTokenAt } from './pickTokenAt'
import { reactionAnchor, REACTION_DURATION, REACTION_HIT, type Reaction } from '../game/reactions'
import { FlyingReaction, reactionPath } from './Reaction3D'
import { DANCE_MS } from '../game/soundboard'

const FINISHED_TOKEN_SCALE = .52

function AnimatedToken({ token, move, selectable, reaction, danceStartedAt, award }: {
  token: Token; move: MoveAnimation | null; selectable: boolean; reaction: Reaction | null;
  danceStartedAt: RefObject<number>; award: Coronation | null
}) {
  const group = useRef<THREE.Group>(null)
  const online = useMatch(s => s.mode === 'online')
  const player = useMatch(s => s.players.find(p => p.seat === token.seat))
  const localCharacter = useIdentity(s => s.character)
  const character = player?.character !== undefined ? player.character
    : !online && token.seat === 0 && player?.kind === 'human' ? localCharacter : null
  const pose = useRef<CharacterPose>({ clip: 'Idle', seconds: 0 })
  const rest = useMemo(() => toWorld(cellFor(token)), [token])
  const restScale = token.progress === HOME_STEP ? FINISHED_TOKEN_SCALE : 1
  const victimIndex = move?.captures.indexOf(token.id) ?? -1
  const site = useMemo(() => victimIndex >= 0 ? rescueSite(token) : null, [token, victimIndex])
  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const p = pose.current
    p.clip = 'Idle'
    p.seconds = clock.elapsedTime + token.index * .31
    g.position.set(rest[0], DECK_Y + .07, rest[1])
    g.scale.setScalar(restScale)
    g.rotation.set(0, .48, 0, 'YXZ')
    g.visible = true
    if (award) {
      const t = Date.now() - award.startedAt
      if (award.tokenId !== token.id) {
        g.visible = t < 5600 || t > 7900
        return
      }
      const frame = coronationFrame(t)
      const stage = frame.approach * (1 - frame.exit)
      g.position.set(rest[0] * (1 - stage), DECK_Y + .07 + frame.lift, rest[1] * (1 - stage))
      g.scale.setScalar(THREE.MathUtils.lerp(restScale, 1, stage))
      const walking = t >= 2170 && t < 4160
      g.rotation.y = walking ? Math.atan2(-rest[0], -rest[1]) : CORONATION_YAW
      if (walking) { p.clip = 'Walk'; p.seconds = t / 520 }
      return
    }
    const danceElapsed = Date.now() - danceStartedAt.current
    if (danceElapsed >= 0 && danceElapsed < DANCE_MS && victimIndex < 0 && move?.tokenId !== token.id) {
      const beat = danceElapsed * Math.PI / 245 + token.index * .32
      const weight = ease(danceElapsed, 0, 120) * (1 - ease(danceElapsed, DANCE_MS - 220, DANCE_MS))
      g.position.y += .43 * Math.abs(Math.sin(beat)) * weight
      g.position.x += .16 * Math.sin(beat) * weight
      g.rotation.z = .36 * Math.sin(beat) * weight
      g.rotation.y += .62 * Math.cos(beat * .5) * weight
      p.clip = 'Walk'
      p.seconds = danceElapsed / 470 + token.index * .07
    }
    if (reaction && victimIndex < 0) {
      const elapsed = Date.now() - reaction.startedAt
      if (reaction.sender.id === token.id && move?.tokenId !== token.id && elapsed >= 0 && elapsed < 450) {
        g.rotation.y = reactionPath(reaction, elapsed).yaw
        g.rotation.x = -.24 * ease(elapsed, 0, 140) * (1 - ease(elapsed, 210, 450))
      }
      if (reaction.receiver.id === token.id || (reaction.kind === 'bomb' && token.seat === reaction.to)) {
        const fall = ease(elapsed, REACTION_HIT, REACTION_HIT + 210) * (1 - ease(elapsed, 2080, REACTION_DURATION))
        g.rotation.x = -fall * 1.45
      }
    }
    if (!move) return
    const elapsed = Math.max(0, Date.now() - move.startedAt)
    if (move.tokenId === token.id) {
      const walk = walkingPose(token, move, elapsed)
      const after = (elapsed - move.path.length * STEP_MS) / 1000
      g.position.set(walk.x, DECK_Y + .07, walk.z)
      g.rotation.y = walk.yaw
      if (move.path.at(-1) === HOME_STEP) {
        const finish = ease(elapsed, (move.path.length - 1) * STEP_MS, move.path.length * STEP_MS)
        g.scale.setScalar(THREE.MathUtils.lerp(1, FINISHED_TOKEN_SCALE, finish))
      }
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
  return <group name={token.id} ref={group} position={[rest[0], DECK_Y + .07, rest[1]]} scale={restScale}>
    <Pawn3D seat={token.seat} character={character} pose={pose} selectable={selectable} rescuePatient={victimIndex >= 0} />
  </group>
}

function Players({ reaction, danceStartedAt }: { reaction: Reaction | null; danceStartedAt: RefObject<number> }) {
  const currentTokens = useMatch((s) => s.tokens)
  const animation = useMatch((s) => s.animation)
  const coronation = useMatch(s => s.coronation)
  const moves = useMatch((s) => s.moves)
  const canPick = useMatch((s) => s.phase === 'await-move' && (s.mode === 'online'
    ? s.current === s.mySeat : s.players.some(p => p.seat === s.current && p.kind === 'human')))
  const tokens = animation?.before ?? currentTokens
  return <>
    {tokens.map(token => <AnimatedToken key={token.id} token={token} move={animation} reaction={reaction} danceStartedAt={danceStartedAt}
      award={coronation}
      selectable={!coronation && canPick && moves.some(m => m.tokenId === token.id)} />)}
    {animation?.captures.map((id, index) => {
      const victim = tokens.find(t => t.id === id)
      return victim && <SceneErrorSink key={id} label="rescue">
        <Rescue3D move={animation} victim={victim} index={index} />
      </SceneErrorSink>
    })}
  </>
}

const BOARD_HALF_SIDE = 8.35

function CameraRig({ view, setTapHandler, reaction, danceStartedAt }: Pick<ReturnType<typeof useBoardGesture>, 'view' | 'setTapHandler'> & {
  reaction: Reaction | null; danceStartedAt: RefObject<number>
}) {
  const move = useMatch((s) => s.animation)
  const award = useMatch(s => s.coronation)
  const tokens = useMatch(s => s.tokens)
  const seats = useMatch(s => s.seats)
  const dancePositions = useMemo(() => seats.flatMap(seat => {
    const actor = reactionAnchor(tokens, seat)
    return actor ? [toWorld(cellFor(actor))] : []
  }), [seats, tokens])
  const get = useThree(s => s.get)
  useLayoutEffect(() => {
    setTapHandler((x, y) => {
      const state = useMatch.getState()
      const human = state.mode === 'online' ? state.current === state.mySeat : state.players.some(p => p.seat === state.current && p.kind === 'human')
      if (!human || state.phase !== 'await-move' || state.coronation) return
      const { camera, size } = get()
      camera.updateMatrixWorld()
      const id = pickTokenAt(x, y, camera, size, state.tokens, state.moves)
      if (id !== null) state.pickToken(id)
    })
    return () => setTapHandler(null)
  }, [get, setTapHandler])
  useFrame(({ camera, scene, size }) => {
    const cam = camera as THREE.OrthographicCamera
    const aspect = size.width / Math.max(1, size.height)
    let angle = view.angle
    const edge = BOARD_HALF_SIDE * (Math.abs(Math.sin(angle)) + Math.abs(Math.cos(angle)))
    let x = 0, z = 0, lookY = .85
    const danceElapsed = Date.now() - danceStartedAt.current
    const danceFocus = ease(danceElapsed, 0, 360) * (1 - ease(danceElapsed, DANCE_MS - 460, DANCE_MS))
    const pitch = THREE.MathUtils.lerp(view.elevation, .48, danceFocus)
    let height = .85 + 19 * Math.tan(pitch)
    // Fit all four corners at the default zoom throughout rotation.
    const zoom = view.zoom / DEFAULT_BOARD_ZOOM
    let width = Math.max((2 * edge + .35) / zoom,
      (2 * edge * Math.sin(pitch) + 3.3 * Math.cos(pitch) + .45) * aspect)
    if (danceFocus > 0 && dancePositions.length) {
      const tour = Math.min(dancePositions.length - 1, (danceElapsed / (DANCE_MS - 500)) * (dancePositions.length - 1))
      const index = Math.floor(tour)
      const [fromX, fromZ] = dancePositions[index]
      const [toX, toZ] = dancePositions[Math.min(index + 1, dancePositions.length - 1)]
      const pan = ease(tour - index, .20, .78)
      x += (THREE.MathUtils.lerp(fromX, toX, pan) - x) * danceFocus
      z += (THREE.MathUtils.lerp(fromZ, toZ, pan) - z) * danceFocus
      width += (Math.max(9.8, 6.5 * aspect) - width) * danceFocus
    }
    const elapsed = reaction ? Date.now() - reaction.startedAt : -1
    if (reaction && !move?.captures.length && elapsed > 0 && elapsed < REACTION_DURATION) {
      const follow = ease(elapsed, 0, 220) * (1 - ease(elapsed, 2050, REACTION_DURATION))
      const path = reactionPath(reaction, elapsed, scene)
      x += (path.x - x) * follow
      z += (path.z - z) * follow
      height += (9 - height) * follow
      width += (Math.max(8.2, 5.2 * aspect) - width) * follow
    }
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
    if (award) {
      const t = Date.now() - award.startedAt
      const frame = coronationFrame(t)
      const approach = ease(t, 500, 3100)
      const { focus, portrait } = frame
      const targetY = DECK_Y + .75 + frame.lift + .35 * portrait
      const targetPitch = THREE.MathUtils.lerp(.73, .025, portrait)
      lookY = THREE.MathUtils.lerp(lookY, targetY, focus)
      height = THREE.MathUtils.lerp(height, targetY + 19 * Math.tan(targetPitch), focus)
      const angleDelta = CORONATION_YAW - angle
      angle += focus * Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta))
      x *= 1 - focus
      z *= 1 - focus
      const ensembleWidth = THREE.MathUtils.lerp(width, 8.5, approach)
      const portraitWidth = Math.max(3.45, 3.6 * aspect)
      width = THREE.MathUtils.lerp(width, THREE.MathUtils.lerp(ensembleWidth, portraitWidth, portrait), focus)
    }
    cam.position.set(x + 19 * Math.sin(angle), height, z + 19 * Math.cos(angle))
    cam.lookAt(x, lookY, z)
    const cameraZoom = size.width / width
    if (cam.zoom !== cameraZoom) { cam.zoom = cameraZoom; cam.updateProjectionMatrix() }
  })
  return null
}

// The model uses a separate glaze material for each recessed home area.
const YARD_MATERIALS = new Map<string, Seat>([
  ['Ruby recessed glaze', 0],
  ['Jade recessed glaze', 1],
  ['Amber recessed glaze', 2],
  ['Sapphire recessed glaze', 3],
])

function BakedBoard({ source }: { source: THREE.Group }) {
  const { scene, yards } = useMemo(() => {
    const scene = source.clone()
    const yards: Partial<Record<Seat, THREE.MeshStandardMaterial>> = {}
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return
      const seat = YARD_MATERIALS.get(object.material.name)
      if (seat === undefined) return
      const material = object.material.clone() as THREE.MeshStandardMaterial
      material.emissive.set(SEAT_HEX[seat])
      material.emissiveIntensity = 0
      object.material = material
      yards[seat] = material
    })
    return { scene, yards }
  }, [source])
  useYardGlow(yards)
  useEffect(() => () => { Object.values(yards).forEach(material => material.dispose()) }, [yards])
  return <primitive object={scene} />
}

function MatchBoard() {
  const board = useGameModel(boardModel)
  return board ? <BakedBoard source={board.scene} /> : <Board3D />
}

// The web surface also suppresses the browser's native pan and pinch gestures.
const gestureSurface = { ...StyleSheet.absoluteFill, touchAction: 'none' } as const

export default memo(function MatchScene({ reaction, danceStartedAt }: {
  reaction: Reaction | null; danceStartedAt: RefObject<number>
}) {
  const gesture = useBoardGesture()
  const award = useMatch(s => s.coronation)
  return <View style={{ flex: 1 }} onLayout={e => { gesture.setWidth(e.nativeEvent.layout.width) }}>
    <Canvas pointerEvents="none" orthographic camera={{ position: [11, 21, 16], near: .1, far: 180 }}
      gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
      }}>
      <CameraRig view={gesture.view} setTapHandler={gesture.setTapHandler} reaction={reaction} danceStartedAt={danceStartedAt} />
      <hemisphereLight args={['#fff3e6', '#8292a5', 1.9]} />
      <directionalLight position={[-8, 16, 10]} intensity={2.4} color="#fff5e4" />
      <directionalLight position={[9, 7, -9]} intensity={1.5} color="#c5e3ff" />
      <MatchBoard />
      <SceneErrorSink label="characters"><Players reaction={reaction} danceStartedAt={danceStartedAt} /></SceneErrorSink>
      {award && <SceneErrorSink key={award.startedAt} label="coronation"><Coronation3D award={award} /></SceneErrorSink>}
      {reaction && !award && <SceneErrorSink label="reaction"><FlyingReaction reaction={reaction} /></SceneErrorSink>}
    </Canvas>
    <View collapsable={false} style={gestureSurface} {...gesture.handlers} />
  </View>
})
