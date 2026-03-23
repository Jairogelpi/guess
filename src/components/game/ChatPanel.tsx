/**
 * Self-contained lobby chat panel.
 * Manages its own subscription, message state, and send logic.
 * Extracted from lobby.tsx to keep that screen focused on room/player coordination.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/theme'
import type { LobbyMessage, RoomPlayer } from '@/types/game'

interface Props {
  roomId: string
  roomStatus: string
  currentPlayer: RoomPlayer | null
}

export function ChatPanel({ roomId, roomStatus, currentPlayer }: Props) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [chatText, setChatText] = useState('')
  const [sending, setSending] = useState(false)
  const flatRef = useRef<FlatList>(null)

  useEffect(() => {
    supabase
      .from('lobby_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data as LobbyMessage[]) })

    const sub = supabase
      .channel(`lobby-chat:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'lobby_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as LobbyMessage])
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [roomId])

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
    if (!item) return null
    return (
      <View style={styles.message}>
        <Text style={styles.sender}>{item.sender_name ?? ''}</Text>
        <Text style={styles.text}>{item.text ?? ''}</Text>
      </View>
    )
  }, [])

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{t('lobby.chat')}</Text>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={styles.list}
        renderItem={renderItem}
      />
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
            style={[styles.sendBtn, sending && { opacity: 0.5 }]}
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
    borderRadius: 16,
    padding: 16,
    gap: 10,
    minHeight: 120,
    opacity: 0.85,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  list: { minHeight: 80, maxHeight: 200 },
  message: { paddingVertical: 4 },
  sender: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
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
})
