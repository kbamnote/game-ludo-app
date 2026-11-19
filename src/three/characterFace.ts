import { toByteArray } from 'base64-js'
import * as THREE from 'three'
import { FACE_SIZE } from '../game/character'

const facialGeometry = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>()

// All four crew figures use the same head in bind space. Keep the original
// skinning and nose, replacing the painted features with the player's texture.
function faceGeometry(mesh: THREE.SkinnedMesh) {
  const source = mesh.geometry
  const cached = facialGeometry.get(source)
  if (cached) return cached
  const { position, color, skinIndex } = source.attributes
  const head = mesh.skeleton.bones.findIndex(bone => bone.name === 'Head')
  if (!source.index || head < 0 || !color || !skinIndex) return

  let nose = 0, nearest = Infinity
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    uv[2 * i] = .5 + x / .60
    uv[2 * i + 1] = (1.60 - y) / .47
    const distance = x * x + (y - 1.333) ** 2 + (z - .290) ** 2
    if (skinIndex.getX(i) === head && distance < nearest) { nearest = distance; nose = i }
  }

  const body: number[] = [], face: number[] = []
  for (let i = 0; i < source.index.count; i += 3) {
    const a = source.index.getX(i), b = source.index.getX(i + 1), c = source.index.getX(i + 2)
    const x = (position.getX(a) + position.getX(b) + position.getX(c)) / 3
    const y = (position.getY(a) + position.getY(b) + position.getY(c)) / 3
    const z = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3
    if (skinIndex.getX(a) === head && z > .075 && Math.abs(x) < .30) {
      const skin = color.getX(a) === color.getX(nose) && color.getY(a) === color.getY(nose) && color.getZ(a) === color.getZ(nose)
      if (skin) { face.push(a, b, c); continue }
      // Remove the stock eye, mouth and eyebrow paint. Preserve headwear.
      if (z > .19 && Math.abs(x) < .19 && y > 1.25 && y < 1.508) continue
    }
    body.push(a, b, c)
  }
  const geometry = source.clone()
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setIndex(body.concat(face))
  geometry.clearGroups()
  geometry.addGroup(0, body.length, 0)
  geometry.addGroup(body.length, face.length, 1)
  facialGeometry.set(source, geometry)
  return geometry
}

export function applyFace(root: THREE.Object3D, pixels: string) {
  const rgb = toByteArray(pixels)
  const rgba = new Uint8Array(FACE_SIZE * FACE_SIZE * 4)
  for (let i = 0; i < rgb.length / 3; i++) {
    rgba[i * 4] = rgb[i * 3]
    rgba[i * 4 + 1] = rgb[i * 3 + 1]
    rgba[i * 4 + 2] = rgb[i * 3 + 2]
    rgba[i * 4 + 3] = 255
  }
  const texture = new THREE.DataTexture(rgba, FACE_SIZE, FACE_SIZE)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .86 })
  root.traverse(part => {
    if (!(part instanceof THREE.SkinnedMesh) || Array.isArray(part.material)) return
    const geometry = faceGeometry(part)
    if (!geometry) return
    part.geometry = geometry
    part.material = [part.material, material]
  })
  return () => { texture.dispose(); material.dispose() }
}
