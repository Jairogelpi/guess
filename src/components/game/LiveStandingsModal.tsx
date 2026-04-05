import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Avatar } from '@/components/ui/Avatar'
import { colors, fonts, radii } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

const MEDALS = ['🥇', '🥈', '🥉']

interface LiveStandingsModalProps {
  visible: boolean
  onClose: () => void
  players: RoomPlayer[]
  currentUserId: string | null
}

export function LiveStandingsModal({
  visible,
  onClose,
  players,
  currentUserId,
}: LiveStandingsModalProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.panel}>
          {/* Header */}
          <View style={styles.panelHeader}>
            <MaterialCommunityIcons name="trophy-outline" size={14} color={colors.gold} />
            <Text style={styles.panelTitle}>{'CLASIFICACIÓN'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.panelDivider} />

          {/* Player rows */}
          <View style={styles.list}>
            {sorted.map((p, i) => {
              const isMe = p.player_id === currentUserId
              const isLeader = i === 0
              return (
                <View
                  key={p.player_id}
                  style={[
                    styles.playerRow,
                    isLeader && styles.playerRowLeader,
                    isMe && styles.playerRowMe,
                    i < sorted.length - 1 && styles.playerRowBorder,
                  ]}
                >
                  {/* Rank */}
                  <Text style={styles.medal}>
                    {i < 3 ? MEDALS[i] : `${i + 1}`}
                  </Text>

                  {/* Avatar + name */}
                  <Avatar uri={p.profiles?.avatar_url ?? undefined} name={p.display_name} size={30} />
                  <View style={styles.nameBlock}>
                    <Text style={[styles.playerName, isLeader && styles.playerNameLeader]}
                      numberOfLines={1}>
                      {p.display_name}
                    </Text>
                    {isMe && <Text style={styles.youTag}>{'TÚ'}</Text>}
                  </View>

                  {/* Score */}
                  <Text style={[styles.playerScore, isLeader && styles.playerScoreLeader]}>
                    {p.score}
                  </Text>

                  {/* Tokens */}
                  <View style={styles.tokens}>
                    <View style={styles.token}>
                      <MaterialCommunityIcons name="cards-outline" size={10} color="rgba(244,192,119,0.6)" />
                      <Text style={styles.tokenVal}>{p.wildcards_remaining}</Text>
                    </View>
                    <View style={styles.token}>
                      <MaterialCommunityIcons name="brain" size={10} color={colors.gold} />
                      <Text style={styles.tokenVal}>{p.intuition_tokens}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 4, 2, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  panel: {
    backgroundColor: 'rgba(14, 7, 3, 0.95)',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.35)',
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  panelTitle: {
    flex: 1,
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: { padding: 4 },
  panelDivider: { height: 1.5, backgroundColor: 'rgba(230, 184, 0, 0.18)' },
  list: { paddingVertical: 4 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  playerRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(230, 184, 0, 0.08)' },
  playerRowLeader: { backgroundColor: 'rgba(124, 66, 39, 0.22)' },
  playerRowMe: { backgroundColor: 'rgba(251, 176, 36, 0.08)' },
  medal: { fontSize: 18, width: 32, textAlign: 'center' },
  nameBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  playerName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.body,
    flexShrink: 1,
  },
  playerNameLeader: { color: colors.textPrimary, fontWeight: '700' },
  youTag: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.titleHeavy,
    backgroundColor: 'rgba(230,184,0,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  playerScore: {
    color: colors.textSecondary,
    fontFamily: fonts.title,
    fontSize: 20,
    minWidth: 40,
    textAlign: 'right',
  },
  playerScoreLeader: { color: colors.gold, fontSize: 22 },
  tokens: { flexDirection: 'row', gap: 6 },
  token: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(230, 184, 0, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.12)',
  },
  tokenVal: {
    color: 'rgba(255,241,222,0.6)',
    fontSize: 12,
    fontFamily: fonts.title,
  },
})
