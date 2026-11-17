# CGP - Cockroach Game Party 3D — Expo app

The React Native build of the game, ported from `../frontend-ludo`. Same Ludo
engine, same 3D board, dice and rigged characters — rendered through `expo-gl`
instead of a browser canvas, with every screen re-authored as native views.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone. `expo-gl` is bundled in Expo
Go, so no custom development build is needed to see the 3D board.

```bash
npm run typecheck    # tsc --noEmit
npm run doctor       # expo-doctor
```

## Stack

| Piece | Choice |
|---|---|
| Runtime | Expo SDK 58, React Native 0.88, React 19.3 |
| Navigation | Expo Router (file routes in `src/app/`) |
| 3D | three.js 0.187 + @react-three/fiber/native + @react-three/drei/native on expo-gl |
| State | Zustand; profile persisted via AsyncStorage |
| Type | Outfit / Plus Jakarta Sans / Rubik through @expo-google-fonts |
| Vector art | react-native-svg, expo-linear-gradient |

## Layout

```
src/
  app/           Expo Router routes — one file per screen
  game/          rules.ts, ai.ts, store.ts, profile.ts
  three/         Board3D, Dice3D, Pawn3D, MatchScene, layout.ts
  screens/       Screen components
  ui/            AppHeader, BottomNav, Bevel, Glow, Icon
  theme.ts       Design tokens
assets/models/   character.glb
```

## Porting notes

**The game core is untouched.** `rules.ts`, `ai.ts` and `store.ts` are byte-for-byte
the same files as the web build — they are pure TypeScript with no DOM or
browser dependency. `profile.ts` differs only in its persistence adapter
(AsyncStorage instead of localStorage).

**Styling is plain `StyleSheet`, not NativeWind.** Every Stitch token lives in
`src/theme.ts` (`C` colours, `F` fonts, `T`/`TA` type scales, `S` spacing,
`R` radii). This avoids staking the design on a Tailwind-to-RN translation
layer that could not be visually verified during the port.

**Effects that have no React Native equivalent** were rebuilt rather than dropped:

| Web | Native |
|---|---|
| `blur-3xl` colour blobs | `Glow` — an SVG radial gradient fading to transparent |
| `box-shadow: 0 5px 0` bevel ledge | `Bevel` — a real view behind the face; pressing shifts the face onto it |
| CSS gradients | `expo-linear-gradient` |
| Material Symbols | `@expo/vector-icons`, with a few names remapped in `ui/Icon.tsx` |
| `document.body.style.cursor` | removed — no pointer on a touch device |

**Mobile 3D budget.** Sixteen skinned rigs are expensive, so tokens no longer
cast shadow-map shadows (the contact discs read better anyway and cost nothing),
the shadow map is 1024 rather than 2048, and geometry segment counts are lower.
The web `dpr` prop does not exist on the native canvas — expo-gl sizes its own
drawing buffer.

**Reanimated was removed.** The screens use React Native's own `Animated` API,
so Reanimated 4 and its worklets Babel plugin were a failure mode with no
benefit.

**`Bevel` stretches by default.** All of its children are absolutely positioned,
so the component has no intrinsic width. Under a parent that centres its cross
axis (`alignItems: 'center'`) it collapsed to 0px — invisible and untappable,
which is what stranded the splash screen on its first device run.

**The splash adapts to screen height.** Its emblem shrinks between 288 and 176px
and the content sits in a `ScrollView` with `flexGrow: 1`, so the Enter Arena
button can never fall below the fold on a short phone.

**`metro.config.js` registers `glb`/`gltf` as asset extensions** so
`require('../../assets/models/character.glb')` resolves. The model is confirmed
in the production bundle at its exact source size (2,695,272 bytes).

**`metro.config.js` also pins the bare `three` specifier to the ES module
build.** three 0.187 is ESM-only, but its `main` field still points at
`build/three.cjs` — a deprecation shim whose first statement calls
`process.emitWarning(...)`, a Node API Hermes does not have. Since
`@react-three/fiber/native` and `drei/native` ship CommonJS builds that
`require('three')`, importing the match screen crashed on device with
`TypeError: undefined is not a function` before this pin was added.

The pin has a second benefit: `three/examples/jsm/*` (SkeletonUtils) imports the
ESM build, so without it the app would load two copies of three and `instanceof`
checks across them — skinned-mesh clones, material types — would silently fail.

## Verification status

Verified here:

- `tsc --noEmit` passes
- `expo-doctor` — 20/20 checks pass
- `expo export --platform android` produces a complete Hermes bundle (9.9 MB)
  with the character model included
- Expo Router resolves `src/app` as the route root
- Source maps from the production bundle confirm it contains
  `three/build/three.module.js` and `three/build/three.core.js`, and **not**
  `three/build/three.cjs` — the file that crashed the first device run

A web preview is also useful for checking layout without a device, since
react-native-web renders the same component tree:

```bash
npm run web      # then open http://localhost:8081
```

Splash, Home and the full 3D Match Arena all render through it. Give Metro a
minute on the first run — it is slow to start on Windows.

**Not verified here:** on-device rendering and the 3D frame rate. This machine
has no Java, Android SDK or emulator, so no native build or device run was
possible. The first device run is the real test of `expo-gl` under the New
Architecture, which the SDK 58 docs do not comment on. If the board fails to
appear, set `"newArchEnabled": false` in `app.json` and restart — that is the
single most likely fix.

## Screens

Ported: **Splash**, **Home**, **Live 3D Match Arena**.
The other 12 Stitch designs are routed stubs, matching the web build.

## The Splash screen

Deliberately minimal: backdrop, brand lockup, a gold loading bar with a
travelling shine, and the build number. No buttons — it fills the bar over
`LOAD_MS` (2.4s) and calls `router.replace('/home')` by itself.

`ui/Backdrop.tsx` and `ui/BrandLockup.tsx` are shared with Home, so the crown,
wordmark, board, pawns and die are defined once. `BrandLockup` takes a `scale`
driven by viewport height and an `animated` flag for the splash's gentle bob.

`_layout.tsx` gates render on the fonts loading, but with a 3s timeout. Without
it a slow or stalled font fetch leaves the player on a blank screen with no way
out — which happened during development when the dev server hiccuped mid-fetch.

## The Home lobby

Home does not follow the Midnight Diorama design system — it is a chunky
gold-on-blue arcade lobby in the style of mainstream Ludo apps, built to a
reference the project owner supplied.

Its branding, icon art and copy are original: the wordmark is "Ludo After
Dark", and every emblem in `ui/ArcadeIcons.tsx` (pawn, coin, gem, die, globe,
swords, hearts, phone, players, trophy, spin wheel, board) is hand-drawn
`react-native-svg`. No third-party game's logo, character art or assets are
reproduced.

**Type:** Luckiest Guy for display, Baloo 2 for numerals and labels.

**`OutlineText`** gives the hard-outlined arcade lettering. React Native has no
text stroke and `textShadow` draws only one shadow, so it renders eight offset
copies behind a solid fill.

**`GoldPanel`** is the building block: a dark seat for depth, a gold rim
gradient, a thin inner line so the rim reads as metal, and a glossy blue face.

### Guaranteed not to scroll

This was an explicit requirement. Every block below the hero has a fixed
height and the hero is `flex: 1`, so it absorbs all variation — there is no
`ScrollView` on the screen at all. The brand lockup additionally scales with
viewport height (`lockup` factor) so a tall screen does not show a small logo
adrift in empty space.

Verified at 360x640, 390x844 and 430x932: `document.body.scrollHeight` equals
the viewport height exactly in all three, i.e. zero overflow.

## Online friend rooms

`src/net/` holds the multiplayer client; `../backend-ludo` is the server.

- `net/config.ts` — resolves the server URL from `EXPO_PUBLIC_SERVER_URL`, then
  `expo.extra.serverUrl` in app.json, then `http://localhost:8080`.
- `net/online.ts` — socket lifecycle, room state, and the bridge that drives the
  match store from server events.
- `game/identity.ts` — a persistent device id plus a nickname. No accounts.

The match store gained a `mode`. Locally it runs the rules itself as before;
online, `roll()` and `pickToken()` forward intents to the server and the board
only changes when the server says so. `applyServerMove` animates the path the
server sent, then adopts the snapshot that came with it, so the animation is
never contradicted mid-walk.

**A phone cannot reach your PC's `localhost`.** For device testing either deploy
the server (see `../backend-ludo/README.md`) or set `serverUrl` to your
machine's LAN address, e.g. `http://192.168.1.20:8080`. The Friends screen shows
the server it is pointing at.

### Verified

Two independent clients were driven through the whole flow against the real
server: create room, join by code, a wrong code rejected, live member sync,
ready-up, host-only start, both clients landing in the match, correct turn
ownership, a server-rolled six, the move appearing on both boards, and the
extra turn that a six grants. `backend-ludo` also has a headless test that
plays a complete two-player match over sockets (`npm test` there).
