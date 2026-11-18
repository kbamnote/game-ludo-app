import { useState } from 'react'
import { PanResponder, type GestureResponderEvent } from 'react-native'

export interface BoardView {
  angle: number
  elevation: number
  zoom: number
}

const TAP_SLOP = 10

function createBoardGesture() {
  const view: BoardView = { angle: Math.PI / 5, elevation: 1.14, zoom: 1.10 }
  let onTap: ((x: number, y: number) => void) | null = null
  let width = 390

  let fingers = 0, startX = 0, startY = 0, lastX = 0, lastY = 0, separation = 0
  let tapX = 0, tapY = 0
  let dragged = false
  const track = ({ nativeEvent: { touches } }: GestureResponderEvent) => {
    const a = touches[0], b = touches[1]
    if (!a) return
    const distance = b ? Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY) : 0
    if (b) dragged = true
    if (fingers !== touches.length) {
      fingers = touches.length
      startX = lastX = a.pageX
      startY = lastY = a.pageY
    } else if (b && separation > 0) {
      view.zoom = Math.max(.85, Math.min(1.6, view.zoom * distance / separation))
    } else if (!b && (dragged || Math.hypot(a.pageX - startX, a.pageY - startY) > TAP_SLOP)) {
      dragged = true
      view.angle -= (a.pageX - lastX) * Math.PI / width
      view.elevation = Math.max(.70, Math.min(1.36,
        view.elevation + (a.pageY - lastY) * 1.8 / width))
    } else {
      return
    }
    lastX = a.pageX
    lastY = a.pageY
    separation = distance
  }
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: e => {
      const touch = e.nativeEvent.touches[0] ?? e.nativeEvent
      tapX = touch.locationX
      tapY = touch.locationY
      startX = touch.pageX
      startY = touch.pageY
      fingers = 0
      dragged = false
      track(e)
    },
    onPanResponderStart: track,
    onPanResponderMove: track,
    onPanResponderEnd: track,
    onPanResponderRelease: ({ nativeEvent: e }) => {
      if (!dragged && Math.hypot(e.pageX - startX, e.pageY - startY) <= TAP_SLOP) onTap?.(tapX, tapY)
      fingers = 0
    },
    onPanResponderTerminate: () => { dragged = true; fingers = 0 },
  })
  return {
    view, handlers: responder.panHandlers,
    setWidth: (value: number) => { width = Math.max(1, value) },
    setTapHandler: (handler: typeof onTap) => { onTap = handler },
  }
}

export function useBoardGesture() {
  const [gesture] = useState(createBoardGesture)
  return gesture
}
