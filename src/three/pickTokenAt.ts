import { Vector3, type Camera } from 'three'
import { cellFor, type Move, type Token } from '../game/rules'
import { DECK_Y, toWorld } from './layout'

// Measure in layout points so small pieces still have a finger-sized target
// after the board is rotated, zoomed out, or drawn on a high-density phone.
export function pickTokenAt(
  x: number, y: number, camera: Camera, size: { width: number; height: number },
  tokens: Token[], moves: Move[],
): string | null {
  let closestId: string | null = null
  let closestDistance = Infinity
  const foot = new Vector3(), head = new Vector3()
  for (const { tokenId } of moves) {
    const token = tokens.find(t => t.id === tokenId)
    if (!token) continue
    const [worldX, worldZ] = toWorld(cellFor(token))
    foot.set(worldX, DECK_Y + .07, worldZ).project(camera)
    head.set(worldX, DECK_Y + 1.62, worldZ).project(camera)
    const fx = (foot.x + 1) * size.width / 2, fy = (1 - foot.y) * size.height / 2
    const dx = (head.x - foot.x) * size.width / 2, dy = (foot.y - head.y) * size.height / 2
    const lengthSq = dx * dx + dy * dy
    const along = lengthSq ? Math.max(0, Math.min(1, ((x - fx) * dx + (y - fy) * dy) / lengthSq)) : 0
    const distance = Math.hypot(x - fx - along * dx, y - fy - along * dy)
    if (distance <= 22 && distance < closestDistance) {
      closestId = tokenId
      closestDistance = distance
    }
  }
  return closestId
}
