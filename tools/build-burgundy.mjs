// Build the rigged streetwear prototype from the supplied 900 × 1599 front reference.
// Usage: node tools/build-burgundy.mjs reference.jpeg
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jpeg from 'jpeg-js'
import { appendScannedHead } from './varsity-scan.mjs'
import { BufferGeometry, Float32BufferAttribute } from 'three'

const dir = fileURLToPath(new URL('../assets/models/', import.meta.url))
const boardSize = process.argv.includes('--board')
// --scan LeePerrySmith.glb Map-COL.jpg builds the separate review model.
const scanArg = process.argv.indexOf('--scan')
const scanned = scanArg !== -1
const image = jpeg.decode(fs.readFileSync(process.argv[2]), { useTArray: true })
if (image.width !== 900 || image.height !== 1599) throw Error('Expected the original streetwear reference')
const referenceFit = 'KoMwlDimPrZIxlbOYtJx1IrTn8uuxLi8wqvFmsWIxXXEYTVmO1xGVlJSXFOASYpFlUOgRqxKcmB1bHd3eYJukHWQe5CDjYiLRm9MalZmX2lYbk9vhl+QWphYoFuZX49gZa5upnigfqCEno+fmaORp4msga55sG+wZ653p36lhqOYo4akf6Z4pw=='
const scale = .00125
const world = (x, y, z) => [(x - 450) * scale, (1550 - y) * scale, z * scale]
const lerp = (a, b, t) => a + (b - a) * t
const clamp = v => Math.max(0, Math.min(1, v))
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t) }
const pixel = (x, y) => {
  const i = 4 * (Math.max(0, Math.min(1598, Math.round(y))) * 900 + Math.max(0, Math.min(899, Math.round(x))))
  return [image.data[i], image.data[i + 1], image.data[i + 2]]
}
const linear = c => Math.round(255 * (c < 10.3 ? c / 3294.6 : ((c / 255 + .055) / 1.055) ** 2.4))
const chunks = []
const gltf = { asset: { version: '2.0', generator: 'CGP streetwear builder' }, buffers: [], bufferViews: [], accessors: [],
  nodes: [], meshes: [], animations: [], materials: [{ name: 'Streetwear', pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: .85 } }] }
let byteLength = 0
function accessor(values, type, componentType, bounds = false, normalized = false) {
  const ArrayType = { 5126: Float32Array, 5123: Uint16Array, 5121: Uint8Array }[componentType]
  const bytes = Buffer.from(new ArrayType(values).buffer)
  const view = gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length }) - 1
  const padding = Buffer.alloc((4 - bytes.length % 4) % 4)
  chunks.push(bytes, padding); byteLength += bytes.length + padding.length
  const width = { VEC2: 2, VEC3: 3, VEC4: 4, SCALAR: 1, MAT4: 16 }[type]
  const result = { bufferView: view, count: values.length / width, componentType, type }
  if (normalized) result.normalized = true
  if (bounds) {
    result.min = Array(width).fill(Infinity); result.max = Array(width).fill(-Infinity)
    values.forEach((v, i) => { const k = i % width; result.min[k] = Math.min(result.min[k], v); result.max[k] = Math.max(result.max[k], v) })
  }
  return gltf.accessors.push(result) - 1
}

// Reuse the game's four authored motions. Translation keys must be rebased
// onto the longer limbs; copying them verbatim would shrink the new skeleton.
const rigFile = fs.readFileSync(path.join(dir, 'Ruby.glb'))
const jsonEnd = 20 + rigFile.readUInt32LE(12)
const source = JSON.parse(rigFile.subarray(20, jsonEnd))
const data = rigFile.subarray(jsonEnd + 8)
const pivots = {
  Chest: [437, 774, 0], Head: [428, 233, 0], Blade: [273, 670, 73],
  HipR: [348, 788, 0], KneeR: [300, 1100, 3], ShoulderR: [303, 310, 0], ElbowR: [214, 500, 14],
  HipL: [521, 788, 0], KneeL: [540, 1090, 2], ShoulderL: [558, 310, 0], ElbowL: [636, 502, 15],
}
const skeleton = source.skins[0].joints
const names = skeleton.map(i => source.nodes[i].name)
const rest = name => world(...pivots[name])
const baseNodes = source.nodes.slice(0, 11)
gltf.nodes = baseNodes.map((node, i) => {
  const parent = baseNodes.find(n => n.children?.includes(i))
  const origin = parent ? rest(parent.name) : [0, 0, 0]
  return { ...node, translation: rest(node.name).map((p, k) => p - origin[k]) }
})
const inverseBindMatrices = accessor(names.flatMap(name => {
  const [x, y, z] = rest(name)
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, -x,-y,-z,1]
}), 'MAT4', 5126)
gltf.skins = [{ joints: skeleton, inverseBindMatrices }]
for (const animation of source.animations) {
  const samplers = animation.channels.map(({ sampler, target }) => {
    const sp = animation.samplers[sampler]
    function copy(id, rebase) {
      const a = source.accessors[id], view = source.bufferViews[a.bufferView]
      const values = Array.from(new Float32Array(data.buffer, data.byteOffset + view.byteOffset + (a.byteOffset || 0), view.byteLength / 4))
      if (rebase) for (let i = 0; i < values.length; i++) values[i] += gltf.nodes[target.node].translation[i % 3] - baseNodes[target.node].translation[i % 3]
      return accessor(values, a.type, 5126, a.type === 'SCALAR')
    }
    return { ...sp, input: copy(sp.input, false), output: copy(sp.output, target.path === 'translation') }
  })
  gltf.animations.push({ name: animation.name, samplers, channels: animation.channels.map((ch, i) => ({ ...ch, sampler: i })) })
}

function newMesh() { return { p: [], color: [], indices: [], joints: [], weights: [], uv: [] } }
const clothes = newMesh(), head = newMesh()
function vertex(mesh, x, y, z, rgb, weights) {
  mesh.p.push(...world(x, y, z))
  mesh.color.push(...rgb.map(c => linear(Math.min(255, Math.max(0, c)))))
  const [j1, j2 = j1, w = 0] = weights
  mesh.joints.push(names.indexOf(j1), names.indexOf(j2), 0, 0)
  mesh.weights.push(1 - w, w, 0, 0)
  mesh.uv.push((x - 320) / 215, (y - 45) / 215)
  return mesh.p.length / 3 - 1
}
// Each cross section gives image height, horizontal limits, depth radius and
// depth center. The front follows the reference; sides and back are sculpted.
function loft(rows, options) {
  const { mesh = clothes, bone, back, transform, solid, ridges = 0, openBottom = false } = options
  const sides = Math.max(8, Math.round((options.sides ?? 44) / (boardSize ? 3.5 : 1)))
  const step = (options.step ?? 12) * (boardSize ? 3.5 : 1)
  const start = mesh.p.length / 3
  const rings = [rows[0]]
  for (let k = 1; k < rows.length; k++) {
    const a = rows[k - 1], b = rows[k], count = Math.max(1, Math.ceil((b[0] - a[0]) / step))
    for (let i = 1; i <= count; i++) rings.push(a.map((v, j) => lerp(v, b[j], i / count)))
  }
  for (const [v, lo, hi, depth, cz] of rings) {
    for (let s = 0; s < sides; s++) {
      const t = s * Math.PI * 2 / sides, front = Math.cos(t)
      let x = lerp(lo, hi, .5 + .5 * Math.sin(t)), y = v
      let z = cz + depth * front + ridges * Math.sin(.05 * y + 4 * t) * Math.sin(3 * t)
      if (transform) [x, y, z] = transform(x, y, z, t)
      const sample = options.sampleColor?.(x, y, front) ?? pixel(x, y), mix = solid ? 0 : smooth((front + .1) / .63)
      const variation = 1 + .075 * Math.sin(4 * t + v * .023) + .05 * Math.cos(8 * t - v * .033)
      const rgb = back.map((c, k) => lerp(c * variation, sample[k], mix))
      vertex(mesh, x, y, z, rgb, typeof bone === 'string' ? [bone] : bone(v))
    }
  }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < sides; s++) {
    const a = start + r * sides + s, b = start + r * sides + (s + 1) % sides
    mesh.indices.push(a, a + sides, b, b, a + sides, b + sides)
  }
  // Close both ends even where fabric parts overlap during animation.
  for (let s = 1; s < sides - 1; s++) {
    if (!options.openTop) mesh.indices.push(start, start + s, start + s + 1)
    const end = start + (rings.length - 1) * sides
    if (!openBottom) mesh.indices.push(end, end + s + 1, end + s)
  }
}
const wine = [115, 33, 50], dark = [52, 48, 47], skin = [186, 124, 95], hair = [48, 34, 33]
if (!scanned) loft([[191,382,470,39,-2],[234,377,472,47,0],[265,356,487,54,0],[309,325,521,68,0]], { bone: 'Chest', back: skin })
const collar = scanned ? {
  openTop: true,
  transform: (x,y,z,t) => {
    const top = clamp((283-y)/30)
    return [lerp(x,427,.45*top), y+top*(10+14*Math.cos(t)), lerp(z,-25,.42*top)]
  },
  sampleColor: (x,y,front) => {
    const rgb = pixel(x,y)
    // Skin from the old portrait is baked into the reference above the T-shirt.
    // Continue the T-shirt through this opening under the new scanned neck.
    if (y < 309 && front > 0 && rgb[0] > rgb[1]*1.18 && rgb[1] > rgb[2]*1.17)
      return [222,211,213]
    return rgb
  },
} : {}
loft([[253,368,477,55,0],[276,324,517,65,0],[310,285,568,76,-4],[360,285,578,82,-5],[449,299,575,89,-4],[540,292,576,82,-4],[627,283,585,80,-4],[678,275,586,77,-4],[698,275,579,73,-4]], { bone: 'Chest', back: wine, sides: 84, step: 8, ridges: 2.8, ...collar })
loft([[676,303,570,69,-1],[696,285,582,74,-2],[742,268,604,78,-3],[785,262,608,80,-4],[812,270,597,71,-4]], { bone: 'Chest', back: dark })
for (const [tag, right] of [['R', false], ['L', true]]) {
  const leg = right ? [[751,423,596,65],[816,422,610,72],[910,428,620,70],[1014,439,622,61],[1100,456,613,63],[1210,466,598,57],[1327,469,596,57],[1377,466,581,54],[1402,483,563,43]]
    : [[749,267,443,64],[825,245,437,72],[923,219,424,74],[1029,201,411,69],[1115,204,395,63],[1216,204,371,58],[1320,203,360,56],[1369,213,348,50],[1399,224,326,42]]
  const knees = y => ['Hip' + tag, 'Knee' + tag, smooth((y - 1045) / 104)]
  loft(leg.map(r => [...r, 0]), { bone: knees, back: dark, ridges: 4, sides: 54, step: 9 })
  const foot = right ? [[1385,485,561,38,-4],[1418,486,570,43,0],[1441,477,592,54,10],[1469,469,605,64,28],[1491,468,634,80,41],[1514,471,656,91,48],[1532,484,656,90,48],[1541,506,643,82,48]]
    : [[1385,231,321,39,-5],[1418,225,323,43,0],[1440,211,327,54,12],[1470,195,322,64,28],[1502,171,317,80,45],[1523,160,316,91,48],[1540,167,304,87,48],[1548,189,286,80,48]]
  loft(foot, { bone: 'Knee' + tag, back: [170,147,145], sides: 52, step: 4 })
  const sleeve = right ? [[282,516,554,24],[308,520,588,42],[344,538,613,48],[402,548,627,50],[466,563,650,51],[504,580,675,51],[548,580,680,48],[580,575,668,43],[606,582,643,36]]
    : [[285,293,331,25],[310,264,339,42],[349,244,322,48],[404,218,302,51],[467,191,281,54],[500,184,271,52],[537,196,280,50],[575,215,285,41],[603,235,285,32]]
  const elbow = y => ['Shoulder' + tag, 'Elbow' + tag, smooth((y - 453) / 98)]
  loft(sleeve.map(r => [...r, lerp(-6, 51, clamp((r[0] - 380) / 220))]), { bone: elbow, back: wine, sides: 48, step: 7 })
  const hand = right ? [[591,584,638,29],[615,579,633,28],[641,571,614,22],[664,571,595,15],[679,573,582,5]]
    : [[590,234,285,29],[617,237,290,27],[643,243,289,23],[665,251,283,16],[687,263,277,7]]
  loft(hand.map(r => [...r, 57]), { bone: 'Elbow' + tag, back: skin, sides: 32, step: 5 })
}
// The nose bridge, brow ridge, eye sockets, lips and chin change the profile.
// The crown and ears are separate volumes and remain behind the facial surface.
const bump = (x,y,cx,cy,rx,ry) => Math.exp(-(((x-cx)/rx)**2 + ((y-cy)/ry)**2))
if (scanned) appendScannedHead(head, vertex, process.argv[scanArg+1], process.argv[scanArg+2])
else loft([[56,396,453,39,1],[73,366,477,60,0],[91,351,485,72,0],[119,347,491,74,0],[143,350,493,73,1],[164,357,493,69,3],[183,365,488,61,6],[202,380,477,54,9],[217,401,462,44,13],[228,420,447,25,18],[231,430,437,13,20]], {
  mesh: head, bone: 'Head', back: skin, sides: 112, step: 2.8,
  transform: (x,y,z,t) => {
    const f = smooth(Math.cos(t))
    const depth = 16*bump(x,y,420,139,9,24) + 27*bump(x,y,423,156,13,10) +
      6*bump(x,y,428,185,25,9) + 8*bump(x,y,434,211,24,12) -
      8*bump(x,y,389,137,15,7) - 8*bump(x,y,446,125,15,7)
    return [x,y,z+f*depth]
  },
})
if (!scanned) for (const [cx,cy] of [[347,154],[497,146]]) loft([[cy-20,cx-3,cx+3,3],[cy-11,cx-8,cx+7,7],[cy,cx-10,cx+8,8],[cy+14,cx-6,cx+6,6],[cy+23,cx-2,cx+2,2]].map(r=>[...r,2]), {bone:'Head',back:skin,sides:20,step:3})
// Swept hair has a raised front hairline, a full nape and asymmetric waves.
loft([[14,392,446,20,-12],[23,364,470,45,-13],[38,341,481,62,-13],[57,325,492,74,-14],[78,315,500,82,-14],[94,316,505,83,-14]], {
  bone:'Head', back:hair, sides:100, step:2.7, openBottom:true,
  // The scan has its own ears and scalp. Use the hair swatch for the whole
  // cap so moving its hairline never transfers skin from the reference photo.
  ...(scanned && { sampleColor: (x,y) => pixel(408+(x-420)*.38,35+12*Math.sin(y*.03)) }),
  transform:(x,y,z,t)=>{
    const n=smooth((y-32)/62), side=1-Math.max(0,Math.cos(t))**2
    const wave=Math.sin(11*t + y*.035) + .6*Math.cos(18*t - y*.055)
    const fittedX = scanned ? 427 + (x-412)*.94 : x
    return [fittedX+3*wave*n-11*Math.sin(t)*side*n,y+n*(side*(scanned ? 66 : 86) + 4*wave - 16*Math.sin(t)),z+6*wave*n]
  },
})
// A separate sword joint follows the existing action's draw and holster keys.
loft([[458,265,268,1,79],[487,263,283,3,79],[633,266,281,3,79],[640,267,280,2,79]], {bone:'Blade',back:[195,214,225],solid:true,sides:8})
loft([[638,252,293,5,79],[645,253,293,5,79],[648,266,280,4,79],[687,268,278,4,79]], {bone:'Blade',back:[101,72,50],solid:true,sides:10})

for (const [name, mesh] of [['Varsity outfit', clothes], [scanned ? 'ScannedHead' : 'PortraitHead', head]]) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(mesh.p, 3))
  geometry.setIndex(mesh.indices); geometry.computeVertexNormals()
  const attributes = {
    POSITION: accessor(mesh.p,'VEC3',5126,true), NORMAL: accessor(geometry.attributes.normal.array,'VEC3',5126),
    COLOR_0: accessor(mesh.color,'VEC3',5121,false,true), JOINTS_0: accessor(mesh.joints,'VEC4',5121),
    WEIGHTS_0: accessor(mesh.weights,'VEC4',5126),
  }
  if (mesh === head && !scanned) attributes.TEXCOORD_0 = accessor(mesh.uv,'VEC2',5126)
  const id = gltf.meshes.push({ name, primitives: [{ attributes, indices: accessor(mesh.indices,'SCALAR',5123), material: 0 }] }) - 1
  gltf.nodes.push({ name, mesh: id, skin: 0, ...(mesh === head && !scanned ? { extras: { referenceFit } } : {}) })
}
gltf.scene = 0; gltf.scenes = [{ nodes: [10,11,12] }]
gltf.buffers.push({ byteLength })
const json = Buffer.from(JSON.stringify(gltf)), jsonPad = Buffer.alloc((4-json.length%4)%4,32)
const header = Buffer.alloc(20), binHeader = Buffer.alloc(8)
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jsonPad.length+byteLength,8)
header.writeUInt32LE(json.length+jsonPad.length,12);header.write('JSON',16)
binHeader.writeUInt32LE(byteLength);binHeader.write('BIN\0',4)
fs.writeFileSync(path.join(dir, scanned ? 'VarsityScan.glb' : boardSize ? 'BurgundyBoard.glb' : 'Burgundy.glb'),Buffer.concat([header,json,jsonPad,binHeader,...chunks]))
