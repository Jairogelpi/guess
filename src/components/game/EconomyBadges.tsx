import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  intuitionTokens: number
  wildcardsLeft: number
  generationTokens: number
  corruptedCardsRemaining?: number
}

function Badge({
  icon,
  value,
  label,
  accent,
  onPress,
}: {
  icon: string
  value: number
  label: string
  accent?: string
  onPress: () => void
}) {
  const color = accent ?? 'rgba(230, 184, 0, 0.7)'
  return (
    <Pressable onPress={onPress} style={styles.badge}>
      <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      <Text style={[styles.badgeValue, { color }]}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </Pressable>
  )
}

export function EconomyBadges({
  intuitionTokens,
  wildcardsLeft,
  generationTokens,
  corruptedCardsRemaining,
}: Props) {
  const { t } = useTranslation()
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <>
      <View style={styles.container}>
        <Badge
          icon="brain"
          value={intuitionTokens}
          label={t('game.intuition', { defaultValue: 'INT' })}
          accent={colors.gold}
          onPress={() => setShowExplanation(true)}
        />
        <View style={styles.divider} />
        <Badge
          icon="cards-outline"
          value={wildcardsLeft}
          label={t('game.wildcards', { defaultValue: 'WILD' })}
          onPress={() => setShowExplanation(true)}
        />
        <View style={styles.divider} />
        <Badge
          icon="auto-fix"
          value={generationTokens}
          label={t('game.gen', { defaultValue: 'GEN' })}
          onPress={() => setShowExplanation(true)}
        />
        {corruptedCardsRemaining !== undefined && (
          <>
            <View style={styles.divider} />
            <Badge
              icon="skull-outline"
              value={corruptedCardsRemaining}
              label={t('game.corrupt', { defaultValue: 'COR' })}
              accent="rgba(185, 28, 28, 0.8)"
              onPress={() => setShowExplanation(true)}
            />
          </>
        )}
      </View>

      <Modal
        visible={showExplanation}
        onClose={() => setShowExplanation(false)}
        title={t('game.economy.title', { defaultValue: 'ECONOMÍA DEL JUEGO' })}
      >
        <View style={styles.explanation}>
          <View style={styles.explanationItem}>
            <View style={[styles.explanationIcon, { backgroundColor: 'rgba(230, 184, 0, 0.1)' }]}>
              <MaterialCommunityIcons name="brain" size={20} color={colors.gold} />
            </View>
            <View style={styles.explanationText}>
              <Text style={styles.explanationTitle}>{t('game.economy.intuitionTitle', { defaultValue: 'Intuición (INT)' })}</Text>
              <Text style={styles.explanationBody}>{t('game.economy.intuitionBody', { defaultValue: 'Se usa para activar habilidades tácticas. Se gana acertando la carta del narrador o cuando otros fallan.' })}</Text>
            </View>
          </View>

          <View style={styles.explanationItem}>
            <View style={[styles.explanationIcon, { backgroundColor: 'rgba(230, 184, 0, 0.1)' }]}>
              <MaterialCommunityIcons name="cards-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.explanationText}>
              <Text style={styles.explanationTitle}>{t('game.economy.wildcardsTitle', { defaultValue: 'Wildcards (WILD)' })}</Text>
              <Text style={styles.explanationBody}>{t('game.economy.wildcardsBody', { defaultValue: 'Comodines especiales para generar cartas con prompts personalizados de alta precisión.' })}</Text>
            </View>
          </View>

          <View style={styles.explanationItem}>
            <View style={[styles.explanationIcon, { backgroundColor: 'rgba(230, 184, 0, 0.1)' }]}>
              <MaterialCommunityIcons name="auto-fix" size={20} color={colors.gold} />
            </View>
            <View style={styles.explanationText}>
              <Text style={styles.explanationTitle}>{t('game.economy.genTitle', { defaultValue: 'Generación (GEN)' })}</Text>
              <Text style={styles.explanationBody}>{t('game.economy.genBody', { defaultValue: 'Tokens necesarios para generar nuevas imágenes por IA. Se agotan con cada uso.' })}</Text>
            </View>
          </View>

          {corruptedCardsRemaining !== undefined && (
            <View style={styles.explanationItem}>
              <View style={[styles.explanationIcon, { backgroundColor: 'rgba(185, 28, 28, 0.08)' }]}>
                <MaterialCommunityIcons name="skull-outline" size={20} color="rgba(185, 28, 28, 0.8)" />
              </View>
              <View style={styles.explanationText}>
                <Text style={styles.explanationTitle}>{t('game.economy.corruptTitle', { defaultValue: 'Corrupción (COR)' })}</Text>
                <Text style={styles.explanationBody}>{t('game.economy.corruptBody', { defaultValue: 'Habilidades oscuras que permiten sabotear a otros jugadores o manipular el tablero.' })}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 8, 4, 0.65)',
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.1)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  badgeValue: {
    fontSize: 13,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.3,
  },
  badgeLabel: {
    fontSize: 8,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    color: 'rgba(255, 241, 222, 0.3)',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
  },
  explanation: {
    gap: 20,
    paddingVertical: 10,
  },
  explanationItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  explanationIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
  },
  explanationText: {
    flex: 1,
    gap: 4,
  },
  explanationTitle: {
    color: colors.goldLight,
    fontSize: 14,
    fontFamily: fonts.titleHeavy,
  },
  explanationBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.title,
  },
})
