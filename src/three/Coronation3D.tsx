import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber/native'
import * as T from 'three'
import { coronationDuration, CORONATION_YAW, THRONE_SEAT_HEIGHT, type Coronation } from '../game/coronation'
import { SEAT_HEX } from '../game/rules'
import { matchTime } from '../game/store'
import { DECK_Y } from './layout'
import { coronationFrame, ease } from './moveScene'
import { createMedic, disposeRescueRig } from './rescueModels'

const FLOOR = DECK_Y + .07
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const

function add(parent: T.Group, geometry: T.BufferGeometry, material: T.Material, x: number, y: number, z: number) {
  const mesh = new T.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

function scalpHeight(winner: T.Object3D, sample: T.Vector3) {
  winner.updateWorldMatrix(true, true)
  const x = Math.cos(winner.rotation.y), z = -Math.sin(winner.rotation.y)
  let top = 0
  winner.traverse(object => {
    if (!(object instanceof T.Mesh)) return
    const positions = object.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      sample.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld)
      const y = sample.y - winner.position.y
      if (y <= top) continue
      const across = (sample.x - winner.position.x) * x + (sample.z - winner.position.z) * z
      if (Math.abs(across) < .11) top = y
    }
  })
  return top
}

function buildThrone(gold: T.Material, velvet: T.Material, jewel: T.Material) {
  const throne = new T.Group()
  throne.name = 'winner-throne'
  throne.rotation.y = CORONATION_YAW
  throne.visible = false
  const arch = new T.Shape()
  arch.moveTo(-.54, 0)
  arch.lineTo(-.54, .82)
  arch.quadraticCurveTo(-.54, 1.06, 0, 1.18)
  arch.quadraticCurveTo(.54, 1.06, .54, .82)
  arch.lineTo(.54, 0)
  arch.closePath()
  const backOptions = { depth: .083, bevelThickness: .035, bevelSize: .035, bevelSegments: 2, curveSegments: 9 }
  add(throne, new T.ExtrudeGeometry(arch, backOptions), gold, 0, .48, -.79)
  add(throne, new T.ExtrudeGeometry(arch, backOptions), velvet, 0, .55, -.72).scale.set(.83, .86, .56)
  add(throne, new T.BoxGeometry(1.19, .13, .94), gold, 0, .36, -.34)
  add(throne, new T.BoxGeometry(1.06, .082, .85), velvet, 0, THRONE_SEAT_HEIGHT - .041, -.32)
  for (const side of [-1, 1]) {
    for (const z of [-.68, .047]) add(throne, new T.CylinderGeometry(.068, .10, .333, 9), gold, side * .51, .1665, z)
    add(throne, new T.CylinderGeometry(.052, .074, .26, 9), gold, side * .61, .60, .051)
    add(throne, new T.CapsuleGeometry(.066, .61, 3, 10), gold, side * .59, .74, -.257).rotation.x = Math.PI / 2
    add(throne, new T.SphereGeometry(.082, 12, 8), gold, side * .59, .74, .088)
    add(throne, new T.SphereGeometry(.087, 12, 8), gold, side * .49, 1.44, -.74)
    for (const y of [.74, .98, 1.19]) {
      add(throne, new T.SphereGeometry(.027, 8, 6), gold, side * .255, y, -.642)
    }
  }
  add(throne, new T.OctahedronGeometry(.105), gold, 0, 1.68, -.74).scale.set(1.1, 1.35, .65)
  add(throne, new T.OctahedronGeometry(.055), jewel, 0, 1.68, -.655)
  return throne
}

function makeRoyals(award: Coronation) {
  const root = new T.Group()
  const crewPaint = new T.MeshStandardMaterial({ vertexColors: true, roughness: .58 })
  const metal = new T.MeshStandardMaterial({
    color: award.place === 1 ? '#ffc54d' : '#dbe9ff',
    emissive: award.place === 1 ? '#734400' : '#263d63', emissiveIntensity: .28, metalness: .48, roughness: .29,
  })
  const brass = new T.MeshStandardMaterial({ color: '#f5bb49', metalness: .42, roughness: .34 })
  const cream = new T.MeshStandardMaterial({ color: '#fff2d4' })
  const dark = new T.MeshStandardMaterial({ color: '#211b36', roughness: .72 })
  const cloth = new T.MeshStandardMaterial({ color: '#672858', roughness: .78 })
  const skin = new T.MeshStandardMaterial({ color: '#ce9a77', roughness: .68 })
  const beard = new T.MeshStandardMaterial({ color: '#62434a', roughness: .8 })
  const jewel = new T.MeshStandardMaterial({
    color: award.place === 1 ? '#ce3255' : '#417de8', emissive: SEAT_HEX[award.seat], emissiveIntensity: .18,
  })
  const crew = CORNERS.map((_, index) => {
    const member = createMedic(crewPaint, index)
    const { root: person, arms } = member
    person.name = 'coronation-musician-' + index
    person.scale.setScalar(1.35)
    root.add(person)
    if (index % 2 === 0) {
      add(person, new T.CylinderGeometry(.205, .205, .20, 14), cloth, 0, .34, .28)
      for (const y of [.24, .44]) add(person, new T.CylinderGeometry(.212, .212, .026, 14), cream, 0, y, .28)
      for (const arm of arms) add(arm, new T.CylinderGeometry(.016, .012, .25, 7), brass, 0, -.28, .13)
        .rotation.x = Math.PI / 2
    } else {
      const tube = add(person, new T.CylinderGeometry(.036, .036, .34, 8), brass, 0, .662, .27)
      tube.rotation.x = Math.PI / 2
      add(person, new T.CylinderGeometry(.15, .034, .20, 14, 1, true), brass, 0, .662, .49)
        .rotation.x = Math.PI / 2
      add(person, new T.TorusGeometry(.15, .012, 6, 14), brass, 0, .662, .59)
    }
    return member
  })

  const king = new T.Group()
  king.name = 'coronation-king'
  root.add(king)
  const boots = [-1, 1].map(side => add(king, new T.BoxGeometry(.17, .13, .26), dark, side * .16, .065, .12))
  add(king, new T.CylinderGeometry(.29, .44, .78, 14), cloth, 0, .57, 0)
  add(king, new T.CylinderGeometry(.438, .45, .08, 14), brass, 0, .20, 0)
  add(king, new T.CylinderGeometry(.322, .328, .062, 14), brass, 0, .76, 0)
  add(king, new T.SphereGeometry(.26, 16, 10), cream, 0, .98, 0).scale.set(1.35, .36, .80)
  add(king, new T.SphereGeometry(.237, 16, 12), skin, 0, 1.23, 0).scale.set(.91, 1.14, .9)
  add(king, new T.SphereGeometry(.165, 12, 9), beard, 0, 1.095, .115).scale.set(.96, .64, .55)
  for (const side of [-1, 1]) {
    add(king, new T.SphereGeometry(.019, 8, 7), dark, side * .076, 1.266, .184)
    add(king, new T.SphereGeometry(.078, 9, 7), beard, side * .052, 1.16, .183).scale.set(1, .34, .48)
  }
  add(king, new T.CylinderGeometry(.232, .235, .067, 14), brass, 0, 1.455, 0)
  add(king, new T.SphereGeometry(.218, 12, 8), cloth, 0, 1.474, 0).scale.y = .53
  const arms = [-1, 1].map(side => {
    const arm = new T.Group()
    arm.position.set(side * .29, .93, 0)
    king.add(arm)
    add(arm, new T.CapsuleGeometry(.092, .25, 4, 10), cloth, 0, -.16, 0)
    add(arm, new T.SphereGeometry(.075, 10, 8), skin, 0, -.34, 0)
    return arm
  })
  const hand = new T.Object3D()
  hand.position.set(0, -.34, 0)
  arms[0].add(hand)

  const crown = new T.Group()
  crown.name = 'placement-crown'
  root.add(crown)
  add(crown, new T.CylinderGeometry(.218, .185, .083, 24, 1, true), metal, 0, .055, 0)
  add(crown, new T.TorusGeometry(.186, .017, 7, 24), metal, 0, .018, 0).rotation.x = -Math.PI / 2
  for (let i = 0; i < 8; i++) {
    const theta = i * Math.PI / 4
    const x = .199 * Math.sin(theta), z = .199 * Math.cos(theta)
    const tip = add(crown, new T.ConeGeometry(.071, .155, 4), metal, x, .153, z)
    tip.rotation.y = theta + Math.PI / 4
    add(crown, new T.SphereGeometry(.025, 8, 6), jewel, x * 1.08, .095, z * 1.08)
  }

  const podium = new T.Group()
  podium.name = 'coronation-podium'
  root.add(podium)
  // Modelled from its base to y=1 so its top tracks the winner during the lift.
  add(podium, new T.CylinderGeometry(.53, .64, .84, 12), dark, 0, .48, 0)
  add(podium, new T.CylinderGeometry(.678, .69, .085, 12), metal, 0, .064, 0)
  add(podium, new T.CylinderGeometry(.66, .57, .11, 12), metal, 0, .92, 0)
  add(podium, new T.CylinderGeometry(.594, .594, .035, 12), jewel, 0, .981, 0)
  for (const side of [-1, 1]) add(podium, new T.BoxGeometry(.053, .76, .023), metal, side * .30, .50, .502)

  const throne = award.place === 1 ? buildThrone(metal, cloth, jewel) : null
  if (throne) root.add(throne)

  root.position.y = FLOOR
  root.visible = false
  return { root, crew, king, arms, boots, hand, crown, podium, throne }
}

export default function Coronation3D({ award }: { award: Coronation }) {
  const rig = useMemo(() => makeRoyals(award), [award])
  const movingRig = useRef(rig)
  const crownFit = useRef({
    head: new T.Vector3(), grip: new T.Vector3(), sample: new T.Vector3(), bonePosition: new T.Vector3(),
    height: 1.73, restHeadY: 0, fitted: false, headBone: undefined as T.Object3D | undefined,
  })
  useLayoutEffect(() => {
    movingRig.current = rig
    crownFit.current.fitted = false
    return () => disposeRescueRig(rig.root)
  }, [rig])
  useFrame(({ scene }) => {
    const rig = movingRig.current
    const anchor = crownFit.current
    const t = matchTime() - award.startedAt
    const frame = coronationFrame(t, award.place)
    rig.root.visible = true
    rig.crew.forEach(({ root, arms, legs }, index) => {
      const [x, z] = CORNERS[index]
      const { march } = frame
      const stride = Math.sin(t * .014 + index) * (1 - ease(t, 2900, 3150))
      root.position.set(x * T.MathUtils.lerp(7.7, 1.47, march), .068 * Math.abs(stride), z * T.MathUtils.lerp(7.7, 1.38, march))
      root.rotation.y = Math.atan2(-x, -z)
      legs[0].rotation.x = .64 * stride
      legs[1].rotation.x = -.64 * stride
      const beat = Math.sin(t * .018 + index)
      arms.forEach((arm, side) => { arm.rotation.x = index % 2 === 0 ? -1.39 + (side ? .27 : -.27) * beat : -1.66 })
    })

    rig.king.visible = t >= 2170
    const stride = Math.sin(t * .014) * (1 - ease(t, 3800, 4160) + ease(t, 5500, 5700) * (1 - ease(t, 6500, 6750)))
    rig.king.position.set(T.MathUtils.lerp(4.2, 1.03, frame.approach) + frame.retreat * 1.20, .045 * Math.abs(stride),
      T.MathUtils.lerp(-4.6, -.29, frame.approach) - frame.retreat * .65)
    rig.boots.forEach((boot, i) => { boot.position.z = .12 + (i === 0 ? -.16 : .16) * stride })
    rig.king.rotation.y = Math.atan2(-rig.king.position.x, -rig.king.position.z)
    rig.arms[0].rotation.x = -.88 - .96 * frame.crown * (1 - frame.retreat)
    rig.arms[1].rotation.x = .15 * Math.sin(t * .013) * (1 - frame.approach)
    rig.podium.visible = frame.lift > .01
    rig.podium.scale.y = Math.max(.01, frame.lift)
    if (rig.throne) {
      rig.throne.visible = frame.throne > .01
      rig.throne.position.y = frame.lift
      rig.throne.scale.y = Math.max(.01, frame.throne)
    }

    const winner = scene.getObjectByName(award.tokenId)
    if (winner && t >= 4190) {
      const headBone = winner.getObjectByName('Head') ?? winner.getObjectByName('mixamorigHead') ?? winner.getObjectByName('mixamorig_Head')
      if (!anchor.fitted || headBone !== anchor.headBone) {
        // Fit at the centre of the head, below hairstyles that are taller at the sides.
        const top = scalpHeight(winner, anchor.sample)
        if (Number.isFinite(top) && top > 1.10) {
          anchor.height = T.MathUtils.clamp(top - .066, 1.10, 2.22)
          // A late avatar load can happen mid-pose. Sample its skeleton at the same time as the crown fit.
          anchor.restHeadY = headBone ? headBone.getWorldPosition(anchor.bonePosition).y - winner.position.y : 0
          anchor.fitted = true
          anchor.headBone = headBone
        }
      }
    }
    rig.crown.visible = rig.king.visible && t < coronationDuration(award.place) - 310
    rig.hand.getWorldPosition(anchor.grip)
    anchor.grip.y -= FLOOR - .045
    const shiftY = winner && anchor.headBone
      ? anchor.headBone.getWorldPosition(anchor.bonePosition).y - winner.position.y - anchor.restHeadY : 0
    anchor.head.set(winner?.position.x ?? 0, anchor.height + shiftY + (winner ? winner.position.y - FLOOR : frame.lift), winner?.position.z ?? 0)
    rig.crown.position.copy(anchor.grip).lerp(anchor.head, frame.crown)
    rig.crown.rotation.z = .25 * (1 - frame.crown)
  }, -.5)
  return <primitive object={rig.root} />
}
