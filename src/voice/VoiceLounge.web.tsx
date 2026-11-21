import { useCallback, useEffect, useRef } from 'react'

export default function VoiceLounge({ uri, speakerMuted }: { uri: string; speakerMuted?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const syncSpeaker = useCallback(() => {
    if (speakerMuted === undefined) return
    frame.current?.contentWindow?.postMessage({ type: 'voice-speaker', muted: speakerMuted }, new URL(uri).origin)
  }, [uri, speakerMuted])
  useEffect(syncSpeaker, [syncSpeaker])

  return <iframe ref={frame} onLoad={syncSpeaker} title="Ludo voice lounge" src={uri} allow="microphone; autoplay; clipboard-write"
    style={{ flex: 1, width: '100%', border: 0, background: '#0c2043' }} />
}
