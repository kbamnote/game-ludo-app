import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Asset } from 'expo-asset'
import { Directory, File, Paths } from 'expo-file-system'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { prepareMetaPerson } from './metaPersonRig'
import { bundledMetaPerson } from '../game/metapersonRoster'
import { SERVER_URL } from '../net/config'

export const teamModels = [
  require('../../assets/models/Ruby.glb'),
  require('../../assets/models/Jade.glb'),
  require('../../assets/models/Amber.glb'),
  require('../../assets/models/Sapphire.glb'),
  require('../../assets/models/BurgundyBoard.glb'),
] as const
export const varsityPreviewModel = require('../../assets/models/Burgundy.glb')
export const boardModel = require('../../assets/models/MidnightBoard.glb')
const models = new Map<number | string, Promise<GLTF>>()
const avatars = new Map<string,Promise<GLTF>>()

async function readAvatar(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw Error('Invalid avatar ID.')
  const bundled = bundledMetaPerson(id)
  const asset = bundled ? Asset.fromModule(bundled.asset) : null
  const url = asset?.uri ?? SERVER_URL+'/avatars/metaperson/'+id+'.glb'
  const loader = new GLTFLoader()
  let bytes: ArrayBuffer
  if (Platform.OS === 'web') {
    const r = await fetch(url)
    if (!r.ok) throw Error('The avatar could not be downloaded.')
    bytes = await r.arrayBuffer()
  } else {
    const dir = asset
      ? new Directory(Paths.cache, 'metaperson-bundled', id, asset.hash ?? 'original')
      : new Directory(Paths.cache, 'metaperson', id)
    dir.create({ idempotent:true,intermediates:true })
    const file = new File(dir,'model.glb')
    if (asset) {
      await asset.downloadAsync()
      if (!asset.localUri) throw Error('The bundled avatar file is unavailable.')
      bytes = await new File(asset.localUri).arrayBuffer()
    } else {
      if (!file.exists) {
        const tmp = new File(dir,'model.tmp')
        if (tmp.exists) tmp.delete()
        await File.downloadFileAsync(url,tmp)
        tmp.move(file)
      }
      bytes = await file.arrayBuffer()
    }
    // Expo GL can upload local image files directly. Extract embedded images
    // before GLTFLoader starts loading materials to avoid native Blob URLs.
    loader.register(parser => ({ name:'ExpoAvatarTextures', async beforeRoot() {
      for (const [index,image] of (parser.json.images ?? []).entries()) {
        if (image.bufferView === undefined) throw Error('Avatar contains an external image.')
        const target = new File(dir,index+(image.mimeType==='image/png' ? '.png' : '.jpg'))
        if (!target.exists) target.write(new Uint8Array(await parser.getDependency('bufferView',image.bufferView)))
        delete image.bufferView
        image.uri = target.uri
      }
    } }))
    try { return prepareMetaPerson(await loader.parseAsync(bytes,'')) }
    catch (e) { dir.delete(); throw e }
  }
  return prepareMetaPerson(await loader.parseAsync(bytes,''))
}
export function loadAvatar(id: string) {
  let request = avatars.get(id)
  if (!request) {
    if (avatars.size >= 8) avatars.delete(avatars.keys().next().value!)
    request = readAvatar(id).catch(e => { avatars.delete(id); throw e })
    avatars.set(id,request)
  }
  return request
}

// All match GLBs are self-contained and use vertex colors or solid materials.
async function readModel(module: number | string) {
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

export function useGameModel(module: number | string) {
  const [result, setResult] = useState<{ module: number | string; model: GLTF } | null>(null)
  useEffect(() => {
    let mounted = true
    // Expo web can resolve bundled GLBs to URL strings rather than Metro IDs.
    const isAvatar = typeof module === 'string' && /^[a-f0-9]{64}$/.test(module)
    let request = isAvatar ? loadAvatar(module) : models.get(module)
    if (!request && !isAvatar) {
      request = readModel(module).catch((error) => {
        models.delete(module)
        console.warn('[match model]', error)
        throw error
      })
      models.set(module, request)
    }
    request?.then((model) => { if (mounted) setResult({ module, model }) }, () => {})
    return () => { mounted = false }
  }, [module])
  return result?.module === module ? result.model : null
}
