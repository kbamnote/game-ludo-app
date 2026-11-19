import * as T from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

// MetaPerson exports use a humanoid skeleton. Work in world axes because the
// native GLB and an FBX converted to GLB can have different bone rest axes.
export function prepareMetaPerson(model: GLTF) {
  const source = model.scene
  source.updateMatrixWorld(true)
  const box = new T.Box3().setFromObject(source)
  const height = box.max.y-box.min.y
  if (!Number.isFinite(height) || height <= 0) throw Error('Invalid avatar bounds.')
  const bones = new Map<string,T.Bone>()
  source.traverse(n => { if (n instanceof T.Bone) bones.set(n.name.replace(/^.*mixamorig[:_]?/i,''),n) })
  if (!bones.has('Hips') || !bones.has('Head')) throw Error('The model needs a humanoid skeleton.')
  const wrapper = new T.Group()
  wrapper.name = 'AvatarMotion'
  const fitted = new T.Group()
  fitted.scale.setScalar(1.85/height)
  fitted.position.set(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2).multiplyScalar(fitted.scale.x)
  fitted.add(source); wrapper.add(fitted)
  wrapper.updateMatrixWorld(true)
  const hand = bones.get('RightHand')
  if (hand) {
    const blade = new T.Group()
    blade.name = 'AvatarSword'
    const metal = new T.MeshStandardMaterial({ color:0xcdddea,metalness:.35,roughness:.4 })
    const edge = new T.Mesh(new T.BoxGeometry(.035,.48,.012),metal)
    edge.position.y = .29
    const guard = new T.Mesh(new T.BoxGeometry(.14,.026,.032),metal)
    guard.position.y = .045
    blade.add(edge,guard)
    hand.add(blade)
    blade.quaternion.copy(hand.getWorldQuaternion(new T.Quaternion()).invert())
    const scale = hand.getWorldScale(new T.Vector3())
    blade.scale.set(1/scale.x,1/scale.y,1/scale.z)
    blade.userData.drawScale = blade.scale.toArray()
  }
  const clips = ['Idle','Walk','SwordSwipe','Knockout'].map(name => {
    const duration = name === 'Walk' ? .66 : name === 'Idle' ? 2 : .65
    const times = Array.from({length:17},(_,i)=>duration*i/16)
    const tracks: T.KeyframeTrack[] = []
    for (const side of ['Left','Right']) {
      const sign = side === 'Left' ? 1 : -1
      for (const part of ['Arm','ForeArm','UpLeg','Leg']) {
        const bone = bones.get(side+part)
        if (!bone?.parent) continue
        const parent = bone.parent.getWorldQuaternion(new T.Quaternion())
        const rest = bone.getWorldQuaternion(new T.Quaternion())
        // Lower T-pose arms according to their actual direction in the bind pose.
        let lower = 0
        if (part === 'Arm') {
          const elbow = bones.get(side+'ForeArm')
          if (elbow) {
            const dir = elbow.getWorldPosition(new T.Vector3()).sub(bone.getWorldPosition(new T.Vector3()))
            lower = -Math.sign(dir.x)*Math.atan2(Math.abs(dir.x),-dir.y)*.88
          }
        }
        const frames = times.flatMap(t => {
          const phase = t/duration
          const step = name === 'Walk' ? sign*Math.sin(phase*2*Math.PI) : 0
          const strike = name === 'SwordSwipe' && side === 'Right' ? Math.sin(phase*Math.PI) : 0
          const x = part === 'Arm' ? .48*step-1.6*strike : part === 'ForeArm' ? -.15-.4*strike :
            part === 'UpLeg' ? -.55*step : .55*Math.max(0,step)
          const rotation = new T.Quaternion().setFromEuler(new T.Euler(x,0,lower))
          return parent.clone().invert().multiply(rotation).multiply(rest).toArray()
        })
        tracks.push(new T.QuaternionKeyframeTrack(bone.name+'.quaternion',times,frames))
      }
    }
    if (name === 'Knockout') tracks.push(new T.NumberKeyframeTrack('AvatarMotion.rotation[x]',[0,.45,duration],[0,-1.5,-1.5]))
    const blade = wrapper.getObjectByName('AvatarSword')
    if (blade) {
      const scale = name === 'SwordSwipe' ? blade.userData.drawScale : [0,0,0]
      tracks.push(new T.VectorKeyframeTrack('AvatarSword.scale',[0,duration],[...scale,...scale]))
    }
    return new T.AnimationClip(name,duration,tracks)
  })
  const scene = new T.Group()
  scene.add(wrapper)
  return { ...model, scene, scenes:[scene], animations:clips }
}
