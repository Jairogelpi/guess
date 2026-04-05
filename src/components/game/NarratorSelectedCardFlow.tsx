import { memo } from 'react'
import type { TFunction } from 'i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TacticalCompactCard } from '@/components/game/TacticalCompactCard'
import { TacticalActionPicker } from '@/components/game/TacticalActionPicker'
import { DixitCard } from '@/components/ui/DixitCard'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { HandActionDock } from '@/components/game/HandActionDock'
import { deriveHandActionDockState } from '@/components/game/handActionState'
import type { HydratedHandSlot } from '@/components/game/handActionState'
import type { TacticalActionId } from '@/lib/tacticalActions'
import type { SelectedNarratorCard } from '@/hooks/useNarratorPhaseState'
import { colors, fonts, radii } from '@/constants/theme'

interface ChallengeLeaderStateLike {
  enabled: boolean
  disabledReasonKey: string | null
}

type Translate = TFunction

interface Props {
  t: Translate
  selectedCard: SelectedNarratorCard
  clue: string
  setClue: (value: string) => void
  submitting: boolean
  selectedAction: TacticalActionId | null
  setSelectedAction: (action: TacticalActionId | null) => void
  challengeLeader: boolean
  setChallengeLeader: (value: boolean) => void
  tacticsExpanded: boolean
  setTacticsExpanded: (updater: (prev: boolean) => boolean) => void
  challengeLeaderState: ChallengeLeaderStateLike
  tacticActive: boolean
  totalTacticalCost: number
  intuitionAfterSubmit: number
  tacticStatusText: string
  submitSummaryText: string
  intuitionTokens: number
  userId: string | undefined
  allPlayers: Array<{ player_id: string; score: number }>
  challengeLeaderUsed: boolean
  wildcardsRemaining: number
  handleSubmitClue: () => void
  setSelectedCard: (card: SelectedNarratorCard | null) => void
}

export const NarratorSelectedCardFlow = memo(function NarratorSelectedCardFlow({
  t,
  selectedCard,
  clue,
  setClue,
  submitting,
  selectedAction,
  setSelectedAction,
  challengeLeader,
  setChallengeLeader,
  tacticsExpanded,
  setTacticsExpanded,
  challengeLeaderState,
  tacticActive,
  totalTacticalCost,
  intuitionAfterSubmit,
  tacticStatusText,
  submitSummaryText,
  intuitionTokens,
  userId,
  allPlayers,
  challengeLeaderUsed,
  wildcardsRemaining,
  handleSubmitClue,
  setSelectedCard,
}: Props) {
  return (
    <View style={styles.selectedFlow}>
      <View style={styles.cardFloatArea}>
        <InteractiveCardTilt
          profileName="hero"
          regionKey="narrator-selected"
          style={styles.selectedCardTilt}
          floating
        >
          <DixitCard uri={selectedCard.imageUrl} interactive={false} />
        </InteractiveCardTilt>
      </View>

      <View style={styles.selectedFormContent}>
        <View style={styles.clueComposer}>
          <Text style={styles.clueComposerTitle}>{t('game.writeClue')}</Text>
          <Text style={styles.selectedHint}>{t('game.narratorClueHelp')}</Text>
        </View>
        {selectedCard.kind === 'gallery' && (
          <Text style={styles.wildcardHint}>{t('game.wildcardSpendHint')}</Text>
        )}

        <Input
          value={clue}
          onChangeText={setClue}
          placeholder={t('game.cluePlaceholder')}
          maxLength={100}
        />

        <View style={styles.tacticsSection}>
          <TacticalCompactCard
            eyebrow={t('game.tactics.launcher.eyebrow')}
            title={t('game.tactics.launcher.title')}
            subtitle={t('game.narratorTacticsOptional', { defaultValue: 'Opcional antes de enviar la pista' })}
            badgeText={t('game.tactics.intuitionTokens', { count: intuitionTokens })}
            statusTitle={
              tacticActive
                ? t('game.tactics.selected', { defaultValue: 'TACTICA ACTIVA' })
                : t('game.tactics.noneSelected', { defaultValue: 'SIN TACTICA' })
            }
            statusMeta={`${tacticStatusText} ${submitSummaryText}`}
            statusActive={tacticActive}
            stats={[
              { text: t('game.tacticsCost', { defaultValue: 'Costo: {{value}}', value: totalTacticalCost }) },
              {
                text: t('game.tacticsRemaining', { defaultValue: 'Quedan: {{value}}', value: intuitionAfterSubmit }),
                strong: true,
              },
            ]}
            toggleLabel={
              tacticsExpanded
                ? t('game.hideTactics', { defaultValue: 'Ocultar tacticas' })
                : t('game.showTactics', { defaultValue: 'Ver tacticas' })
            }
            expanded={tacticsExpanded}
            onToggle={() => setTacticsExpanded((value) => !value)}
            summaryHint={
              challengeLeader && !challengeLeaderState.enabled
                ? t(challengeLeaderState.disabledReasonKey ?? '')
                : undefined
            }
            extraAction={
              tacticActive ? (
                <Button
                  onPress={() => {
                    setSelectedAction(null)
                    setChallengeLeader(false)
                  }}
                  variant="ghost"
                  style={styles.tacticsClear}
                  textStyle={styles.tacticsClearText}
                >
                  {t('game.tactics.clearSelection')}
                </Button>
              ) : undefined
            }
          />

          {(tacticsExpanded || selectedAction || challengeLeader) && (
            <TacticalActionPicker
              phase="narrator_turn"
              selectionActive
              intuitionTokens={intuitionTokens}
              isPhaseOwner
              playerId={userId ?? ''}
              players={allPlayers}
              challengeLeaderUsed={challengeLeaderUsed}
              corruptedCardsRemaining={0}
              selectedAction={selectedAction}
              selectedChallengeLeader={challengeLeader}
              showHeader={false}
              onSelectAction={setSelectedAction}
              onSelectChallengeLeader={setChallengeLeader}
            />
          )}
        </View>

        <HandActionDock
          state={deriveHandActionDockState({
            phase: 'narrator_turn',
            focusedSlot: {
              slotIndex: 0,
              kind: 'filled',
              cardId: selectedCard.kind === 'generated' ? selectedCard.cardId : null,
              imageUri: selectedCard.imageUrl,
              galleryCardId: selectedCard.kind === 'gallery' ? selectedCard.galleryCardId : null,
            } satisfies HydratedHandSlot,
            hasFreeGeneration: false,
            generationTokens: 0,
            generating: submitting,
          })}
          promptValue={clue}
          onPromptChange={setClue}
          onSuggestPrompt={() => {}}
          onUseWildcard={() => {}}
          onPrimaryAction={handleSubmitClue}
          onGenerate={() => {}}
          wildcardsLeft={wildcardsRemaining}
          generationTokens={0}
          generating={submitting}
        />
        <View style={styles.secondaryActionWrap}>
          <Button
            onPress={() => setSelectedCard(null)}
            variant="ghost"
            style={styles.changeCardButton}
            textStyle={styles.changeCardButtonText}
          >
            {t('game.changeCard')}
          </Button>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  selectedFlow: {
    gap: 16,
  },
  cardFloatArea: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  selectedCardTilt: {
    width: '52%',
    alignSelf: 'center',
  },
  selectedFormContent: { gap: 16, padding: 16 },
  clueComposer: {
    gap: 8,
    alignItems: 'center',
  },
  clueComposerTitle: {
    color: colors.goldLight,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fonts.title,
    letterSpacing: 1,
    textAlign: 'center',
  },
  selectedHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  wildcardHint: {
    color: colors.goldLight,
    fontSize: 12,
    textAlign: 'center',
  },
  tacticsSection: {
    gap: 12,
  },
  tacticsClear: {
    minWidth: 120,
    opacity: 0.95,
  },
  tacticsClearText: {
    color: 'rgba(255, 214, 191, 0.82)',
  },
  secondaryActionWrap: {
    alignItems: 'center',
    paddingTop: 4,
  },
  changeCardButton: {
    minWidth: 180,
    opacity: 0.96,
  },
  changeCardButtonText: {
    color: '#ffe8c8',
  },
})
