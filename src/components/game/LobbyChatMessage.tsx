import { StyleSheet, Text, View } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { colors } from '@/constants/theme'
import type { LobbyMessage } from '@/types/game'

interface Props {
  message: LobbyMessage
  isOwn: boolean
  avatarUrl?: string | null
  accent: {
    ringColor: string
    nameColor: string
    bubbleBorderColor: string
  }
}

export function LobbyChatMessage({ message, isOwn, avatarUrl, accent }: Props) {
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <Avatar
          uri={avatarUrl}
          name={message.sender_name}
          size={32}
          borderColor={accent.ringColor}
          textColor={accent.nameColor}
        />
      )}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
          { borderColor: isOwn ? colors.goldBorderSubtle : accent.bubbleBorderColor },
        ]}
      >
        {!isOwn && (
          <Text style={[styles.sender, { color: accent.nameColor }]}>{message.sender_name}</Text>
        )}
        <Text style={styles.text}>{message.text}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingVertical: 5,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  ownBubble: {
    backgroundColor: 'rgba(90, 47, 27, 0.72)',
    borderTopRightRadius: 8,
  },
  otherBubble: {
    backgroundColor: 'rgba(40, 20, 14, 0.8)',
    borderTopLeftRadius: 8,
  },
  sender: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
  },
})
