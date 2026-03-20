import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useGameActions } from '@/hooks/useGameActions'
import { useUIStore } from '@/stores/useUIStore'
import { getLobbyHydrationPhase, getLobbyStartState, getPlayersNeededToStart } from '@/lib/lobbyState'
import { Button } from '@/components/ui/Button'
import { Background } from '@/components/layout/Background'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlayerList } from '@/components/game/PlayerList'
import { colors } from '@/constants/theme'
import type { LobbyMessage } from '@/types/game'

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const { room, players, hydratingPlayers, roomNotFound, roomLoadFailed } = useRoom(code ?? null)
  const { leaveRoom, gameAction } = useGameActions()
  const { userId } = useAuth()

  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [starting, setStarting] = useState(false)
  const flatRef = useRef<FlatList>(null)

  const me = players.find((p) => p.player_id === userId)
  // Use room.host_id for reliable host detection — doesn't depend on players loading first
  const isHost = !!(room?.host_id && userId && room.host_id === userId)
  const activeCount = players.length // already filtered to active by useRoom

  const hydrationPhase = getLobbyHydrationPhase({
    roomResolved: room !== null,
    hydratingPlayers,
    roomNotFound,
    roomLoadFailed,
  })

  const startState = getLobbyStartState({ isHost, activeCount, hydratingPlayers })
  const playersNeeded = getPlayersNeededToStart(activeCount)
  const canStart = startState === 'host-ready'

  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace(`/room/${code}/game`)
    }
  }, [room?.status])

  useEffect(() => {
    if (!room?.id) return
    supabase
      .from('lobby_messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as LobbyMessage[]) })

    const sub = supabase
      .channel(`lobby-chat:${room.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'lobby_messages',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as LobbyMessage])
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [room?.id])

  async function sendMessage() {
    if (!chatText.trim() || !room?.id || !me) return
    if (room.status !== 'lobby') return
    await supabase.from('lobby_messages').insert({
      room_id: room.id, player_id: me.player_id,
      sender_name: me.display_name, text: chatText.trim(),
    })
    setChatText('')
  }

  async function handleStart() {
    if (!code) return
    setStarting(true)
    await gameAction(code, 'start_game')
    setStarting(false)
  }

  async function handleLeave() {
    if (!code) return
    await leaveRoom(code)
    router.replace('/(tabs)')
  }

  async function handleShare() {
    if (!code) return
    await Share.share({ message: `${t('lobby.shareCode')}: ${code}` })
  }

  const renderChatItem = useCallback(({ item }: { item: LobbyMessage }) => (
    <View style={styles.chatMessage}>
      <Text style={styles.chatSender}>{item.sender_name}</Text>
      <Text style={styles.chatText}>{item.text}</Text>
    </View>
  ), [])

  // ── Full-screen states ────────────────────────────────────────────────────

  if (hydrationPhase === 'room-unresolved') {
    return (
      <Background>
        <AppHeader />
        <SafeAreaView style={styles.centered} edges={['bottom']}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>{t('lobby.preparation')}</Text>
        </SafeAreaView>
      </Background>
    )
  }

  if (hydrationPhase === 'room-not-found') {
    return (
      <Background>
        <AppHeader />
        <SafeAreaView style={styles.centered} edges={['bottom']}>
          <Text style={styles.errorTitle}>{t('lobby.notFound')}</Text>
          <Button onPress={() => router.replace('/(tabs)')} variant="ghost">
            {t('common.back')}
          </Button>
        </SafeAreaView>
      </Background>
    )
  }

  if (hydrationPhase === 'room-load-failed') {
    return (
      <Background>
        <AppHeader />
        <SafeAreaView style={styles.centered} edges={['bottom']}>
          <Text style={styles.errorTitle}>{t('lobby.loadFailed')}</Text>
          <Button onPress={() => router.replace('/(tabs)')} variant="ghost">
            {t('common.back')}
          </Button>
        </SafeAreaView>
      </Background>
    )
  }

  // ── Main lobby layout ─────────────────────────────────────────────────────

  return (
    <Background>
      <AppHeader />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero room card */}
            <View style={styles.heroCard}>
              <Text style={styles.sectionLabel}>{t('lobby.shareCode')}</Text>
              <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={styles.shareRow}>
                <Text style={styles.codeText}>{code}</Text>
              </TouchableOpacity>
              <Text style={styles.shareHint}>{t('lobby.tapToShare')}</Text>
              <View style={styles.rulePill}>
                <Text style={styles.ruleText}>{t('lobby.roomRules')}</Text>
              </View>
              <Text style={styles.statusCopy}>{getRoomStatusCopy(t, startState, playersNeeded, hydratingPlayers)}</Text>
            </View>

            {/* Roster card */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>
                {t('lobby.playerCount', { count: activeCount })}
              </Text>
              {hydrationPhase === 'players-hydrating' ? (
                <View style={styles.rosterPrep}>
                  <ActivityIndicator color={colors.goldDim} size="small" />
                </View>
              ) : (
                <PlayerList players={players} />
              )}
            </View>

            {/* Action block */}
            {hydrationPhase !== 'players-hydrating' && (
              isHost ? (
                <View style={styles.actionBlock}>
                  <Button onPress={handleStart} loading={starting} disabled={!canStart}>
                    {t('lobby.startGame')}
                  </Button>
                </View>
              ) : (
                <View style={styles.waitingCard}>
                  <Text style={styles.waitingText}>{t('lobby.guestWaiting')}</Text>
                </View>
              )
            )}

            {/* Chat card — visually secondary */}
            <View style={styles.chatCard}>
              <Text style={styles.sectionLabel}>{t('lobby.chat')}</Text>
              <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(m) => m.id}
                style={styles.chatList}
                renderItem={renderChatItem}
              />
              {room?.status === 'lobby' && (
                <View style={styles.chatInput}>
                  <TextInput
                    style={styles.chatField}
                    placeholder={t('lobby.messagePlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={chatText}
                    onChangeText={setChatText}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                    maxLength={200}
                  />
                  <TouchableOpacity onPress={sendMessage} style={styles.sendBtn} activeOpacity={0.8}>
                    <Text style={styles.sendIcon}>→</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button onPress={handleLeave} variant="ghost">{t('lobby.leave')}</Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  )
}

function getRoomStatusCopy(
  t: (key: string, opts?: Record<string, unknown>) => string,
  startState: ReturnType<typeof getLobbyStartState>,
  playersNeeded: number,
  hydratingPlayers: boolean,
): string {
  if (hydratingPlayers) return t('lobby.preparation')
  switch (startState) {
    case 'host-preparation': return t('lobby.preparation')
    case 'host-waiting': return t('lobby.hostWaiting', { count: playersNeeded })
    case 'host-ready': return t('lobby.hostReady')
    case 'guest-waiting': return t('lobby.guestWaiting')
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  shareRow: {
    alignItems: 'center',
  },
  codeText: {
    color: colors.gold,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 12,
  },
  shareHint: {
    color: colors.textMuted,
    fontSize: 11,
  },
  rulePill: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 2,
  },
  ruleText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statusCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rosterPrep: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBlock: {
    gap: 8,
  },
  waitingCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  waitingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  chatCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    minHeight: 120,
    opacity: 0.85,
  },
  chatList: { minHeight: 80, maxHeight: 200 },
  chatMessage: { paddingVertical: 4 },
  chatSender: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chatText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  chatInput: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chatField: {
    flex: 1,
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
})
