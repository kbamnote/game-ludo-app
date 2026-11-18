import { Component, type ReactNode } from 'react'

/**
 * An error boundary that lives *inside* the R3F canvas.
 *
 * react-three-fiber renders through its own reconciler root, so a boundary in
 * the React Native tree never sees an error thrown while building the scene —
 * the render loop simply stops and the canvas goes blank. This one sits in the
 * 3D tree and renders nothing on failure, so losing the character model costs
 * the tokens but leaves the board, dice and HUD intact.
 *
 * Its fallback must be 3D or null: a React Native view cannot be mounted here.
 */
interface Props {
  children: ReactNode
  /** Named in the log so it is obvious which part of the scene failed. */
  label: string
  onError?: (error: Error) => void
}

export default class SceneErrorSink extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error(`[scene] ${this.props.label} failed:`, error?.message)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
