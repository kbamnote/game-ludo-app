import Svg, { Circle, Ellipse, G, Polygon } from 'react-native-svg'

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

export default function DieTumble({ progress, value, color, pipColor }: {
  progress: number; value: number; color: string; pipColor: string
}) {
  const turn = progress * progress * (3 - 2 * progress)
  const pitch = Math.PI * 2 * (turn + .18 * Math.sin(Math.PI * progress))
  const yaw = -Math.PI * 2 * turn
  const bank = .40 * Math.sin(Math.PI * 2 * progress)
  const cx = Math.cos(pitch), sx = Math.sin(pitch)
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cz = Math.cos(bank), sz = Math.sin(bank)
  const lift = 23 * Math.sin(Math.PI * progress)
  const pairs = [1, 2, 3].filter(face => face !== value && 7 - face !== value)
  const values = [value, 7 - value, pairs[0], 7 - pairs[0], pairs[1], 7 - pairs[1]]

  function rotate([x, y, z]: Point3): Point3 {
    const py = y * cx - z * sx
    const pz = y * sx + z * cx
    const px = x * cy + pz * sy
    return [px * cz - py * sz, px * sz + py * cz, pz * cy - x * sy]
  }

  const visibleFaces = FACES.map((face, index) => ({ face, index, depth: rotate(face.normal)[2] }))
    .filter(({ depth }) => depth * CAMERA_Z > 1)
    .sort((a, b) => a.depth - b.depth)

  return <Svg width={112} height={132} viewBox="0 0 112 132">
    <Ellipse cx={CENTER_X} cy={DOCK_Y + 23} rx={19 - lift * .3} ry={4} fill="#030a22" opacity={.36 - lift * .007} />
    {visibleFaces.map(({ face, index, depth }) => {
      const project = (u: number, v: number) => {
        const [x, y, z] = rotate([
          face.normal[0] + u * face.right[0] + v * face.down[0],
          face.normal[1] + u * face.right[1] + v * face.down[1],
          face.normal[2] + u * face.right[2] + v * face.down[2],
        ])
        const scale = 100 / (CAMERA_Z - z)
        return [CENTER_X + x * scale, DOCK_Y - lift + y * scale]
      }

      const points = CORNERS.map(([x, y]) => project(x, y).join(',')).join(' ')
      return <G key={index}>
        <Polygon points={points} fill={color} />
        <Polygon points={points} fill="#110a28" fillOpacity={(1 - depth) * .45}
          stroke="#ffffff" strokeOpacity={.28} strokeWidth={1} strokeLinejoin="round" />
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
