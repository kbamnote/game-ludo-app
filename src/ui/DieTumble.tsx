import { useId } from 'react'
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, Stop } from 'react-native-svg'

export const DIE_PIPS: readonly number[][] = [
  [], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8],
]

type Point3 = readonly [number, number, number]
type Face = { normal: Point3; right: Point3; down: Point3 }

const FACES: readonly Face[] = [
  { normal: [0, 0, 1], right: [1, 0, 0], down: [0, 1, 0] },
  { normal: [0, 0, -1], right: [-1, 0, 0], down: [0, 1, 0] },
  { normal: [1, 0, 0], right: [0, 0, -1], down: [0, 1, 0] },
  { normal: [-1, 0, 0], right: [0, 0, 1], down: [0, 1, 0] },
  { normal: [0, -1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  { normal: [0, 1, 0], right: [1, 0, 0], down: [0, 0, -1] },
]
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
const CAMERA_Z = 5
const CENTER_X = 56
const DOCK_Y = 87

export default function DieTumble({ progress, value, color, pipColor, tableSize, direction = 1 }: {
  progress: number; value: number; color: string; pipColor: string; tableSize?: number; direction?: 1 | -1
}) {
  const polishId = 'dice-polish-' + useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const turn = progress * progress * (3 - 2 * progress)
  const pitch = Math.PI * 2 * (turn + (tableSize ? .18 * Math.sin(Math.PI * progress) : 0)) + (tableSize ? -.34 : 0)
  const yaw = (-Math.PI * 2 * turn + (tableSize ? .37 : 0)) * direction
  const bank = (.40 * Math.sin(Math.PI * 2 * (tableSize ? progress : turn)) + (tableSize ? .08 : 0)) * direction
  const cx = Math.cos(pitch), sx = Math.sin(pitch)
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cz = Math.cos(bank), sz = Math.sin(bank)
  const lift = (tableSize ? 27 : 23) * Math.sin(Math.PI * (tableSize ? progress : turn))
  const centerY = tableSize ? 75 : DOCK_Y
  const pairs = [1, 2, 3].filter(face => face !== value && 7 - face !== value)
  const values = [value, 7 - value, pairs[0], 7 - pairs[0], pairs[1], 7 - pairs[1]]

  function rotate([x, y, z]: Point3): Point3 {
    const py = y * cx - z * sx
    const pz = y * sx + z * cx
    const px = x * cy + pz * sy
    return [px * cz - py * sz, px * sz + py * cz, pz * cy - x * sy]
  }

  const visibleFaces = FACES.map((face, index) => {
    const normal = rotate(face.normal)
    return { face, index, normal, depth: normal[2] }
  })
    .filter(({ depth }) => depth * CAMERA_Z > 1)
    .sort((a, b) => a.depth - b.depth)

  return <Svg width={tableSize ?? 112} height={tableSize ? tableSize * 1.08 : 132} viewBox={tableSize ? '0 0 112 121' : '0 0 112 132'}>
    {tableSize && <Defs><LinearGradient id={polishId} x1="8%" y1="2%" x2="85%" y2="100%">
      <Stop offset="0" stopColor="#fff7e3" stopOpacity=".64" />
      <Stop offset=".38" stopColor="#fff7e3" stopOpacity=".08" />
      <Stop offset=".65" stopColor="#021430" stopOpacity=".05" />
      <Stop offset="1" stopColor="#021430" stopOpacity=".4" />
    </LinearGradient></Defs>}
    <Ellipse cx={CENTER_X} cy={tableSize ? 112 : DOCK_Y + 23} rx={(tableSize ? 30 : 19) - lift * .3}
      ry={tableSize ? 6 : 4} fill="#030a22" opacity={.36 - lift * .007} />
    {visibleFaces.map(({ face, index, normal: [nx, ny, nz], depth }) => {
      const [rx, ry, rz] = rotate(face.right)
      const [dx, dy, dz] = rotate(face.down)
      const project = (u: number, v: number) => {
        const x = nx + u * rx + v * dx
        const y = ny + u * ry + v * dy
        const z = nz + u * rz + v * dz
        const scale = (tableSize ? 135 : 100) / (CAMERA_Z - z)
        return [CENTER_X + x * scale, centerY - lift + y * scale]
      }

      const points = CORNERS.map(([x, y]) => project(x, y).join(',')).join(' ')
      const inset = tableSize ? CORNERS.map(([x, y], corner) => {
        const [px, py] = CORNERS[(corner + 3) % 4]
        const [nx, ny] = CORNERS[(corner + 1) % 4]
        const start = project(x * .83 + px * .08, y * .83 + py * .08).join(' ')
        const control = project(x * .91, y * .91).join(' ')
        const end = project(x * .83 + nx * .08, y * .83 + ny * .08).join(' ')
        return `${corner === 0 ? 'M' : 'L'}${start} Q${control} ${end}`
      }).join(' ') + ' Z' : null
      return <G key={index}>
        {inset ? <>
          <Polygon points={points} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Polygon points={points} fill={index === 4 ? '#fff3d2' : '#061630'} fillOpacity={index === 4 ? .27 : .28 + (1 - depth) * .27} />
          <Path d={inset} fill={color} />
          <Path d={inset} fill={`url(#${polishId})`} opacity={.58 + depth * .42}
            stroke="#fff7e0" strokeOpacity={.42} strokeWidth={.7} />
          <Path d={inset} fill="#061630" fillOpacity={index === 4 ? 0 : (1 - depth) * .37} />
        </> : <>
          <Polygon points={points} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Polygon points={points} fill="#110a28" fillOpacity={.08 + (1 - depth) * .45}
            stroke="#ffffff" strokeOpacity={.38} strokeWidth={1} strokeLinejoin="round" />
        </>}
        {DIE_PIPS[values[index]].map(pip => {
          const u = (pip % 3 - 1) * .52
          const v = (Math.floor(pip / 3) - 1) * .52
          const [x, y] = project(u, v)
          const [rx, ry] = project(u + .14, v)
          const [dx, dy] = project(u, v + .14)
          // The two projected axes keep each pip flat against its cube face.
          return <Circle key={pip} cx={0} cy={0} r={1} fill={pipColor}
            transform={`matrix(${rx - x} ${ry - y} ${dx - x} ${dy - y} ${x} ${y})`} />
        })}
      </G>
    })}
  </Svg>
}
