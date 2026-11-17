// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// The character rig ships as a binary glTF; Metro must treat it as an asset so
// `require('../../assets/models/character.glb')` resolves to a loadable module.
config.resolver.assetExts.push('glb', 'gltf')

/**
 * three 0.187 is ESM-only. Its `main` field still points at `build/three.cjs`,
 * a deprecation shim whose first statement is `process.emitWarning(...)` —
 * a Node API that does not exist in Hermes, so merely importing it throws
 * "undefined is not a function" on device.
 *
 * @react-three/fiber/native and drei/native ship CommonJS builds that
 * `require('three')`, which lands on that shim. Pinning the bare `three`
 * specifier to the ES module build sidesteps it.
 *
 * This also keeps a single THREE instance: `three/examples/jsm/*` imports the
 * ESM build, so without this the app would load three twice and `instanceof`
 * checks across the two copies (SkeletonUtils clones, materials) would fail.
 */
// three's `exports` map does not expose ./build/*, so the ESM path is derived
// from the resolved CJS entry rather than resolved directly.
const threeEsm = require.resolve('three').replace(/three\.cjs$/, 'three.module.js')

if (!require('node:fs').existsSync(threeEsm)) {
  throw new Error(`Could not locate the three ES module build at ${threeEsm}`)
}

const defaultResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: threeEsm }
  }
  const resolve = defaultResolveRequest ?? context.resolveRequest
  return resolve(context, moduleName, platform)
}

module.exports = config
