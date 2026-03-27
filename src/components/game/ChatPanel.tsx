/**
 * Self-contained lobby chat panel.
 * Manages its own subscription, message state, and send logic.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { colors, fonts } from '@/constants/theme'
import { getChatPlayerAccent } from '@/lib/chatPlayerAccent'
import { LobbyChatMessage } from '@/components/game/LobbyChatMessage'
import type { LobbyMessage, Profile, RoomPlayer } from '@/types/game'

interface Props {
  roomId: string
  roomStatus: string
  currentPlayer: RoomPlayer | null
  players: RoomPlayer[]
}

export function ChatPanel({ roomId, roomStatus, currentPlayer, players }: Props) {
  const { t } = useTranslation()
  const scrollRef = useRef<ScrollView>(null)
  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({})
  const [chatText, setChatText] = useState('')
  const [sending, setSending] = useState(false)
  const profilesByIdRef = useRef<Record<string, Profile>>({})

  useEffect(() => {
    profilesByIdRef.current = profilesById
  }, [profilesById])

  const hydrateProfiles = useCallback(async (playerIds: string[]) => {
    const uniqueIds = [...new Set(playerIds)].filter(Boolean)
    const missingIds = uniqueIds.filter((playerId) => !(playerId in profilesByIdRef.current))
    if (missingIds.length === 0) return

    const { data } = await supabase
      .from('profiles')
      .select('id, avatar_url, display_name, updated_at')
      .in('id', missingIds)

    if (!data?.length) return

    setProfilesById((prev) => {
      const next = { ...prev }
      for (const profile of data as Profile[]) next[profile.id] = profile
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    setMessages([])

    supabase
      .from('lobby_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled || !data) return
        const nextMessages = data as LobbyMessage[]
        setMessages(nextMessages)
        void hydrateProfiles(nextMessages.map((message) => message.player_id))
      })

    const sub = supabase
      .channel(`lobby-chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const nextMessage = payload.new as LobbyMessage
          setMessages((prev) => [...prev, nextMessage])
          void hydrateProfiles([nextMessage.player_id])
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(sub)
    }
  }, [hydrateProfiles, roomId])

  useEffect(() => {
    void hydrateProfiles([
      ...players.map((player) => player.player_id),
      ...messages.map((message) => message.player_id),
    ])
  }, [hydrateProfiles, messages, players])

  async function sendMessage() {
    if (!chatText.trim() || !currentPlayer || sending) return
    if (roomStatus !== 'lobby') return

    setSending(true)
    try {
      await supabase.from('lobby_messages').insert({
        room_id: roomId,
        player_id: currentPlayer.player_id,
        sender_name: currentPlayer.display_name,
        text: chatText.trim(),
      })
      setChatText('')
    } finally {
      setSending(false)
    }
  }

  const renderItem = useCallback(({ item }: { item: LobbyMessage }) => {
    const isOwn = item.player_id === currentPlayer?.player_id
    const accent = getChatPlayerAccent(item.player_id)
    const profile = profilesById[item.player_id]

    return (
      <LobbyChatMessage
        key={item.id}
        message={item}
        isOwn={isOwn}
        avatarUrl={profile?.avatar_url}
        accent={accent}
      />
    )
  }, [currentPlayer?.player_id, profilesById])

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{t('lobby.chat')}</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {messages.map((item) => renderItem({ item }))}
      </ScrollView>
      {roomStatus === 'lobby' && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.field}
            placeholder={t('lobby.messagePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={chatText}
            onChangeText={setChatText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            maxLength={200}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            disabled={sending}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 18,
    padding: 16,
    gap: 10,
    minHeight: 180,
  },
  sectionLabel: {
    color: colors.goldDim,
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: fonts.titleHeavy,
    textTransform: 'uppercase',
  },
  list: {
    minHeight: 96,
    maxHeight: 240,
  },
  listContent: {
    gap: 2,
    paddingBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  field: {
    flex: 1,
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  sendBtn: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
})
