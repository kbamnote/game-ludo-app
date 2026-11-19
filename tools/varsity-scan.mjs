// Adapt the r178 Three.js LeePerrySmith scan to the Varsity rig.
// See assets/models/VarsityScan-LICENSE.txt for source and attribution.
import fs from 'node:fs'
import jpeg from 'jpeg-js'

export function appendScannedHead(mesh, vertex, scanPath, diffusePath) {
  const file = fs.readFileSync(scanPath)
  const jsonEnd = 20 + file.readUInt32LE(12)
  const doc = JSON.parse(file.subarray(20, jsonEnd))
  const primitive = doc.meshes[0].primitives[0]
  function array(index, Type, width) {
    const accessor = doc.accessors[index]
    const view = doc.bufferViews[accessor.bufferView]
    return new Type(file.buffer, file.byteOffset + jsonEnd + 8 + (view.byteOffset ?? 0) +
      (accessor.byteOffset ?? 0), accessor.count * width)
  }
  const pos = array(primitive.attributes.POSITION, Float32Array, 3)
  const uv = array(primitive.attributes.TEXCOORD_0, Float32Array, 2)
  const indices = array(primitive.indices, Uint16Array, 1)
  const photo = jpeg.decode(fs.readFileSync(diffusePath), { useTArray: true })
  const verts = new Map(), edges = new Map()
  const point = i => [pos[3*i], pos[3*i+1], pos[3*i+2], uv[2*i], uv[2*i+1]]
  function add([x, y, z, u, v]) {
    const col = Math.min(photo.width-1, Math.max(0, Math.round(u*(photo.width-1))))
    // This external diffuse was authored for Three's flipY texture convention.
    const row = Math.min(photo.height-1, Math.max(0, Math.round((1-v)*(photo.height-1))))
    const pixel = (row*photo.width+col)*4
    // Narrow the bottom of the scanned bust inside the collar. The lowest
    // ring follows the chest while the jaw and skull follow the head joint.
    const blend = Math.min(1, Math.max(0, (-y-.65)/1.65))
    const width = 1 - .56*blend
    return vertex(mesh, 427+45*x*width, 207-43*y, (43*z-8)*width,
      Array.from(photo.data.subarray(pixel,pixel+3)), ['Head','Chest',blend])
  }
  function original(i) {
    if (!verts.has(i)) verts.set(i, add(point(i)))
    return verts.get(i)
  }
  function middle(a,b) {
    const key = Math.min(a,b)*pos.length + Math.max(a,b)
    if (!edges.has(key)) {
      const pa = point(a), pb = point(b)
      edges.set(key, add(pa.map((n,k) => (n+pb[k])/2)))
    }
    return edges.get(key)
  }
  // Sample the diffuse map at shared edge midpoints as well as the original
  // vertices. This retains brow and lip detail without native image decoding.
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i], b = indices[i+1], c = indices[i+2]
    if (Math.min(pos[3*a+1], pos[3*b+1], pos[3*c+1]) < -2.35) continue
    const ab = middle(a,b), bc = middle(b,c), ca = middle(c,a)
    mesh.indices.push(original(a),ab,ca, ab,original(b),bc, ca,bc,original(c), ab,bc,ca)
  }
}
