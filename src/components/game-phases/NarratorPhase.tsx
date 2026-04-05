import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNarratorPhaseState } from '@/hooks/useNarratorPhaseState'
import { CardGenerator } from '@/components/game/CardGenerator'
import { NarratorSelectedCardFlow } from '@/components/game/NarratorSelectedCardFlow'
import { colors, fonts, radii, shadows } from '@/constants/theme'

interface Props {
  roomCode: string
  wildcardsRemaining: number
  intuitionTokens: number
  challengeLeaderUsed: boolean
  allPlayers: Array<{ player_id: string; score: number }>
}

export function NarratorPhase({
  roomCode,
  wildcardsRemaining,
  intuitionTokens,
  challengeLeaderUsed,
  allPlayers,
}: Props) {
  const { t } = useTranslation()
  const {
    userId,
    round,
    selectedCard,
    setSelectedCard,
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
    handleSelectCard,
    handleSelectGalleryCard,
    handleSubmitClue,
  } = useNarratorPhaseState({
    roomCode,
    intuitionTokens,
    challengeLeaderUsed,
    allPlayers,
    t,
  })

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('game.yourTurn')} - {t('game.narrator')}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.narratorIntro')}</Text>
        <Text style={styles.infoBody}>
          {!selectedCard ? t('game.narratorSelectHint') : t('game.narratorClueHint')}
        </Text>
      </View>

      {!selectedCard ? (
        <CardGenerator
          scope="round"
          roomCode={roomCode}
          roundId={round?.id}
          wildcardsRemaining={wildcardsRemaining}
          onSelect={handleSelectCard}
          onSelectGalleryCard={handleSelectGalleryCard}
        />
      ) : (
        <NarratorSelectedCardFlow
          t={t}
          selectedCard={selectedCard}
          clue={clue}
          setClue={setClue}
          submitting={submitting}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          challengeLeader={challengeLeader}
          setChallengeLeader={setChallengeLeader}
          tacticsExpanded={tacticsExpanded}
          setTacticsExpanded={setTacticsExpanded}
          challengeLeaderState={challengeLeaderState}
          tacticActive={tacticActive}
          totalTacticalCost={totalTacticalCost}
          intuitionAfterSubmit={intuitionAfterSubmit}
          tacticStatusText={tacticStatusText}
          submitSummaryText={submitSummaryText}
          intuitionTokens={intuitionTokens}
          userId={userId}
          allPlayers={allPlayers}
          challengeLeaderUsed={challengeLeaderUsed}
          wildcardsRemaining={wildcardsRemaining}
          handleSubmitClue={handleSubmitClue}
          setSelectedCard={setSelectedCard}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { gap: 20, padding: 16 },
  badge: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  badgeText: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.title,
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(18, 10, 6, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 8,
    ...shadows.surface,
  },
  infoTitle: {
    color: colors.goldLight,
    fontSize: 15,
    fontFamily: fonts.title,
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
