import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber/native'
import { SEAT_HEX, type Token } from '../game/rules'
import { matchTime, type MoveAnimation } from '../game/store'
import { DECK_Y } from './layout'
import { ease, rescuePose, rescueSite, rescueTime } from './moveScene'
import { createRescueRig, disposeRescueRig } from './rescueModels'

export function animateRescue(rig: ReturnType<typeof createRescueRig>, t: number, distance: number) {
  const frame = rescuePose(t, distance)
  rig.root.visible = t >= .38 && t < 6.43
  if (!rig.root.visible) return
  rig.van.position.set(frame.vanX, 0, frame.van)
  rig.van.scale.setScalar(frame.vanScale)
  rig.doors.forEach((door, i) => { door.rotation.y = (i ? 1 : -1) * -1.85 * frame.doors })
  rig.lamps.forEach((lamp, i) => lamp.scale.setScalar(.75 + .25 * Math.sin(t * 23 + i * Math.PI)))
  rig.stretcher.visible = frame.crewVisible
  rig.stretcher.position.set(frame.stretcherX, frame.stretcherY, frame.stretcherZ)
  rig.stretcher.scale.x = .30 + .70 * ease(t, 2, 2.9)
  rig.crew.forEach((person, i) => {
    person.root.visible = frame.crewVisible
    if (!frame.crewVisible) return
    const side = i % 2 ? 1 : -1, end = i < 2 ? -1 : 1
    const out = ease(t, 1.88 + .085 * i, 2.76 + .065 * i)
    const inside = ease(t, 4.24 + .05 * i, 4.49 + .05 * i)
    const formation = out * (1 - inside)
    const x = frame.stretcherX + side * (.19 + .39 * formation)
    const z = frame.stretcherZ + end * .56 * formation + .12 * (1 - out)
    const crouch = ease(t, 2.75, 3.05) * (1 - ease(t, 3.1, 3.62))
    const walking = (out > 0 && out < 1) || (frame.load > 0 && frame.load < 1)
    const stride = walking ? Math.sin(t * 19 + i) : 0
    person.root.position.set(x, -.12 * crouch + .018 * Math.abs(stride), z)
    person.root.rotation.y = -side * Math.PI / 2
    person.torso.rotation.x = .48 * crouch
    person.legs[0].rotation.x = stride * .36 - .5 * crouch
    person.legs[1].rotation.x = -stride * .36 - .5 * crouch
    person.arms.forEach((arm, j) => {
      arm.rotation.x = -formation * (.59 + .5 * crouch) + (j ? 1 : -1) * stride * .13
    })
  })
}

export default function Rescue3D({ move, victim, index }: { move: MoveAnimation; victim: Token; index: number }) {
  const rig = useMemo(() => createRescueRig(SEAT_HEX[victim.seat]), [victim.seat])
  const site = useMemo(() => rescueSite(victim), [victim])
  useEffect(() => () => disposeRescueRig(rig.root), [rig])
  useFrame(() => animateRescue(rig, rescueTime(move, matchTime() - move.startedAt, index), site.distance), -1)
  return <group position={[site.x, DECK_Y + .065, site.z]} rotation={[0, site.yaw, 0]}>
    <primitive object={rig.root} />
  </group>
}
