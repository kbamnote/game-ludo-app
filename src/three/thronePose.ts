import * as T from 'three'
import { THRONE_SEAT_HEIGHT } from '../game/coronation'

/** Build the seated pose from the current idle stance for either humanoid rig. */
export function makeThronePose(root: T.Object3D) {
  const bones = new Map<string, T.Bone>()
  root.traverse(node => {
    if (node instanceof T.Bone) bones.set(node.name.replace(/^.*mixamorig[:_]?/i, ''), node)
  })
  const hip = bones.get('HipL') ?? bones.get('LeftUpLeg')
  if (!hip || !root.parent) return null

  const scale = new T.Vector3()
  const hipsY = root.worldToLocal(hip.getWorldPosition(new T.Vector3())).y * root.getWorldScale(scale).y
  const drop = (THRONE_SEAT_HEIGHT + .075 - hipsY) / root.parent.getWorldScale(scale).y
  const initialY = root.position.y
  const right = new T.Vector3(1, 0, 0).applyQuaternion(root.getWorldQuaternion(new T.Quaternion()))
  const quarterTurn = Math.PI / 2
  const joints = [
    [['HipL', 'LeftUpLeg', 'HipR', 'RightUpLeg'], -.96 * quarterTurn],
    [['KneeL', 'LeftLeg', 'KneeR', 'RightLeg'], .90 * quarterTurn],
    [['ShoulderL', 'LeftArm', 'ShoulderR', 'RightArm'], -.22],
    [['ElbowL', 'LeftForeArm', 'ElbowR', 'RightForeArm'], -.31],
  ] as const
  const bends = joints.flatMap(([names, angle]) => names.flatMap(name => {
    const bone = bones.get(name)
    if (!bone?.parent) return []
    const axis = right.clone().applyQuaternion(bone.parent.getWorldQuaternion(new T.Quaternion()).invert())
    return [{ bone, axis, angle, idle: new T.Quaternion() }]
  }))
  const rotation = new T.Quaternion()
  let applied = false
  return {
    apply(weight: number) {
      for (const { bone, axis, angle, idle } of bends) {
        idle.copy(bone.quaternion)
        bone.quaternion.premultiply(rotation.setFromAxisAngle(axis, angle * weight))
      }
      root.position.y = initialY + drop * weight
      applied = true
    },
    restore() {
      // Mixers can skip writing unchanged tracks, so restore the sampled idle pose explicitly.
      if (!applied) return
      for (const { bone, idle } of bends) bone.quaternion.copy(idle)
      root.position.y = initialY
      applied = false
    },
  }
}
