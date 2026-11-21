import { useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Pressable from './SoundPressable'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { File } from 'expo-file-system'
import { fromByteArray, toByteArray } from 'base64-js'
import { decode } from 'jpeg-js'
import { FACE_SIZE } from '../game/character'
import { Action, s } from './ArcadePage'

export interface Portrait { uri: string; width: number; height: number }
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))
const cropFrame = { width: '100%', maxWidth: 300, aspectRatio: 1, alignSelf: 'center', overflow: 'hidden', touchAction: 'none' } as const

export default function SelfieCrop({ photo, onApply, onCancel, fitIn3D = false }: {
  photo: Portrait; onApply: (pixels: string) => Promise<void>; onCancel: () => void; fitIn3D?: boolean
}) {
  const [width, setWidth] = useState(250)
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: photo.width / 2, y: photo.height / 2 })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => {
    if (photo.uri.startsWith('blob:')) URL.revokeObjectURL(photo.uri)
  }, [photo.uri])
  const drag = useRef({ x: 0, y: 0, left: 0, top: 0 })
  const side = Math.max(1, Math.floor(Math.min(photo.width, photo.height) / zoom))
  const left = Math.round(clamp(center.x - side / 2, photo.width - side))
  const top = Math.round(clamp(center.y - side / 2, photo.height - side))
  const scale = width / side

  async function apply() {
    setBusy(true)
    setError('')
    const context = ImageManipulator.manipulate(photo.uri)
    try {
      context.crop({ originX: left, originY: top, width: side, height: side }).resize({ width: FACE_SIZE, height: FACE_SIZE })
      const image = await context.renderAsync()
      try {
        const jpeg = await image.saveAsync({ format: SaveFormat.JPEG, compress: .94, base64: true })
        if (jpeg.uri.startsWith('blob:')) URL.revokeObjectURL(jpeg.uri)
        else if (jpeg.uri.startsWith('file://')) new File(jpeg.uri).delete()
        if (!jpeg.base64) throw Error('Empty crop')
        const { data, width: w, height: h } = decode(toByteArray(jpeg.base64), { useTArray: true, formatAsRGBA: false, maxMemoryUsageInMB: 8 })
        if (w !== FACE_SIZE || h !== FACE_SIZE) throw Error('Invalid crop')
        await onApply(fromByteArray(data))
      } finally { image.release() }
    } catch (e) { setError(fitIn3D ? (e instanceof Error ? e.message : 'Couldn’t reach the character fitter.') : 'Couldn’t read this photo. Try another selfie.'); setBusy(false) }
    finally { context.release() }
  }
  return <View style={s.card}>
    <Text style={s.heading}>Fit your face</Text>
    <Text style={s.copy}>Drag the photo to center your face. Fill the oval from forehead to chin.</Text>
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={({ nativeEvent }) => { drag.current = { x: nativeEvent.pageX, y: nativeEvent.pageY, left, top } }}
      onResponderMove={({ nativeEvent }) => {
        const start = drag.current
        setCenter({
          x: side / 2 + clamp(start.left - (nativeEvent.pageX - start.x) / scale, photo.width - side),
          y: side / 2 + clamp(start.top - (nativeEvent.pageY - start.y) / scale, photo.height - side),
        })
      }}
      style={cropFrame}>
      <Image resizeMode="stretch" source={{ uri: photo.uri }}
        style={{ position: 'absolute', width: photo.width * scale, height: photo.height * scale, left: -left * scale, top: -top * scale }} />
      <View pointerEvents="none" style={styles.oval} />
    </View>
    <View style={s.line}>{[-.5, .5].map(step =>
      <Pressable key={step} accessibilityRole="button" style={s.back} onPress={() => setZoom(z => Math.min(6, Math.max(1, z + step)))}
        accessibilityLabel={step < 0 ? 'Zoom out' : 'Zoom in'}><Text style={s.heading}>{step < 0 ? '−' : '+'}</Text></Pressable>)}
      <Text style={s.copy}>{zoom}×</Text></View>
    {!!error && <Text accessibilityLiveRegion="polite" style={s.notice}>{error}</Text>}
    {fitIn3D && <Text style={s.copy}>Fit sends this small crop to the game server to estimate your jaw, eyes, nose and mouth in 3D.</Text>}
    <Action label={busy ? 'Applying selfie…' : fitIn3D ? 'Fit my 3D face' : 'Preview on character'} onPress={apply} disabled={busy} />
    <Pressable accessibilityRole="button" disabled={busy} onPress={onCancel}><Text style={s.copy}>Cancel crop</Text></Pressable>
  </View>
}

const styles = StyleSheet.create({
  oval: { position: 'absolute', top: '3%', bottom: '3%', left: '8%', right: '8%', borderWidth: 2, borderColor: '#ffdf8b', borderRadius: 200 },
})
