import * as T from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

type XYZ = [number, number, number]
const white = '#fcf7e9', teal = '#167d84', navy = '#23354e', silver = '#a9c2c5'
const rubber = '#202937', glass = '#3e7284', gold = '#ffce63'

// Batch fixed details of each moving part into one vertex-painted mesh.
class Parts {
  private pieces: T.BufferGeometry[] = []
  constructor(private material: T.Material) {}
  private add(source: T.BufferGeometry, at: XYZ, color: string, rotation: XYZ = [0, 0, 0]) {
    const g = source.index ? source.toNonIndexed() : source
    if (g !== source) source.dispose()
    g.rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2])
    g.translate(...at)
    const rgb = new T.Color(color)
    const colors = new Float32Array(g.getAttribute('position').count * 3)
    for (let i = 0; i < colors.length; i += 3) rgb.toArray(colors, i)
    g.setAttribute('color', new T.BufferAttribute(colors, 3))
    this.pieces.push(g)
  }
  box(at: XYZ, size: XYZ, color: string, radius = 0) {
    this.add(radius ? new RoundedBoxGeometry(...size, 1, radius) : new T.BoxGeometry(...size), at, color)
  }
  oval(at: XYZ, size: XYZ, color: string) {
    this.add(new T.SphereGeometry(1, 12, 8).scale(...size), at, color)
  }
  wheel(at: XYZ, r: number, width: number, color: string) {
    this.add(new T.CylinderGeometry(r, r, width, 14), at, color, [0, 0, Math.PI / 2])
  }
  finish() {
    const mesh = new T.Mesh(mergeGeometries(this.pieces), this.material)
    this.pieces.forEach((p) => p.dispose())
    return mesh
  }
}

function ambulance(material: T.Material, trim: string) {
  const van = new T.Group()
  const body = new Parts(material)
  body.box([0, .32, 0], [1.18, .21, 2.35], navy, .06)
  body.box([0, .93, .73], [1.18, .91, .86], white, .12)
  body.box([0, .70, 1.08], [1.19, .40, .45], white, .08)
  body.box([0, 1.13, 1.152], [1.00, .35, .04], glass, .018)
  body.box([0, .55, 1.31], [.55, .14, .035], navy, .015)
  body.box([0, .41, 1.22], [1.22, .11, .18], silver, .03)
  body.box([0, 1.42, -.40], [1.27, .12, 1.68], white, .055)
  body.box([0, .86, .34], [1.18, .99, .13], white)
  for (const s of [-1, 1]) {
    body.box([s * .577, .90, -.46], [.10, .99, 1.45], white, .045)
    body.box([s * .635, .70, -.39], [.025, .14, 1.58], trim)
    body.box([s * .638, .99, -.46], [.024, .37, .12], teal)
    body.box([s * .638, .99, -.46], [.024, .12, .35], teal)
    body.box([s * .59, 1.13, .74], [.03, .33, .47], glass, .014)
    body.box([s * .45, .68, 1.302], [.22, .13, .026], gold)
    body.box([s * .56, .59, -1.208], [.10, .24, .04], '#ff6557')
    for (const z of [-.77, .78]) {
      body.wheel([s * .56, .25, z], .25, .18, rubber)
      body.wheel([s * .661, .25, z], .143, .027, silver)
      body.wheel([s * .680, .25, z], .069, .015, navy)
    }
  }
  body.box([0, 1.48, .20], [.74, .07, .20], navy, .028)
  van.add(body.finish())
  const lamps = [-1, 1].map((s) => {
    const lamp = new T.Mesh(new RoundedBoxGeometry(.27, .14, .18, 1, .05),
      new T.MeshBasicMaterial({ color: s < 0 ? '#ff585b' : '#64deff', toneMapped: false }))
    lamp.position.set(s * .20, 1.55, .20)
    van.add(lamp)
    return lamp
  })
  const doors = [-1, 1].map((s) => {
    const hinge = new T.Group()
    hinge.position.set(s * .59, .91, -1.18)
    const door = new Parts(material)
    door.box([-s * .29, 0, 0], [.58, .96, .08], white, .035)
    door.box([-s * .29, .19, -.049], [.41, .29, .035], glass, .017)
    door.box([-s * .29, -.20, -.048], [.58, .13, .018], trim)
    door.box([-s * .49, -.04, -.056], [.052, .12, .05], navy)
    hinge.add(door.finish())
    van.add(hinge)
    return hinge
  })
  return { van, doors, lamps }
}

export function createMedic(material: T.Material, index: number) {
  const root = new T.Group(), torso = new T.Group()
  const skin = ['#925b45', '#ecb287', '#a97152', '#c78965'][index]
  const hair = ['#3c2b31', '#493026', '#282533', '#62382b'][index]
  const uniform = new Parts(material)
  uniform.box([0, .09, 0], [.32, .32, .22], teal, .055)
  uniform.box([0, .06, .113], [.31, .045, .018], '#eff5ae')
  uniform.box([-.08, .17, .12], [.06, .075, .014], white)
  uniform.oval([0, .34, 0], [.147, .156, .13], skin)
  uniform.oval([0, .432, -.006], [.15, .083, .134], hair)
  uniform.oval([0, .473, .015], [.151, .057, .153], teal)
  uniform.box([0, .425, .109], [.21, .036, .12], teal, .016)
  uniform.oval([0, .307, .105], [.115, .061, .039], '#d5f2ed')
  for (const s of [-1, 1]) uniform.oval([s * .055, .366, .111], [.018, .022, .013], navy)
  torso.add(uniform.finish())
  torso.position.y = .34
  root.add(torso)
  const legs = [-1, 1].map((s) => {
    const leg = new T.Group(), parts = new Parts(material)
    leg.position.set(s * .083, .34, 0)
    parts.box([0, -.132, 0], [.129, .275, .139], navy, .027)
    parts.box([0, -.286, .026], [.141, .105, .206], rubber, .038)
    leg.add(parts.finish()); root.add(leg)
    return leg
  })
  const arms = [-1, 1].map((s) => {
    const arm = new T.Group(), parts = new Parts(material)
    arm.position.set(s * .17, .195, .01)
    parts.box([0, -.075, 0], [.119, .168, .15], teal, .033)
    parts.oval([0, -.176, .027], [.053, .083, .059], skin)
    parts.oval([0, -.246, .042], [.057, .060, .060], '#b2e4e2')
    arm.add(parts.finish()); torso.add(arm)
    return arm
  })
  return { root, torso, arms, legs }
}

export function createRescueRig(trim: string) {
  const root = new T.Group()
  const material = new T.MeshStandardMaterial({ vertexColors: true, roughness: .58 })
  const vehicle = ambulance(material, trim)
  root.add(vehicle.van)
  const crew = Array.from({ length: 4 }, (_, i) => createMedic(material, i))
  crew.forEach(({ root: person }) => root.add(person))
  const parts = new Parts(material)
  parts.box([0, .04, 0], [.55, .12, 1.64], '#eb9648', .055)
  parts.box([0, .127, -.59], [.43, .065, .26], white, .03)
  for (const s of [-1, 1]) {
    parts.box([s * .305, 0, 0], [.056, .067, 1.84], silver, .023)
    for (const z of [-.59, .59]) parts.wheel([s * .24, -.075, z], .069, .047, rubber)
  }
  const stretcher = parts.finish()
  root.add(stretcher)
  return { root, ...vehicle, crew, stretcher }
}

export function disposeRescueRig(root: T.Group) {
  const materials = new Set<T.Material>()
  root.traverse((obj) => {
    if (obj instanceof T.Mesh) {
      obj.geometry.dispose()
      materials.add(obj.material as T.Material)
    }
  })
  materials.forEach((material) => material.dispose())
}
