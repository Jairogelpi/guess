import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button } from '@/components/ui/Button'
import { TacticalActionSheet } from '@/components/game/TacticalActionSheet'
import {
  getChallengeLeaderState,
  getPhaseTacticalActions,
  getPrimaryTacticalHelperReason,
  getSoloLeaderIdFromScores,
  type ChallengeLeaderState,
  type TacticalActionId,
  type TacticalActionState,
  type TacticalPhase,
} from '@/lib/tacticalActions'
import { colors, fonts, radii } from '@/constants/theme'

interface TacticalActionPickerProps {
  phase: TacticalPhase
  selectionActive: boolean
  intuitionTokens: number
  isPhaseOwner: boolean
  playerId: string
  players: Array<{ player_id: string; score: number }>
  challengeLeaderUsed: boolean
  corruptedCardsRemaining: number
  selectedAction: TacticalActionId | null
  selectedChallengeLeader: boolean
  onSelectAction: (action: TacticalActionId | null) => void
  onSelectChallengeLeader: (selected: boolean) => void
}

function isChallengeState(
  state: TacticalActionState | ChallengeLeaderState | null,
): state is ChallengeLeaderState {
  return state?.id === 'challenge_leader'
}

export function TacticalActionPicker({
  phase,
  selectionActive,
  intuitionTokens,
  isPhaseOwner,
  playerId,
  players,
  challengeLeaderUsed,
  corruptedCardsRemaining,
  selectedAction,
  selectedChallengeLeader,
  onSelectAction,
  onSelectChallengeLeader,
}: TacticalActionPickerProps) {
  const { t } = useTranslation()
  const [detailState, setDetailState] = useState<TacticalActionState | ChallengeLeaderState | null>(null)

  const phaseActions = useMemo(
    () =>
      getPhaseTacticalActions({
        phase,
        selectionActive,
        intuitionTokens,
        isPhaseOwner,
        corruptedCardsRemaining,
      }),
    [phase, selectionActive, intuitionTokens, isPhaseOwner, corruptedCardsRemaining],
  )

  const challengeLeaderState = useMemo(
    () =>
      getChallengeLeaderState({
        selectionActive,
        intuitionTokens,
        playerId,
        soloLeaderId: getSoloLeaderIdFromScores(players),
        challengeLeaderUsed,
      }),
    [selectionActive, intuitionTokens, playerId, players, challengeLeaderUsed],
  )

  const selectedActionDefinition = phaseActions.find((action) => action.id === selectedAction) ?? null
  const primaryHelperReasonKey = getPrimaryTacticalHelperReason(phaseActions, challengeLeaderState)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t('game.tactics.eyebrow')}</Text>
          <Text style={styles.title}>{t('game.tactics.title')}</Text>
        </View>
        <View style={styles.tokenPill}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={colors.gold} />
          <Text style={styles.tokenText}>
            {t('game.tactics.intuitionTokens', { count: intuitionTokens })}
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {phaseActions.map((action) => {
          const selected = selectedAction === action.id
          const blocked = !action.enabled
          return (
            <Pressable
              key={action.id}
              onPress={() => setDetailState(action)}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                blocked && styles.chipBlocked,
              ]}
            >
              <MaterialCommunityIcons
                name={action.icon as never}
                size={16}
                color={selected ? '#0a0602' : blocked ? 'rgba(255,241,222,0.4)' : colors.gold}
              />
              <Text
                style={[
                  styles.chipText,
                  selected && styles.chipTextSelected,
                  blocked && styles.chipTextBlocked,
                ]}
              >
                {t(action.nameKey)}
              </Text>
              {action.costTokens > 0 && (
                <View style={[styles.costTag, selected && styles.costTagSelected]}>
                  <Text style={[styles.costTagText, selected && styles.costTagTextSelected]}>
                    {action.costTokens}
                  </Text>
                </View>
              )}
            </Pressable>
          )
        })}
        <Pressable
          onPress={() => setDetailState(challengeLeaderState)}
          style={[
            styles.chip,
            styles.challengeChip,
            selectedChallengeLeader && styles.challengeChipSelected,
            !challengeLeaderState.enabled && styles.challengeChipBlocked,
          ]}
        >
          <MaterialCommunityIcons
            name={challengeLeaderState.icon as never}
            size={16}
            color={
              selectedChallengeLeader
                ? '#0a0602'
                : challengeLeaderState.enabled
                  ? colors.gold
                  : 'rgba(255,241,222,0.4)'
            }
          />
          <Text
            style={[
              styles.challengeText,
              selectedChallengeLeader && styles.challengeTextSelected,
              !challengeLeaderState.enabled && styles.chipTextBlocked,
            ]}
          >
            {t(challengeLeaderState.nameKey)}
          </Text>
        </Pressable>
      </View>

      {primaryHelperReasonKey ? (
        <View style={styles.helperRow}>
          <MaterialCommunityIcons
            name="information-outline"
            size={14}
            color="rgba(255, 241, 222, 0.56)"
          />
          <Text style={styles.helperText}>{t(primaryHelperReasonKey)}</Text>
        </View>
      ) : null}

      {(selectedActionDefinition || selectedChallengeLeader) && (
        <View style={styles.summary}>
          {selectedActionDefinition && (
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons
                name={selectedActionDefinition.icon as never}
                size={14}
                color={colors.gold}
              />
              <Text style={styles.summaryText}>
                {t('game.tactics.selectedAction', {
                  name: t(selectedActionDefinition.nameKey),
                })}
              </Text>
            </View>
          )}
          {selectedChallengeLeader && (
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="sword-cross" size={14} color={colors.gold} />
              <Text style={styles.summaryText}>{t('game.tactics.challengeLeaderSelected')}</Text>
            </View>
          )}
          <Button
            variant="ghost"
            onPress={() => {
              onSelectAction(null)
              onSelectChallengeLeader(false)
            }}
            style={styles.clearButton}
            contentStyle={styles.clearButtonContent}
            textStyle={styles.clearButtonText}
          >
            {t('game.tactics.clearSelection')}
          </Button>
        </View>
      )}

      <TacticalActionSheet
        visible={detailState !== null}
        detailState={detailState}
        onClose={() => setDetailState(null)}
        onConfirm={() => {
          if (!detailState?.enabled) {
            setDetailState(null)
            return
          }

          if (isChallengeState(detailState)) {
            onSelectChallengeLeader(true)
          } else {
            onSelectAction(detailState.id)
          }
          setDetailState(null)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    backgroundColor: 'rgba(20, 12, 5, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.24)',
    borderRadius: radii.xl,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  eyebrow: {
    color: 'rgba(255, 241, 222, 0.45)',
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.titleHeavy,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(230, 184, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.24)',
  },
  tokenText: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radii.full,
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
  },
  chipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.goldLight,
  },
  chipBlocked: {
    backgroundColor: 'rgba(255, 241, 222, 0.05)',
    borderColor: 'rgba(255, 241, 222, 0.1)',
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chipTextSelected: {
    color: '#0a0602',
  },
  chipTextBlocked: {
    color: 'rgba(255, 241, 222, 0.46)',
  },
  challengeChip: {
    backgroundColor: 'rgba(255, 122, 0, 0.08)',
    borderColor: 'rgba(255, 152, 0, 0.28)',
  },
  challengeChipSelected: {
    backgroundColor: 'rgba(255, 188, 71, 0.95)',
    borderColor: '#ffd27d',
  },
  challengeChipBlocked: {
    backgroundColor: 'rgba(255, 241, 222, 0.05)',
    borderColor: 'rgba(255, 241, 222, 0.1)',
  },
  challengeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  challengeTextSelected: {
    color: '#0a0602',
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 18,
  },
  helperText: {
    color: 'rgba(255, 241, 222, 0.56)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.title,
  },
  summary: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(230, 184, 0, 0.12)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: fonts.title,
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  clearButtonContent: {
    minHeight: 0,
  },
  clearButtonText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  costTag: {
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.3)',
  },
  costTagSelected: {
    backgroundColor: 'rgba(10, 6, 2, 0.2)',
    borderColor: 'rgba(10, 6, 2, 0.3)',
  },
  costTagText: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
  },
  costTagTextSelected: {
    color: '#0a0602',
  },
})
