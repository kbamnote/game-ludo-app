import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')
mkdirSync(OUT, { recursive: true })

const C = {
  bgTop: '#2566c4',
  bgMid: '#1649a0',
  bgBot: '#0b2558',
  gold: '#ffc62e',
  goldLite: '#ffe587',
  goldDeep: '#c67100',
  navy: '#0f3471',
  red: '#e63946',
  green: '#2bb24c',
  cyan: '#3fd0ff',
  yellow: '#ffc62e',
  white: '#ffffff',
}

/**
 * The Ludo board mark: a gold-rimmed white board with four jewel-tone
 * quadrants, cross arms and a gold centre star. Drawn in a 0..100 box so it
 * can be scaled into any canvas.
 */
function boardMark({ withDie = true } = {}) {
  const quad = (x, y, color) => `
    <rect x="${x}" y="${y}" width="34" height="34" rx="5" fill="${color}"/>
    <rect x="${x + 8}" y="${y + 8}" width="18" height="18" rx="3.5" fill="${C.white}"/>`

  return `
  <g>
    <!-- board body -->
    <rect x="1.5" y="1.5" width="97" height="97" rx="11" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/>

    <!-- quadrants -->
    ${quad(5, 5, C.red)}
    ${quad(61, 5, C.green)}
    ${quad(5, 61, C.cyan)}
    ${quad(61, 61, C.yellow)}

    <!-- cross arms -->
    <rect x="42" y="5" width="16" height="37" fill="${C.green}" opacity="0.35"/>
    <rect x="42" y="58" width="16" height="37" fill="${C.yellow}" opacity="0.35"/>
    <rect x="5" y="42" width="37" height="16" fill="${C.red}" opacity="0.35"/>
    <rect x="58" y="42" width="37" height="16" fill="${C.cyan}" opacity="0.35"/>

    <!-- grid lines so it reads as a board, not four blocks -->
    <g stroke="${C.navy}" stroke-width="1.1" opacity="0.35">
      <path d="M42 5v90M58 5v90M5 42h90M5 58h90"/>
    </g>

    <!-- centre home -->
    <rect x="42" y="42" width="16" height="16" fill="${C.navy}"/>
    <path d="M50 43.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
          fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="0.8" stroke-linejoin="round"/>

    ${
      withDie
        ? `<!-- Die resting against the bottom-right corner. It overhangs the
             board rather than sitting on it, so all four quadrant colours
             still read. -->
    <g transform="translate(74 74) rotate(-12)">
      <rect x="0" y="0" width="30" height="30" rx="7" fill="${C.navy}" opacity="0.3" transform="translate(2 3)"/>
      <rect x="0" y="0" width="30" height="30" rx="7" fill="#fdfbf4" stroke="${C.navy}" stroke-width="2.2"/>
      <circle cx="8" cy="8" r="2.9" fill="#16233f"/>
      <circle cx="22" cy="8" r="2.9" fill="#16233f"/>
      <circle cx="15" cy="15" r="2.9" fill="#16233f"/>
      <circle cx="8" cy="22" r="2.9" fill="#16233f"/>
      <circle cx="22" cy="22" r="2.9" fill="#16233f"/>
    </g>`
        : ''
    }
  </g>`
}

function backdrop(size, rounded) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0.25" y2="1">
        <stop offset="0" stop-color="${C.bgTop}"/>
        <stop offset="0.5" stop-color="${C.bgMid}"/>
        <stop offset="1" stop-color="${C.bgBot}"/>
      </linearGradient>
      <radialGradient id="vig" cx="50%" cy="38%" r="72%">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
        <stop offset="1" stop-color="#000814" stop-opacity="0.35"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" ${rounded ? `rx="${size * 0.22}"` : ''} fill="url(#bg)"/>
    <rect width="${size}" height="${size}" ${rounded ? `rx="${size * 0.22}"` : ''} fill="url(#vig)"/>`
}

/** Faint board-print texture, same motif as the lobby backdrop. */
function texture(size) {
  const step = size / 7
  let dots = ''
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 7; y++) {
      dots += `<circle cx="${x * step + step * 0.3}" cy="${y * step + step * 0.3}" r="${size * 0.012}" fill="#ffffff" opacity="0.05"/>`
    }
  }
  return dots
}

/**
 * `scale` is the fraction of the canvas the mark occupies. Android masks
 * adaptive icons hard, so the foreground keeps everything inside the middle
 * ~66% safe zone.
 */
function compose({ size, scale, withBackground, rounded = false, withDie = true, tex = true }) {
  const markSize = size * scale
  const offset = (size - markSize) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${withBackground ? backdrop(size, rounded) : ''}
    ${withBackground && tex ? texture(size) : ''}
    <g transform="translate(${offset} ${offset}) scale(${markSize / 100})">
      ${boardMark({ withDie })}
    </g>
  </svg>`
}

/**
 * Themed-icon layer. Android tints this a single colour and keeps only the
 * alpha, so the mark has to read from shape alone — any design relying on
 * light-against-dark disappears. Everything here is one opaque white on
 * transparent, and the board reads from the gaps between the parts.
 */
function monochrome(size) {
  const m = size * 0.56
  const o = (size - m) / 2
  const yard = (x, y) => `<rect x="${x}" y="${y}" width="30" height="30" rx="6" fill="#ffffff"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${o} ${o}) scale(${m / 100})">
      <rect x="2" y="2" width="96" height="96" rx="13" fill="none" stroke="#ffffff" stroke-width="6"/>
      ${yard(11, 11)}
      ${yard(59, 11)}
      ${yard(11, 59)}
      ${yard(59, 59)}
      <path d="M50 33l5.2 10.6 11.7 1.7-8.5 8.2 2 11.6L50 59.6 39.6 65.1l2-11.6-8.5-8.2 11.7-1.7z" fill="#ffffff"/>
    </g>
  </svg>`
}

const jobs = [
  // Main app icon — full bleed, iOS rounds it itself.
  { name: "icon.png", svg: compose({ size: 1024, scale: 0.66, withBackground: true }) },
  // Android adaptive: background and foreground are separate layers.
  { name: 'android-icon-background.png', svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${backdrop(1024, false)}${texture(1024)}</svg>` },
    // Board only, and small enough that a circular launcher mask (which keeps
  // just the inner ~33% radius) cannot clip it. The die stays in icon.png,
  // where the mask is a rounded square.
  { name: 'android-icon-foreground.png', svg: compose({ size: 1024, scale: 0.46, withBackground: false, withDie: false }) },
  { name: 'android-icon-monochrome.png', svg: monochrome(1024) },
  // Splash mark sits on the app's own background colour.
  { name: 'splash-icon.png', svg: compose({ size: 1024, scale: 0.68, withBackground: false }) },
  { name: 'favicon.png', svg: compose({ size: 196, scale: 0.74, withBackground: true, rounded: true, withDie: false, tex: false }) },
]

const results = []
for (const job of jobs) {
  const buf = await sharp(Buffer.from(job.svg)).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(join(OUT, job.name), buf)
  const meta = await sharp(buf).metadata()
  results.push(`${job.name.padEnd(30)} ${meta.width}x${meta.height}  ${(buf.length / 1024).toFixed(1)} KB`)
}

// A contact sheet so the set can be eyeballed at a glance.
const sheet = await sharp({
  create: { width: 1180, height: 320, channels: 4, background: { r: 24, g: 30, b: 48, alpha: 1 } },
})
  .composite(
    await Promise.all(
      jobs.map(async (job, i) => ({
        input: await sharp(join(OUT, job.name)).resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(),
        left: 20 + (i % 4) * 290,
        top: i < 4 ? 20 : 20,
      })),
    ),
  )
  .png()
  .toBuffer()
writeFileSync(join(OUT, '_sheet.png'), sheet)

console.log(results.join('\n'))
