import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { ChallengeLeaderState, TacticalActionState } from '@/lib/tacticalActions'
import { colors, fonts, radii } from '@/constants/theme'

interface TacticalActionSheetProps {
  visible: boolean
  detailState: TacticalActionState | ChallengeLeaderState | null
  onClose: () => void
  onConfirm: () => void
}

export function TacticalActionSheet({
  visible,
  detailState,
  onClose,
  onConfirm,
}: TacticalActionSheetProps) {
  const { t } = useTranslation()
  if (!detailState) return null

  return (
    <Modal visible={visible} onClose={onClose} title={t('game.tactics.sheetTitle')}>
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={detailState.icon as never} size={22} color={colors.gold} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.title}>{t(detailState.nameKey)}</Text>
          <Text style={styles.short}>{t(detailState.shortDescriptionKey)}</Text>
        </View>
      </View>

      {detailState.costTokens > 0 && (
        <View style={styles.costPill}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={colors.gold} />
          <Text style={styles.costText}>
            {t('game.tactics.costIntuition', { count: detailState.costTokens })}
          </Text>
        </View>
      )}

      {!detailState.enabled && detailState.disabledReasonKey && (
        <View style={styles.blockedPill}>
          <MaterialCommunityIcons name="lock-outline" size={14} color="#ffcf88" />
          <Text style={styles.blockedText}>{t(detailState.disabledReasonKey)}</Text>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t('game.tactics.detailLabel')}</Text>
        <Text style={styles.body}>{t(detailState.detailKey)}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t('game.tactics.rewardLabel')}</Text>
        <Text style={styles.body}>{t(detailState.rewardKey)}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>{t('game.tactics.riskLabel')}</Text>
        <Text style={styles.body}>{t(detailState.riskKey)}</Text>
      </View>

      <Button onPress={onConfirm} disabled={!detailState.enabled}>
        {detailState.id === 'challenge_leader'
          ? t('game.tactics.activateChallenge')
          : t('game.tactics.useThisTactic')}
      </Button>
    </Modal>
  )
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.26)',
  },
  heroText: { flex: 1, gap: 4 },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: fonts.titleHeavy,
  },
  short: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.title,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.25)',
  },
  costText: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  blockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255, 122, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 71, 0.26)',
  },
  blockedText: {
    flex: 1,
    color: '#ffe1bf',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.title,
  },
  block: { gap: 6 },
  blockTitle: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.title,
  },
})
