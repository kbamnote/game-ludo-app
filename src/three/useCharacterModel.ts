import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const teamModels = [
  require('../../assets/models/Ruby.glb'),
  require('../../assets/models/Jade.glb'),
  require('../../assets/models/Amber.glb'),
  require('../../assets/models/Sapphire.glb'),
] as const
export const boardModel = require('../../assets/models/MidnightBoard.glb')
const models = new Map<number, Promise<GLTF>>()

// All match GLBs are self-contained and use vertex colors or solid materials.
async function readModel(module: number) {
  const asset = Asset.fromModule(module)
  let bytes: ArrayBuffer
  if (Platform.OS === 'web') {
    const response = await fetch(asset.uri)
    if (!response.ok) throw new Error(`Could not read ${asset.name} (${response.status})`)
    bytes = await response.arrayBuffer()
  } else {
    await asset.downloadAsync()
    if (!asset.localUri) throw new Error(`Missing local file for ${asset.name}`)
    bytes = await new File(asset.localUri).arrayBuffer()
  }
  return new GLTFLoader().parseAsync(bytes, '')
}

export function useGameModel(module: number) {
  const [model, setModel] = useState<GLTF | null>(null)
  useEffect(() => {
    let mounted = true
    let request = models.get(module)
    if (!request) {
      request = readModel(module).catch((error) => {
        models.delete(module)
        console.warn('[match model]', error)
        throw error
      })
      models.set(module, request)
    }
    request.then((loaded) => { if (mounted) setModel(loaded) }, () => {})
    return () => { mounted = false }
  }, [module])
  return model
}
