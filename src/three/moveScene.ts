import type { MoveAnimation } from '../game/store'
import { coronationDuration, PODIUM_HEIGHT } from '../game/coronation'
import { cellFor, cellForProgress, YARD, type Token } from '../game/rules'
import { RESCUE_ARRIVAL_MS, RESCUE_HOME_MS, RESCUE_MS, STEP_MS } from '../game/moveTiming'
import { toWorld } from './layout'

export function ease(t: number, a: number, b: number) {
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return u * u * (3 - 2 * u)
}
const mix = (a: number, b: number, u: number) => a + (b - a) * u

export function coronationFrame(elapsed: number, place: 1 | 2) {
  const duration = coronationDuration(place)
  const exit = ease(elapsed, duration - 760, duration)
  return {
    march: ease(elapsed, 120, 3040),
    approach: ease(elapsed, 2170, 4160),
    crown: ease(elapsed, 4460, 5410),
    retreat: ease(elapsed, 5500, 6750),
    lift: PODIUM_HEIGHT * ease(elapsed, 5530, 6850) * (1 - exit),
    focus: ease(elapsed, 0, 850) * (1 - exit),
    portrait: ease(elapsed, 4100, 6550),
    throne: place === 1 ? ease(elapsed, 7060, 7570) * (1 - exit) : 0,
    sit: place === 1 ? ease(elapsed, 7390, 8140) * (1 - exit) : 0,
    exit,
  }
}

export function walkingPose(token: Token, move: MoveAnimation, elapsed: number) {
  const step = Math.min(move.path.length - 1, Math.max(0, Math.floor(elapsed / STEP_MS)))
  const progress = step === 0 ? token.progress : move.path[step - 1]
  const a = toWorld(cellForProgress(token.seat, progress, token.index))
  const b = toWorld(cellForProgress(token.seat, move.path[step], token.index))
  let yaw = Math.atan2(b[0] - a[0], b[1] - a[1])
  const walkEnd = move.path.length * STEP_MS
  // Leave room for the sword and stretcher until the fallen character is aboard.
  const gap = move.captures.length && step === move.path.length - 1
    ? .74 * (1 - ease(elapsed - walkEnd, 4200, 5000)) : 0
  const u = ease(elapsed, step * STEP_MS, (step + 1) * STEP_MS)
  let x = mix(a[0], b[0] - gap * Math.sin(yaw), u)
  let z = mix(a[1], b[1] - gap * Math.cos(yaw), u)
  const after = elapsed - walkEnd
  if (move.captures.length && after > 700) {
    const index = Math.min(move.captures.length - 1, Math.floor(after / RESCUE_MS))
    const t = after - index * RESCUE_MS
    const clear = ease(t, 700, 1400) * (1 - ease(t, 4200, 4900))
    const patient = clear > 0 && move.before.find(v => v.id === move.captures[index])
    if (patient) {
      const site = rescueSite(patient)
      const dx = -1.32 * Math.cos(site.yaw) - .85 * Math.sin(site.yaw)
      const dz = 1.32 * Math.sin(site.yaw) - .85 * Math.cos(site.yaw)
      x = mix(x, b[0] + dx, clear)
      z = mix(z, b[1] + dz, clear)
      const turn = Math.atan2(-dx, -dz) - yaw
      yaw += clear * Math.atan2(Math.sin(turn), Math.cos(turn))
    }
  }
  return { x, z, yaw }
}

export function rescueSite(victim: Token) {
  const [x, z] = toWorld(cellFor(victim))
  const [hx, hz] = toWorld(cellForProgress(victim.seat, YARD, victim.index))
  const yaw = Math.atan2(hx - x, hz - z)
  return { x, z, yaw, distance: Math.hypot(hx - x, hz - z) }
}

// Coordinates are in the rescue site's frame. The van faces +Z, toward its own yard.
export function rescuePose(t: number, distance: number) {
  const park = 2.18
  const arrive = ease(t, RESCUE_ARRIVAL_MS / 1000, 1.85)
  const depart = ease(t, 4.95, 6.12)
  const van = mix(mix(distance, park, arrive), distance, depart)
  const doors = ease(t, 1.55, 2.05) * (1 - ease(t, 4.57, 4.95))
  const emerge = ease(t, 1.88, 2.80)
  const load = ease(t, 3.65, 4.52)
  const lift = ease(t, 3.06, 3.65)
  const recover = ease(t, 6.02, RESCUE_HOME_MS / 1000)
  const stretcherZ = mix(mix(park, 0, emerge), park, load)
  const stretcherX = .40 * emerge * (1 - load)
  const stretcherY = .13 + .26 * lift
  return {
    van, vanX: .80 * (1 - arrive + depart), doors, emerge, lift, load, recover, stretcherZ, stretcherX, stretcherY,
    crewVisible: t >= 1.88 && t < 4.66,
    vanScale: ease(t, .38, .62) * (1 - ease(t, 6.05, RESCUE_HOME_MS / 1000)),
    patientX: stretcherX * lift,
    patientZ: t < 4.57 ? mix(0, .76, ease(t, .32, .77)) + stretcherZ * lift : distance - .60 * (1 - recover),
    patientY: (.14 * ease(t, .32, .77) + (stretcherY + .12 - .14) * lift) * (1 - recover),
    patientTilt: -Math.PI / 2 * ease(t, .32, .77) * (1 - recover),
    patientVisible: t < 4.49 || t >= 6.05,
  }
}

export function rescueTime(move: MoveAnimation, elapsed: number, index: number) {
  return (elapsed - move.path.length * STEP_MS - index * RESCUE_MS) / 1000
}
