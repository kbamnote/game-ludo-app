export default function VoiceLounge({ uri }: { uri: string }) {
  return <iframe title="Ludo voice lounge" src={uri} allow="microphone; autoplay; clipboard-write"
    style={{ flex: 1, width: '100%', border: 0, background: '#0c2043' }} />
}
