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
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { PlayerList } from '@/components/game/PlayerList'
import { Background } from '@/components/layout/Background'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useGameActions } from '@/hooks/useGameActions'
import { useRoom } from '@/hooks/useRoom'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/theme'
import type { LobbyMessage } from '@/types/game'

export default function LobbyScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const { room, players } = useRoom(code ?? null)
  const { leaveRoom, gameAction } = useGameActions()
  const { userId } = useAuth()

  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [starting, setStarting] = useState(false)
  const flatRef = useRef<FlatList>(null)

  const me = players.find((player) => player.player_id === userId)
  const activePlayers = players.filter((player) => player.is_active)
  const isHost = me?.is_host ?? false
  const canStart = isHost && activePlayers.length >= 3

  useEffect(() => {
    if (room?.status === 'playing') {
      router.replace(`/room/${code}/game`)
    }
  }, [room?.status, code, router])

  useEffect(() => {
    if (!room?.id) return

    supabase
      .from('lobby_messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as LobbyMessage[])
      })

    const subscription = supabase
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
          setMessages((previous) => [...previous, payload.new as LobbyMessage])
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [room?.id])

  async function sendMessage() {
    if (!chatText.trim() || !room?.id || !me) return
    if (room.status !== 'lobby') return
    await supabase.from('lobby_messages').insert({
      room_id: room.id,
      player_id: me.player_id,
      sender_name: me.display_name,
      text: chatText.trim(),
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

  const renderChatItem = useCallback(
    ({ item }: { item: LobbyMessage }) => (
      <View style={styles.chatMessage}>
        <Text style={styles.chatSender}>{item.sender_name}</Text>
        <Text style={styles.chatText}>{item.text}</Text>
      </View>
    ),
    [],
  )

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.mainContent}>
            <View style={styles.codeCard}>
              <DecorativeTitle variant="eyebrow" tone="muted" style={styles.codeLabel}>
                {t('lobby.shareCode')}
              </DecorativeTitle>
              <TouchableOpacity onPress={handleShare} activeOpacity={0.8}>
                <DecorativeTitle variant="screen" tone="gold" style={styles.codeText}>
                  {code}
                </DecorativeTitle>
              </TouchableOpacity>
              <Text style={styles.codeTap}>{t('lobby.tapToShare')}</Text>
            </View>

            <View style={styles.card}>
              <DecorativeTitle variant="eyebrow" tone="muted" align="left" style={styles.sectionLabel}>
                {t('lobby.playerCount', { count: activePlayers.length })}
              </DecorativeTitle>
              <PlayerList players={players} />
            </View>

            {isHost ? (
              <View style={styles.startBlock}>
                {activePlayers.length < 3 && <Text style={styles.hintText}>{t('errors.MIN_PLAYERS_REQUIRED')}</Text>}
                <Button onPress={handleStart} loading={starting} disabled={!canStart}>
                  {t('lobby.startGame')}
                </Button>
              </View>
            ) : (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingText}>{t('lobby.waitingForPlayers')}</Text>
              </View>
            )}

            <View style={styles.chatCard}>
              <DecorativeTitle variant="eyebrow" tone="muted" align="left" style={styles.sectionLabel}>
                {t('lobby.chat')}
              </DecorativeTitle>
              <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(message) => message.id}
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
          </View>

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
  mainContent: { flex: 1, gap: 14, padding: 16 },
  codeCard: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    letterSpacing: 2.8,
  },
  codeText: {
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: 10,
  },
  codeTap: {
    color: colors.textMuted,
    fontSize: 11,
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
    letterSpacing: 2.4,
  },
  startBlock: { gap: 8 },
  hintText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
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
    flex: 1,
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    minHeight: 120,
  },
  chatList: { flex: 1 },
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
