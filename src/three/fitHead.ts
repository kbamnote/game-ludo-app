import { toByteArray } from 'base64-js'
import * as THREE from 'three'
import { FACE_SIZE } from '../game/character'

function points(encoded: string) {
  const bytes = toByteArray(encoded)
  return Array.from({ length: 68 }, (_, i) => new THREE.Vector2(bytes[i*2] / 255, bytes[i*2+1] / 255))
}

// Align the two eye lines before fitting so camera distance and head tilt do
// not stretch the neck or turn a small face in the crop into a small skull.
function alignEyes(source: THREE.Vector2[], target: THREE.Vector2[]) {
  const eye = (p: THREE.Vector2[], a: number, b: number) => p[a].clone().lerp(p[b], .5)
  const a = eye(source,36,39), b = eye(source,42,45)
  const c = eye(target,36,39), d = eye(target,42,45)
  const ab = b.sub(a), cd = d.sub(c)
  const scale = cd.length() / Math.max(.05, ab.length())
  const angle = cd.angle() - ab.angle()
  return source.map(p => p.clone().sub(a).rotateAround(new THREE.Vector2(), angle).multiplyScalar(scale).add(c))
}

export function fitHead(root: THREE.Object3D, pixels: string, landmarks: string) {
  const head = root.getObjectByName('PortraitHead')
  if (!(head instanceof THREE.SkinnedMesh)) return
  const reference = points(head.userData.referenceFit), photo = points(landmarks)
  const fitted = alignEyes(photo, reference)
  const rgb = toByteArray(pixels)
  const geometry = head.geometry.clone()
  const { position, uv, color, normal } = geometry.attributes
  const tint = new THREE.Color()
  const clamp = THREE.MathUtils.clamp
  const bridge = clamp(fitted[30].distanceTo(fitted[27]) - reference[30].distanceTo(reference[27]), -.12, .12)
  for (let i = 0; i < position.count; i++) {
    const u = uv.getX(i), v = uv.getY(i)
    const front = THREE.MathUtils.smoothstep(normal.getZ(i), -.12, .55)
    if (front === 0) continue
    let total = 0, du = 0, dv = 0, dx = 0, dy = 0
    for (let k = 0; k < reference.length; k++) {
      const r = reference[k]
      const dist = (u-r.x)**2 + (v-r.y)**2
      const w = 1 / (dist + .00015)**2
      total += w
      du += w * (photo[k].x - r.x); dv += w * (photo[k].y - r.y)
      dx += w * (fitted[k].x - r.x); dy += w * (fitted[k].y - r.y)
    }
    const x = clamp((u + du/total) * (FACE_SIZE-1), 0, FACE_SIZE-1)
    const y = clamp((v + dv/total) * (FACE_SIZE-1), 0, FACE_SIZE-1)
    const x0 = Math.floor(x), y0 = Math.floor(y)
    const ix = Math.min(FACE_SIZE-1, x0+1), iy = Math.min(FACE_SIZE-1, y0+1)
    const sample = (channel: number) => {
      const row = (r: number) => THREE.MathUtils.lerp(rgb[(r*FACE_SIZE+x0)*3+channel], rgb[(r*FACE_SIZE+ix)*3+channel], x-x0)
      return THREE.MathUtils.lerp(row(y0), row(iy), y-y0) / 255
    }
    tint.setRGB(sample(0), sample(1), sample(2), THREE.SRGBColorSpace)
    color.setXYZ(i, THREE.MathUtils.lerp(color.getX(i),tint.r,front),
      THREE.MathUtils.lerp(color.getY(i),tint.g,front), THREE.MathUtils.lerp(color.getZ(i),tint.b,front))
    // 215 reference pixels cover .26875 game units. Infer a modest nose
    // projection from bridge length; a single front image has no measured depth.
    const nose = Math.exp(-((u-reference[30].x)**2/.006 + (v-reference[30].y)**2/.012))
    position.setXYZ(i, position.getX(i)+front*.26875*clamp(dx/total,-.2,.2),
      position.getY(i)-front*.26875*clamp(dy/total,-.2,.2),
      position.getZ(i)+front*nose*.18*bridge)
  }
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  head.geometry = geometry
  return () => geometry.dispose()
}
