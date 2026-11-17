import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  RadialGradient,
} from 'react-native-svg'
import { useId } from 'react'

/** A classic Ludo pawn, drawn as a solid so it reads at small sizes. */
export function Pawn({ size = 28, color = '#e63946', dark = '#a3121f' }: { size?: number; color?: string; dark?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size * 1.25} viewBox="0 0 40 50">
      <Defs>
        <SvgLinearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <Stop offset="0.45" stopColor={color} />
          <Stop offset="1" stopColor={dark} />
        </SvgLinearGradient>
      </Defs>
      {/* base */}
      <Ellipse cx="20" cy="44" rx="17" ry="5.5" fill={dark} />
      <Path d="M6 44c0-6 6-8 14-8s14 2 14 8z" fill={`url(#p${id})`} />
      {/* body */}
      <Path d="M12 37c-1-7 3-10 8-13 5 3 9 6 8 13z" fill={`url(#p${id})`} />
      {/* head */}
      <Circle cx="20" cy="15" r="10" fill={`url(#p${id})`} />
      <Circle cx="16.5" cy="11.5" r="3.2" fill="#ffffff" opacity="0.5" />
    </Svg>
  )
}

/** Gold coin with a rim and a highlight. */
export function Coin({ size = 24 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <RadialGradient id={`c${id}`} cx="38%" cy="32%" r="72%">
          <Stop offset="0" stopColor="#fff3b0" />
          <Stop offset="0.55" stopColor="#ffc62e" />
          <Stop offset="1" stopColor="#d98500" />
        </RadialGradient>
      </Defs>
      <Circle cx="20" cy="20" r="19" fill="#8a4b00" />
      <Circle cx="20" cy="20" r="17" fill={`url(#c${id})`} />
      <Circle cx="20" cy="20" r="12" fill="none" stroke="#e09000" strokeWidth="2" opacity="0.65" />
      <Path d="M20 11l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.2 6-.8z" fill="#fff6c9" opacity="0.92" />
    </Svg>
  )
}

/** Cyan gem for the premium currency. */
export function Gem({ size = 24 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <SvgLinearGradient id={`g${id}`} x1="0" y1="0" x2="0.6" y2="1">
          <Stop offset="0" stopColor="#b9f4ff" />
          <Stop offset="0.5" stopColor="#3fd0ff" />
          <Stop offset="1" stopColor="#0a7fd4" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M10 6h20l8 10-18 20L2 16z" fill={`url(#g${id})`} stroke="#0a5a96" strokeWidth="1.5" strokeLinejoin="round" />
      <Path d="M10 6l5 10h10l5-10M2 16h36M15 16l5 20M25 16l-5 20" stroke="#ffffff" strokeWidth="1.1" opacity="0.5" fill="none" />
    </Svg>
  )
}

/** A single die face, used in the hero and the minigame tiles. */
export function Die({ size = 30, pips = 5, rotate = 0 }: { size?: number; pips?: number; rotate?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const layout: Record<number, Array<[number, number]>> = {
    1: [[20, 20]],
    2: [
      [12, 12],
      [28, 28],
    ],
    3: [
      [12, 12],
      [20, 20],
      [28, 28],
    ],
    4: [
      [12, 12],
      [28, 12],
      [12, 28],
      [28, 28],
    ],
    5: [
      [12, 12],
      [28, 12],
      [20, 20],
      [12, 28],
      [28, 28],
    ],
    6: [
      [12, 11],
      [28, 11],
      [12, 20],
      [28, 20],
      [12, 29],
      [28, 29],
    ],
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: [{ rotate: `${rotate}deg` }] }}>
      <Defs>
        <SvgLinearGradient id={`d${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#d8e2f0" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="2" y="2" width="36" height="36" rx="9" fill="#9aa8bd" />
      <Rect x="2" y="1" width="36" height="36" rx="9" fill={`url(#d${id})`} />
      {(layout[pips] ?? layout[5]).map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r="3.6" fill="#16233f" />
      ))}
    </Svg>
  )
}

/** Four pawns around a globe — the Online mode emblem. */
export function GlobeEmblem({ size = 44 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <RadialGradient id={`gl${id}`} cx="35%" cy="30%" r="75%">
          <Stop offset="0" stopColor="#7ef0a0" />
          <Stop offset="0.6" stopColor="#2bb24c" />
          <Stop offset="1" stopColor="#0d6b2a" />
        </RadialGradient>
      </Defs>
      <Circle cx="24" cy="24" r="18" fill="#1f7fd6" stroke="#0b4d8f" strokeWidth="2" />
      <Path
        d="M14 16c4-2 7 1 10 0s6-3 9-1c-2 5-1 8 1 11-4 1-6 4-9 6s-7 1-10-2c1-4 0-8-1-14z"
        fill={`url(#gl${id})`}
      />
      <Circle cx="24" cy="24" r="18" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
      <Path d="M6 24h36M24 6c5 6 5 30 0 36M24 6c-5 6-5 30 0 36" stroke="#cfe9ff" strokeWidth="0.9" opacity="0.5" fill="none" />
    </Svg>
  )
}

/** Crossed swords for the Team Up mode. */
export function SwordsEmblem({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <G>
        <Path d="M10 8l6 1 20 24-5 5L11 14z" fill="#dfe7f3" stroke="#8d9bb3" strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M38 8l-6 1L12 33l5 5 21-24z" fill="#eef3fb" stroke="#8d9bb3" strokeWidth="1.5" strokeLinejoin="round" />
        <Rect x="6" y="32" width="12" height="4.5" rx="2" fill="#ffc62e" stroke="#c67100" strokeWidth="1.2" transform="rotate(-45 12 34)" />
        <Rect x="30" y="32" width="12" height="4.5" rx="2" fill="#ffc62e" stroke="#c67100" strokeWidth="1.2" transform="rotate(45 36 34)" />
      </G>
    </Svg>
  )
}

/** Overlapping hearts for the Friends mode. */
export function HeartsEmblem({ size = 44 }: { size?: number }) {
  const heart = 'M24 42C10 32 4 25 4 17.5 4 11.7 8.7 7 14.5 7 18.3 7 21.6 9 24 12c2.4-3 5.7-5 9.5-5C39.3 7 44 11.7 44 17.5 44 25 38 32 24 42z'
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path d={heart} fill="#b3121f" transform="translate(-5 -3) scale(0.78)" />
      <Path d={heart} fill="#ff4d6d" transform="translate(6 2) scale(0.74)" stroke="#a3121f" strokeWidth="1.4" />
      <Path d={heart} fill="#e63946" transform="translate(-1 0) scale(0.86)" stroke="#a3121f" strokeWidth="1.4" />
    </Svg>
  )
}

/** Phone with a VS flash — the single-player mode. */
export function VsEmblem({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="13" y="5" width="22" height="38" rx="5" fill="#132f63" stroke="#ffc62e" strokeWidth="2.5" />
      <Rect x="16" y="10" width="16" height="28" rx="3" fill="#2566c4" />
      <Path d="M18 16l3 10 3-10M26 16h4l-4 5h4" stroke="#ffe587" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="24" cy="41" r="1.4" fill="#ffc62e" />
    </Svg>
  )
}

/** Two seated players — the pass-and-play mode. */
export function PassPlayEmblem({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="12" cy="14" r="6" fill="#ffd9a0" />
      <Path d="M3 40c0-8 4-13 9-13s9 5 9 13z" fill="#3fd0ff" stroke="#0a7fd4" strokeWidth="1.4" />
      <Circle cx="36" cy="14" r="6" fill="#ffd9a0" />
      <Path d="M27 40c0-8 4-13 9-13s9 5 9 13z" fill="#ff8a5c" stroke="#c4471c" strokeWidth="1.4" />
      <Rect x="19" y="24" width="11" height="11" rx="2" fill="#ffffff" stroke="#9aa8bd" strokeWidth="1.4" transform="rotate(45 24 29)" />
    </Svg>
  )
}

/** Tournament trophy. */
export function TrophyEmblem({ size = 40 }: { size?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <SvgLinearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#ffe587" />
          <Stop offset="0.5" stopColor="#ffc62e" />
          <Stop offset="1" stopColor="#d98500" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M13 7h22v12c0 7-5 12-11 12S13 26 13 19z" fill={`url(#t${id})`} stroke="#8a4b00" strokeWidth="1.6" />
      <Path d="M13 10H8c0 7 2 10 6 11M35 10h5c0 7-2 10-6 11" stroke="#8a4b00" strokeWidth="2.4" fill="none" />
      <Rect x="20" y="31" width="8" height="6" fill={`url(#t${id})`} stroke="#8a4b00" strokeWidth="1.4" />
      <Rect x="14" y="37" width="20" height="5" rx="2" fill={`url(#t${id})`} stroke="#8a4b00" strokeWidth="1.4" />
      <Path d="M24 12l1.8 3.8 4.2.6-3 2.9.7 4.1-3.7-2-3.7 2 .7-4.1-3-2.9 4.2-.6z" fill="#fff6c9" />
    </Svg>
  )
}

/** Prize wheel for the daily spin. */
export function SpinEmblem({ size = 46 }: { size?: number }) {
  const slices = ['#e63946', '#ffc62e', '#2bb24c', '#3fd0ff', '#8b5cf6', '#ff8a5c']
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="21" fill="#ffc62e" stroke="#8a4b00" strokeWidth="2" />
      {slices.map((c, i) => {
        const a0 = (i / slices.length) * Math.PI * 2 - Math.PI / 2
        const a1 = ((i + 1) / slices.length) * Math.PI * 2 - Math.PI / 2
        const r = 17
        const x0 = 24 + Math.cos(a0) * r
        const y0 = 24 + Math.sin(a0) * r
        const x1 = 24 + Math.cos(a1) * r
        const y1 = 24 + Math.sin(a1) * r
        return <Path key={i} d={`M24 24L${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}Z`} fill={c} />
      })}
      <Circle cx="24" cy="24" r="4.5" fill="#fff6c9" stroke="#8a4b00" strokeWidth="1.6" />
      <Path d="M24 1l3 6h-6z" fill="#e63946" stroke="#8a4b00" strokeWidth="1.2" />
    </Svg>
  )
}

/** Small isometric board used as the hero mark. */
export function BoardEmblem({ size = 120 }: { size?: number }) {
  const quad = (x: number, y: number, c: string) => (
    <G>
      <Rect x={x} y={y} width="26" height="26" rx="3" fill={c} stroke="#0f3471" strokeWidth="1.5" />
      <Rect x={x + 6} y={y + 6} width="14" height="14" rx="2" fill="#ffffff" opacity="0.92" />
    </G>
  )
  return (
    <Svg width={size} height={size} viewBox="0 0 68 68">
      <Rect x="1" y="1" width="66" height="66" rx="6" fill="#ffffff" stroke="#0f3471" strokeWidth="2.5" />
      {quad(4, 4, '#e63946')}
      {quad(38, 4, '#2bb24c')}
      {quad(4, 38, '#3fd0ff')}
      {quad(38, 38, '#ffc62e')}
      <Rect x="30" y="4" width="8" height="26" fill="#2bb24c" opacity="0.5" />
      <Rect x="30" y="38" width="8" height="26" fill="#ffc62e" opacity="0.5" />
      <Rect x="4" y="30" width="26" height="8" fill="#e63946" opacity="0.5" />
      <Rect x="38" y="30" width="26" height="8" fill="#3fd0ff" opacity="0.5" />
      <Path d="M30 30h8v8h-8z" fill="#ffc62e" stroke="#0f3471" strokeWidth="1.2" />
      <Path d="M34 28l2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z" fill="#ffd84d" stroke="#0f3471" strokeWidth="0.8" />
    </Svg>
  )
}
