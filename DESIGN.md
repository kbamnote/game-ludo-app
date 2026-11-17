---
name: Ludo Midnight Diorama
source: Stitch project 7276487535578186149 "Ludo After Dark 3D"
canvas: 390 x 884 logical px (mobile-first)
---

# Ludo Midnight Diorama — Design System

## Brand & Style
Tactile, miniature diorama board game atmosphere set beneath an ambient late-night sky.
Casual / mid-core mobile gamers. Smooth molded toy physics + high-end mobile UI ergonomics.

**Tactile / Skeuomorphic** charm fused with casual-game **Glassmorphic** clarity:
- Thick, pill-shaped HUD containers mimicking glossy resin, frosted acrylic, injection-molded plastic.
- Deep physical button bevels with prominent underside drop-ledges that visually depress on tap.
- Vibrant jewel-tone emissive accents cutting through deep navy atmospheric shadows.
- Playful character-driven charm + strictly legible high-contrast operational typography.

## Colors

### Brand overrides (the real palette)
| Role | Hex | Use |
|---|---|---|
| Canvas / underlay neutral | `#0B0F19` | Midnight navy ambient night scene |
| Floating surface sheets | `#121826` | Cards, trays |
| Elevated board frames | `#1E2640` | Board chassis |
| Sapphire Blue (primary) | `#0075FF` | Brand, active player token |
| Electric neon highlight | `#38B6FF` | Primary glow |
| Ruby Red (secondary) | `#FF2E55` | High-energy player base, notification counts, aggressive actions |
| Topaz Amber (tertiary) | `#FFB300` | Coins, stars, level, victory |
| Warm orange depth | `#E65100` | Amber bevel underside |
| Emerald Green | `#00E676` | 4th quadrant, affirmative/confirm |
| Lime glow | `#B9F6CA` | Emerald highlight |
| Scrim / HUD chassis | `rgba(11,15,25,0.72)` | Lets board lighting bleed through |

### Material tonal set (from theme)
surface `#0f131d` · surface-dim `#0f131d` · surface-bright `#353944`
surface-container-lowest `#0a0e18` · -low `#171b26` · default `#1c1f2a` · -high `#262a35` · -highest `#313540`
on-surface `#dfe2f1` · on-surface-variant `#c1c6d7`
outline `#8b90a1` · outline-variant `#414755`
primary `#afc6ff` · on-primary `#002d6c` · primary-container `#518dff` · on-primary-container `#00275f`
secondary `#ffb3b5` · on-secondary `#680019` · secondary-container `#da003f` · on-secondary-container `#ffeceb`
tertiary `#ffba38` · on-tertiary `#432c00` · tertiary-container `#c08600` · on-tertiary-container `#3a2600`
error `#ffb4ab` · on-error `#690005` · error-container `#93000a` · on-error-container `#ffdad6`
inverse-surface `#dfe2f1` · inverse-on-surface `#2c303b` · inverse-primary `#0059c6` · surface-tint `#afc6ff`

## Typography
- **Headlines & values — `Outfit`**: geometric, wide, rounded. Numerical counters, coin tallies,
  banners, modal headers. ALL-CAPS with expanded letter-spacing for mini badges / subheaders.
- **Interactive body & badges — `Plus Jakarta Sans`**: soft approachable contours, readable at
  compact sizes — chat snippets, rules dialogs, balance amounts.
- **Numbers**: all currency and score values use tabular figures (`font-variant-numeric: tabular-nums`)
  to eliminate layout jitter during count-up animations.

| Token | Family | Size | Weight | Line | Tracking |
|---|---|---|---|---|---|
| headline-xl | Outfit | 40px | 800 | 48px | -0.02em |
| headline-lg | Outfit | 32px | 800 | 40px | -0.01em |
| headline-lg-mobile | Outfit | 26px | 800 | 32px | -0.01em |
| headline-md | Outfit | 22px | 700 | 28px | — |
| headline-sm | Outfit | 18px | 700 | 24px | — |
| body-lg | Plus Jakarta Sans | 16px | 600 | 22px | — |
| body-md | Plus Jakarta Sans | 14px | 500 | 20px | — |
| body-sm | Plus Jakarta Sans | 12px | 500 | 16px | — |
| label-lg | Outfit | 14px | 800 | 18px | 0.04em |
| label-md | Outfit | 12px | 700 | 16px | 0.03em |
| label-sm | Outfit | 10px | 700 | 14px | 0.05em |

## Layout & Spacing
Dedicated HUD frame overlaying an interactive, centered 3D canvas viewport.

- **Mobile (<600px)**: 3D board holds the center-weighted focal plane. Top HUD docks flush with OS
  safe areas (44px top inset) — currency capsules + profile chips. Bottom anchors turn controls,
  dice tray and tactile main action buttons inside the thumb zone.
- **Tablet / landscape**: HUD splits into bilateral wings — resource meters + live leaderboard left,
  dice trigger + emote tray right, board center unobstructed.
- **Rhythm**: dense 4px-aligned stacking so stats and avatars stay compact and pawns/dice stay visible.

Spacing tokens: gutter `0.75rem` (desktop `1.25rem`) · margin `1rem` (desktop `2rem`) ·
space-xs `0.25rem` · sm `0.5rem` · md `0.75rem` · lg `1rem` · xl `1.5rem`

## Elevation & Depth
Physical toy materiality, not flat drop shadows.

- **Clay & acrylic tiers**: base on midnight navy `#121826`. Secondary trays semi-translucent
  midnight glass `rgba(22,31,51,0.85)` framed by a 1px top-edge highlight `rgba(255,255,255,0.15)`
  reading as specular light.
- **Extruded 3D ledges**: interactive controls carry a 4–6px solid bottom bevel
  (e.g. `#0051B3` under `#0075FF`), shifting `translateY(4px)` on press like a spring-loaded switch.
- **Gem & token AO**: player bases and pawns cast soft tinted radial contact shadows
  (`rgba(0,0,0,0.45)`, blur 12px) plus an inner edge glow in the pawn's own hue.

## Shapes
Bulbous, organic, ultra-smooth.
- **Level 3 (pill)** is the default curvature: status bars, currency chips, dice zones, CTAs → `9999px`.
- **Cards & modals**: 24px (`rounded-lg`) to 32px (`rounded-xl`) radii — molded toy casing.
- **Board grid nodes**: circular and squircle tiles, soft rounded bevels catching ambient neon.

Radii: sm `0.5rem` · DEFAULT `1rem` · md `1.5rem` · lg `2rem` · xl `3rem` · full `9999px`

## Components

### 3D Beveled Buttons
Primary CTA: emerald or sapphire body, saturated bottom bevel offset 5px, glossy specular crescent
along the top rim, white bold centered type with a subtle text dropshadow.
Pressed: `translateY(4px)`, bevel collapses to 1px, top gloss dampens.

### Currency & Stat Pills
Compact horizontal pills, matte dark acrylic fill `#121826`, 1px translucent border, an oversized 3D
token icon (ruby gem / gold coin / XP star) protruding 6px past the left boundary. Value in Outfit
bold tabular numerals, crisp white, with a small neon-green "+" button on the right edge.

### Player Base & Avatar Cards
Mini portrait cards wrapped in the player's quadrant color glow. Rounded rectangular frames housing
3D humanoid pawn heads. Radial turn-timer countdown traces the border perimeter via animated SVG
stroke dashes.

### Dice Tray & Rolling Controller
Elevated circular tray bottom-right, deep inner rim shadows, glossy velvet interior. Glowing ivory
dice with rounded corners and high-contrast dark indigo pips, encircled by an ambient pulse ring on
the user's turn.

### Modals & Dialogs
Centered popup cards in chunky toy-plastic casings. Floating top header badge anchored over the
upper frame line. Action buttons stacked or side-by-side, always full pill.

## Screens (15 designs)
1. Splash Screen · 2. Home Screen · 3. Game Mode Selection · Ludo King Faithful Home Arena ·
Ludo Classic Arena Home · Live 3D Match Arena · Online Match Setup · Pass & Play Setup ·
Friends Private Room · Tournament Championship · Daily Spin Wheel · Daily Spin Wheel (Interactive) ·
Lucky 7 Minigame · Arcade Events & Season Pass · Live Voice Adda · Inventory & Customization
