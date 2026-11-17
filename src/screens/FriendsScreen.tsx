import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Backdrop from '../ui/Backdrop'
import Icon from '../ui/Icon'
import { GoldBar, GoldPanel, NUMERIC, LABEL, OutlineText } from '../ui/arcade'
import { Pawn } from '../ui/ArcadeIcons'
import { A } from '../theme'
import { SEAT_HEX, type Seat } from '../game/rules'
import { useIdentity } from '../game/identity'
import { useOnline } from '../net/online'
import { SERVER_URL } from '../net/config'

const SEAT_COLOR: Record<Seat, string> = SEAT_HEX

export default function FriendsScreen() {
  const identity = useIdentity()
  const { status, error, busy, room, connect, createRoom, joinRoom, setReady, startMatch, leaveRoom, clearError } =
    useOnline()

  const [code, setCode] = useState('')
  const [nameDraft, setNameDraft] = useState(identity.name)
  const [editingName, setEditingName] = useState(!identity.named)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void connect()
  }, [connect])

  // Once the host starts, every member is pushed into the match.
  useEffect(() => {
    if (room?.phase === 'playing') router.replace('/match')
  }, [room?.phase])

  const me = room?.members.find((m) => m.playerId === identity.playerId)
  const isHost = room?.hostId === identity.playerId
  const seated = room?.members.filter((m) => m.seat !== null) ?? []
  const everyoneReady = seated.length >= 2 && seated.every((m) => m.ready)

  const onCopy = async () => {
    if (!room) return
    await Clipboard.setStringAsync(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const onInvite = async () => {
    if (!room) return
    await Share.share({
      message: `Join my Ludo After Dark room! Room code: ${room.code}`,
    })
  }

  return (
    <View style={styles.root}>
      <Backdrop />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (room) leaveRoom()
              router.replace('/home')
            }}
          >
            <Icon name="arrow-back" size={22} color={A.text} />
          </Pressable>
          <OutlineText size={21} width={2.6} color={A.gold} outline={A.textOutline}>
            PLAY WITH FRIENDS
          </OutlineText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Connection + identity */}
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor(status) }]} />
            <Text style={styles.statusText}>{statusLabel(status)}</Text>
            <View style={{ flex: 1 }} />
            {editingName ? (
              <View style={styles.nameEdit}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  maxLength={16}
                  autoFocus
                  placeholder="Your name"
                  placeholderTextColor="rgba(207,224,255,0.5)"
                  style={styles.nameInput}
                />
                <Pressable
                  style={styles.nameSave}
                  onPress={() => {
                    identity.setName(nameDraft)
                    setEditingName(false)
                  }}
                >
                  <Icon name="check" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.nameChip} onPress={() => setEditingName(true)}>
                <Icon name="person" size={14} color={A.gold} />
                <Text style={styles.nameText}>{identity.name}</Text>
                <Icon name="edit" size={12} color={A.textDim} />
              </Pressable>
            )}
          </View>

          {error && (
            <Pressable style={styles.errorBox} onPress={clearError}>
              <Icon name="error-outline" size={16} color="#ffd7d7" />
              <Text style={styles.errorText}>{error}</Text>
              <Icon name="close" size={14} color="#ffd7d7" />
            </Pressable>
          )}

          {!room ? (
            <>
              {/* Create */}
              <GoldPanel radius={16} contentStyle={styles.card}>
                <View style={styles.cardHead}>
                  <Icon name="add-circle" size={22} color={A.goldLite} />
                  <OutlineText size={17} width={2.2}>
                    CREATE A ROOM
                  </OutlineText>
                </View>
                <Text style={styles.cardBody}>
                  Make a private table and share the 6-digit code. Up to 4 players.
                </Text>
                <GoldBar
                  label={busy ? 'CREATING...' : 'CREATE ROOM'}
                  size={16}
                  paddingVertical={7}
                  onPress={busy ? undefined : () => void createRoom()}
                />
              </GoldPanel>

              {/* Join */}
              <GoldPanel radius={16} contentStyle={styles.card}>
                <View style={styles.cardHead}>
                  <Icon name="vpn-key" size={20} color={A.goldLite} />
                  <OutlineText size={17} width={2.2}>
                    JOIN WITH CODE
                  </OutlineText>
                </View>
                <TextInput
                  value={code}
                  onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.codeInput}
                />
                <GoldBar
                  label={busy ? 'JOINING...' : 'JOIN ROOM'}
                  size={16}
                  paddingVertical={7}
                  onPress={busy || code.length !== 6 ? undefined : () => void joinRoom(code)}
                />
                {code.length > 0 && code.length < 6 && (
                  <Text style={styles.hint}>Codes are 6 digits</Text>
                )}
              </GoldPanel>

              <Text style={styles.server} numberOfLines={1}>
                server: {SERVER_URL}
              </Text>
            </>
          ) : (
            <>
              {/* Room code */}
              <GoldPanel radius={16} contentStyle={styles.card}>
                <Text style={styles.roomLabel}>ROOM CODE</Text>
                <Text style={styles.roomCode}>{room.code}</Text>

                <View style={styles.codeActions}>
                  <Pressable style={styles.actionButton} onPress={onCopy}>
                    <Icon name={copied ? 'check' : 'content-copy'} size={16} color={A.text} />
                    <Text style={styles.actionText}>{copied ? 'COPIED' : 'COPY'}</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.inviteButton]} onPress={onInvite}>
                    <Icon name="share" size={16} color={A.text} />
                    <Text style={styles.actionText}>INVITE</Text>
                  </Pressable>
                </View>
              </GoldPanel>

              {/* Seats */}
              <GoldPanel radius={16} contentStyle={styles.card}>
                <View style={styles.cardHead}>
                  <Icon name="groups" size={20} color={A.goldLite} />
                  <OutlineText size={16} width={2.2}>
                    PLAYERS {seated.length}/4
                  </OutlineText>
                </View>

                {([0, 1, 2, 3] as Seat[]).map((seat) => {
                  const member = room.members.find((m) => m.seat === seat)
                  return (
                    <View key={seat} style={styles.seatRow}>
                      <View style={[styles.seatPawn, { opacity: member ? 1 : 0.3 }]}>
                        <Pawn size={22} color={SEAT_COLOR[seat]} dark="#00000055" />
                      </View>
                      <Text style={[styles.seatName, !member && styles.seatEmpty]} numberOfLines={1}>
                        {member ? member.name : 'Waiting...'}
                        {member?.playerId === identity.playerId ? '  (you)' : ''}
                      </Text>
                      {member?.playerId === room.hostId && (
                        <View style={styles.hostTag}>
                          <Text style={styles.hostTagText}>HOST</Text>
                        </View>
                      )}
                      {member && !member.connected && (
                        <Text style={styles.offline}>offline</Text>
                      )}
                      {member && member.connected && (
                        <Icon
                          name={member.ready ? 'check-circle' : 'radio-button-unchecked'}
                          size={18}
                          color={member.ready ? A.green : A.textDim}
                        />
                      )}
                    </View>
                  )
                })}
              </GoldPanel>

              {/* Ready / start */}
              <GoldBar
                label={me?.ready ? 'READY ✓' : 'TAP WHEN READY'}
                size={16}
                paddingVertical={8}
                onPress={() => setReady(!me?.ready)}
                style={me?.ready ? { opacity: 0.85 } : undefined}
              />

              {isHost ? (
                <GoldPanel
                  radius={14}
                  face={everyoneReady ? ['#3ddc6b', '#18a14a'] : ['#5a6b8c', '#3d4b66']}
                  rim={everyoneReady ? [A.goldLite, A.gold, A.goldMid] : ['#8d9bb3', '#6b7890', '#55617a']}
                  contentStyle={styles.startPanel}
                  onPress={everyoneReady && !busy ? () => void startMatch() : undefined}
                  disabled={!everyoneReady || busy}
                >
                  <OutlineText size={19} width={2.6}>
                    {busy ? 'STARTING...' : 'START MATCH'}
                  </OutlineText>
                </GoldPanel>
              ) : (
                <Text style={styles.waitingHost}>
                  {everyoneReady ? 'Waiting for the host to start...' : 'Waiting for everyone to be ready...'}
                </Text>
              )}

              {!everyoneReady && isHost && (
                <Text style={styles.hint}>
                  {seated.length < 2 ? 'Need at least 2 players' : 'Everyone must tap ready'}
                </Text>
              )}

              <Pressable
                style={styles.leave}
                onPress={() => {
                  leaveRoom()
                  setCode('')
                }}
              >
                <Icon name="logout" size={15} color="#ffb3b3" />
                <Text style={styles.leaveText}>LEAVE ROOM</Text>
              </Pressable>
            </>
          )}

          {busy && <ActivityIndicator color={A.gold} style={{ marginTop: 10 }} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function statusColor(s: string) {
  if (s === 'connected') return A.green
  if (s === 'error') return A.red
  return A.gold
}
function statusLabel(s: string) {
  if (s === 'connected') return 'Connected'
  if (s === 'connecting') return 'Connecting...'
  if (s === 'reconnecting') return 'Reconnecting...'
  if (s === 'error') return 'Offline'
  return 'Idle'
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bgMid },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(5,20,56,0.7)',
    borderWidth: 1.5,
    borderColor: A.barEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 14, paddingBottom: 28, gap: 12, maxWidth: 460, width: '100%', alignSelf: 'center' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: LABEL, fontSize: 12, color: A.textDim },
  nameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5,20,56,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: A.barEdge,
  },
  nameText: { fontFamily: NUMERIC, fontSize: 13, color: A.text },
  nameEdit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameInput: {
    fontFamily: NUMERIC,
    fontSize: 14,
    color: A.text,
    backgroundColor: 'rgba(5,20,56,0.8)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: A.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 130,
  },
  nameSave: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: A.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(163,18,31,0.9)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ff8a8a',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: { flex: 1, fontFamily: LABEL, fontSize: 12.5, color: '#ffe6e6' },

  card: { padding: 14, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBody: { fontFamily: LABEL, fontSize: 12.5, color: '#dbe9ff', lineHeight: 17 },
  hint: { fontFamily: LABEL, fontSize: 11.5, color: A.textDim, textAlign: 'center' },
  server: { fontFamily: LABEL, fontSize: 10, color: 'rgba(188,212,245,0.45)', textAlign: 'center' },

  codeInput: {
    fontFamily: NUMERIC,
    fontSize: 30,
    letterSpacing: 8,
    textAlign: 'center',
    color: A.text,
    backgroundColor: 'rgba(5,20,56,0.75)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: A.goldDeep,
    paddingVertical: 8,
  },

  roomLabel: { fontFamily: LABEL, fontSize: 11, color: '#cfe0ff', textAlign: 'center', letterSpacing: 1.5 },
  roomCode: {
    fontFamily: NUMERIC,
    fontSize: 42,
    letterSpacing: 9,
    textAlign: 'center',
    color: A.goldLite,
    includeFontPadding: false,
  },
  codeActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(5,20,56,0.7)',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: A.barEdge,
    paddingVertical: 9,
  },
  inviteButton: { backgroundColor: 'rgba(19,110,60,0.8)', borderColor: A.green },
  actionText: { fontFamily: NUMERIC, fontSize: 12.5, color: A.text },

  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(5,20,56,0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  seatPawn: { width: 24, alignItems: 'center' },
  seatName: { flex: 1, fontFamily: NUMERIC, fontSize: 14, color: A.text },
  seatEmpty: { color: 'rgba(207,224,255,0.4)' },
  hostTag: { backgroundColor: A.gold, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  hostTagText: { fontFamily: NUMERIC, fontSize: 9, color: '#4a2a00' },
  offline: { fontFamily: LABEL, fontSize: 10, color: '#ff9b9b' },

  startPanel: { paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  waitingHost: { fontFamily: LABEL, fontSize: 13, color: '#cfe0ff', textAlign: 'center', paddingVertical: 4 },

  leave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  leaveText: { fontFamily: NUMERIC, fontSize: 12.5, color: '#ffb3b3' },
})
