import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Asset } from 'expo-asset'
import { Directory, File, Paths } from 'expo-file-system'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { prepareMetaPerson } from './metaPersonRig'
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
const models = new Map<number, Promise<GLTF>>()
const avatars = new Map<string,Promise<GLTF>>()

async function readAvatar(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw Error('Invalid avatar ID.')
  const url = SERVER_URL+'/avatars/metaperson/'+id+'.glb'
  const loader = new GLTFLoader()
  let bytes: ArrayBuffer
  if (Platform.OS === 'web') {
    const r = await fetch(url)
    if (!r.ok) throw Error('The avatar could not be downloaded.')
    bytes = await r.arrayBuffer()
  } else {
    const dir = new Directory(Paths.cache,'metaperson',id)
    dir.create({ idempotent:true,intermediates:true })
    const file = new File(dir,'model.glb')
    if (!file.exists) {
      const tmp = new File(dir,'model.tmp')
      if (tmp.exists) tmp.delete()
      await File.downloadFileAsync(url,tmp)
      tmp.move(file)
    }
    bytes = await file.arrayBuffer()
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

export function useGameModel(module: number | string) {
  const [result, setResult] = useState<{ module: number | string; model: GLTF } | null>(null)
  useEffect(() => {
    let mounted = true
    let request = typeof module === 'string' ? loadAvatar(module) : models.get(module)
    if (!request && typeof module === 'number') {
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
