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
  Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useGameActions } from '@/hooks/useGameActions'
import { useConfirmRoomExit } from '@/hooks/useConfirmRoomExit'
import { useUIStore } from '@/stores/useUIStore'
import {
  getLobbyHydrationPhase,
  getLobbyStartState,
  getPlayersNeededToStart,
} from '@/lib/lobbyState'
import { Button } from '@/components/ui/Button'
import { Background } from '@/components/layout/Background'
import { AppHeader } from '@/components/layout/AppHeader'
import { PlayerList } from '@/components/game/PlayerList'
import { colors } from '@/constants/theme'
import { buildLeaveRoomConfirmCopy } from '@/lib/leaveRoomConfirm'
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

  const hydrationPhase = getLobbyHydrationPhase({
    roomResolved: room !== null,
    hydratingPlayers,
    roomNotFound,
    roomLoadFailed,
  })

  const isHost = !!(room?.host_id && userId && room.host_id === userId)
  const activeCount = players.length
  const startState = getLobbyStartState({ isHost, activeCount, hydratingPlayers })
  const playersNeeded = getPlayersNeededToStart(activeCount)
  const canStart = isHost && !hydratingPlayers && activeCount >= 3

  useConfirmRoomExit({
    enabled: !!code,
    t,
    onConfirmExit: async () => {
      if (!code) return
      await leaveRoom(code)
      router.replace('/(tabs)')
    },
  })

  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace(`/room/${code}/game`)
    }
  }, [room?.status, router, code])

  useEffect(() => {
    if (!room?.id) {
      setMessages([])
      return
    }

    let cancelled = false

    setMessages([])

    supabase
      .from('lobby_messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return
        setMessages(data as LobbyMessage[])
      })

    const sub = supabase
      .channel(`lobby-chat:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as LobbyMessage])
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(sub)
    }
  }, [room?.id])

  async function sendMessage() {
    if (!chatText.trim() || !room?.id || !userId) return
    if (room.status !== 'lobby') return

    const player = players.find((p) => p.player_id === userId)
    if (!player) return

    await supabase.from('lobby_messages').insert({
      room_id: room.id,
      player_id: player.player_id,
      sender_name: player.display_name,
      text: chatText.trim(),
    })
    setChatText('')
  }

  async function handleStart() {
    if (!code || !canStart) return

    setStarting(true)
    try {
      await gameAction(code, 'start_game')
    } finally {
      setStarting(false)
    }
  }

  async function handleLeave() {
    if (!code) return
    const copy = buildLeaveRoomConfirmCopy(t)

    Alert.alert(copy.title, copy.message, [
      { text: copy.cancelLabel, style: 'cancel' },
      {
        text: copy.confirmLabel,
        style: 'destructive',
        onPress: () => {
          void leaveRoom(code).then(() => {
            router.replace('/(tabs)')
          })
        },
      },
    ])
  }

  async function handleCopyCode() {
    if (!code) return
    const clipboard = globalThis.navigator?.clipboard
    if (clipboard?.writeText) {
      await clipboard.writeText(code)
    } else {
      await Share.share({ message: code })
    }
    showToast(t('lobby.codeCopied'), 'success')
  }

  async function handleCopyCode() {
    if (!code) return
    const clipboard = globalThis.navigator?.clipboard
    if (clipboard?.writeText) {
      await clipboard.writeText(code)
    } else {
      await Share.share({ message: code })
    }
    showToast(t('lobby.codeCopied'), 'success')
  }

  async function handleShare() {
    if (!code) return
    const deepLink = Linking.createURL(`/room/${code}/lobby`)
    await Share.share({
      message: `${t('lobby.inviteMessage', { code })}\n${deepLink}`,
      url: deepLink,
    })
  }

  const renderChatItem = useCallback(({ item }: { item: LobbyMessage }) => (
    <View style={styles.chatMessage}>
      <Text style={styles.chatSender}>{item.sender_name}</Text>
      <Text style={styles.chatText}>{item.text}</Text>
    </View>
  ), [])

  if (hydrationPhase === 'room-unresolved') {
    return (
      <Background>
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>{t('lobby.preparation')}</Text>
        </SafeAreaView>
      </Background>
    )
  }

  if (hydrationPhase === 'room-not-found') {
    return (
      <Background>
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
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
        <SafeAreaView style={styles.centeredScreen} edges={['bottom']}>
          <Text style={styles.errorTitle}>{t('lobby.loadFailed')}</Text>
          <Button onPress={() => router.replace('/(tabs)')} variant="ghost">
            {t('common.back')}
          </Button>
        </SafeAreaView>
      </Background>
    )
  }

  const statusCopy = hydratingPlayers
    ? t('lobby.preparation')
    : startState === 'host_preparation'
      ? t('lobby.preparation')
      : startState === 'host_waiting_for_more_players'
        ? t('lobby.hostWaiting', { count: playersNeeded })
        : startState === 'host_ready'
          ? t('lobby.hostReady')
          : t('lobby.guestWaiting')

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <AppHeader title={t('lobby.title')} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>{t('lobby.roomCode')}</Text>
              <TouchableOpacity
                onPress={handleCopyCode}
                activeOpacity={0.76}
                style={styles.codeBlock}
              >
                <Text style={styles.codeText}>{code}</Text>
                <Text style={styles.copyHint}>{t('lobby.tapToShare')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                activeOpacity={0.82}
                style={styles.shareButton}
              >
                <Text style={styles.shareButtonText}>{t('lobby.shareInviteLink')}</Text>
              </TouchableOpacity>
              <View style={styles.rulePill}>
                <Text style={styles.ruleText}>{t('lobby.roomRules')}</Text>
              </View>
              <Text style={styles.statusCopy}>{statusCopy}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>
                {t('lobby.playerCount', { count: activeCount })}
              </Text>
              {hydratingPlayers ? (
                <View style={styles.rosterPrep}>
                  <ActivityIndicator color={colors.goldDim} size="small" />
                  <Text style={styles.rosterPrepText}>{t('lobby.preparation')}</Text>
                </View>
              ) : players.length > 0 ? (
                <PlayerList players={players} />
              ) : (
                <View style={styles.rosterPrep}>
                  <Text style={styles.rosterPrepText}>{t('lobby.preparation')}</Text>
                </View>
              )}
            </View>

            <View style={styles.actionCard}>
              {hydratingPlayers ? (
                <View style={styles.actionPrep}>
                  <ActivityIndicator color={colors.gold} size="small" />
                  <Text style={styles.helperText}>{t('lobby.preparation')}</Text>
                </View>
              ) : isHost ? (
                <>
                  <Text style={styles.helperText}>{statusCopy}</Text>
                  <Button onPress={handleStart} loading={starting} disabled={!canStart}>
                    {t('lobby.startGame')}
                  </Button>
                  {!canStart && (
                    <Text style={styles.hintText}>{t('errors.MIN_PLAYERS_REQUIRED')}</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.waitingText}>{statusCopy}</Text>
                  <Text style={styles.helperText}>{t('lobby.guestHint')}</Text>
                </>
              )}
            </View>

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
            <Button onPress={handleLeave} variant="ghost">
              {t('lobby.leave')}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centeredScreen: {
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
    textAlign: 'center',
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
    borderRadius: 22,
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  codeBlock: {
    alignItems: 'center',
    gap: 4,
  },
  codeText: {
    color: colors.goldLight,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 10,
    textAlign: 'center',
  },
  copyHint: {
    color: colors.textMuted,
    fontSize: 11,
  },
  shareButton: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  shareButtonText: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rulePill: {
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ruleText: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusCopy: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 18,
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
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  rosterPrepText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  actionCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  actionPrep: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  waitingText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  chatCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    minHeight: 180,
  },
  chatList: {
    minHeight: 90,
  },
  chatMessage: {
    paddingVertical: 4,
  },
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
