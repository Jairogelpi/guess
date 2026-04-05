import { View, Text, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/ui/Modal'
import { colors, fonts, radii } from '@/constants/theme'

interface EconomyExplanationModalProps {
  visible: boolean
  onClose: () => void
  corruptedCardsRemaining?: number
}

export function EconomyExplanationModal({
  visible,
  onClose,
  corruptedCardsRemaining,
}: EconomyExplanationModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      visible={visible}
      onClose={onClose}
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
  )
}

const styles = StyleSheet.create({
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
