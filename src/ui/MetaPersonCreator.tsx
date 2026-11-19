import { useEffect, useRef, useState } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { launchImageLibraryAsync, type ImagePickerAsset } from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { File } from 'expo-file-system'
import { fetch as expoFetch } from 'expo/fetch'
import { SERVER_URL } from '../net/config'
import { loadAvatar } from '../three/useCharacterModel'
import { Action, s } from './ArcadePage'

const base = SERVER_URL+'/avatars/metaperson/'
const pendingKey = 'metaperson-pending:'+SERVER_URL
const errorMessage = (e: unknown) => e instanceof Error ? e.message : 'Please try again.'
async function result(r: { ok: boolean; json: () => Promise<any> }) {
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Error(data.error || 'The game server could not complete the avatar request.')
  return data
}
export default function MetaPersonCreator({ onReady,onBack }: { onReady:(id:string)=>void; onBack:()=>void }) {
  const [body,setBody] = useState('male'), [styles,setStyles] = useState<string[]>([]), [outfit,setOutfit] = useState('')
  const [photo,setPhoto] = useState<ImagePickerAsset | null>(null)
  const [working,setWorking] = useState(false), [job,setJob] = useState<string|null>(null)
  const [notice,setNotice] = useState(''), [progress,setProgress] = useState(0), [attempt,setAttempt] = useState(0)
  const [restored,setRestored] = useState(false)
  const lock = useRef(false), mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    void AsyncStorage.getItem(pendingKey)
      .then(id => { if (mounted.current) setJob(id) })
      .catch(() => { if (mounted.current) setNotice('Could not restore the last avatar request.') })
      .finally(() => { if (mounted.current) setRestored(true) })
    return () => { mounted.current = false }
  },[])
  useEffect(() => {
    if (!restored || job) return
    const ctl = new AbortController()
    fetch(base+'styles?body='+body,{signal:ctl.signal}).then(result).then(data => {
      if (ctl.signal.aborted) return
      if (!Array.isArray(data.outfits) || !data.outfits.length || !data.outfits.every((v:unknown)=>typeof v==='string'))
        throw Error('No outfits are available for this body style.')
      setStyles(data.outfits)
      setOutfit(data.outfits[0])
    }).catch(e => { if (!ctl.signal.aborted) setNotice(errorMessage(e)) })
    return () => ctl.abort()
  },[body,attempt,job,restored])
  useEffect(() => {
    if (!job) return
    const ctl = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try {
        const r = await fetch(base+job,{signal:ctl.signal})
        if (r.status === 422 || r.status === 404) {
          await AsyncStorage.removeItem(pendingKey)
          if (!ctl.signal.aborted) setJob(null)
        }
        const data = await result(r)
        if (ctl.signal.aborted) return
        if (!data.ready) { setProgress(data.progress); timer=setTimeout(poll,5000); return }
        await loadAvatar(job!)
        if (ctl.signal.aborted) return
        await AsyncStorage.removeItem(pendingKey)
        if (!ctl.signal.aborted) onReady(job!)
      } catch (e) { if (!ctl.signal.aborted) setNotice(errorMessage(e)) }
    }
    void poll()
    return () => { ctl.abort(); clearTimeout(timer) }
  },[job,attempt,onReady])

  async function pick() {
    try {
      const r = await launchImageLibraryAsync({mediaTypes:['images'],quality:1})
      if (!r.canceled) setPhoto(r.assets[0])
    } catch { setNotice('Could not open the photo library.') }
  }
  async function generate() {
    if (!photo || !outfit || lock.current) return
    lock.current = true; setWorking(true); setNotice('')
    const manip = ImageManipulator.manipulate(photo.uri)
    try {
      if (Math.max(photo.width,photo.height)>1024) manip.resize(photo.width>photo.height ? {width:1024} : {height:1024})
      const image = await manip.renderAsync()
      try {
        const resized = await image.saveAsync({format:SaveFormat.JPEG,compress:.90})
        try {
          const url = base+'generate?body='+body+'&outfit='+encodeURIComponent(outfit)
          const headers = {'Content-Type':'image/jpeg'}
          const r = Platform.OS === 'web'
            ? await fetch(url,{method:'POST',headers,body:await (await fetch(resized.uri)).blob()})
            : await expoFetch(url,{method:'POST',headers,body:new File(resized.uri)})
          const data = await result(r)
          if (typeof data.id !== 'string' || !/^[a-f0-9]{64}$/.test(data.id)) throw Error('Invalid avatar job.')
          await AsyncStorage.setItem(pendingKey,data.id)
          if (mounted.current) setJob(data.id)
        } finally {
          if (resized.uri.startsWith('file:')) new File(resized.uri).delete()
          else if (resized.uri.startsWith('blob:')) URL.revokeObjectURL(resized.uri)
        }
      } finally { image.release() }
    } catch(e) { if (mounted.current) setNotice(errorMessage(e)) }
    finally { manip.release(); lock.current=false; if (mounted.current) setWorking(false) }
  }
  function choices(values: string[],selected: string,select:(s:string)=>void) {
    return <View style={s.line}>{values.map(v=><Pressable key={v} disabled={working} accessibilityRole="radio"
      accessibilityState={{checked:v===selected}} onPress={()=>select(v)} style={[s.card,v===selected && {borderColor:'#ffc651'}]}>
      <Text style={s.copy}>{v.replaceAll('_',' ')}</Text></Pressable>)}</View>
  }
  return <>
    <Text style={s.heading}>Create your MetaPerson avatar</Text>
    {job ? <Text style={s.copy}>Generating your 3D model… {progress}%</Text> : <>
      <Text style={s.copy}>Choose a body and outfit, then select a clear, front-facing selfie.</Text>
      {choices(['male','female'],body,v=>{ if (body!==v) { setNotice('');setStyles([]);setOutfit('');setBody(v) } })}
      {styles.length>0 ? choices(styles,outfit,setOutfit) : !notice && <Text style={s.copy}>Loading outfits…</Text>}
      {!!photo && <Image source={{uri:photo.uri}} resizeMode="contain" style={{height:170,width:'100%'}} />}
      <Action label={photo ? 'Change selfie' : 'Choose a selfie'} onPress={pick} disabled={!outfit || working} />
      <Text style={s.copy}>Generate sends this photo through the game server to MetaPerson. Other players can see the 3D avatar you equip.</Text>
      <Action label={working ? 'Sending selfie…' : 'Generate 3D avatar'} disabled={!photo || !outfit || working} onPress={generate} />
    </>}
    {!!notice && <><Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>
      <Action label="Retry" onPress={()=>{setNotice('');setAttempt(v=>v+1)}} /></>}
    <Action label="Back to my character" onPress={onBack} disabled={working} />
  </>
}
