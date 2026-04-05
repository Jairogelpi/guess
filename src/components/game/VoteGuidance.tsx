import { memo } from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'

interface VoteSelectionStatus {
  title: string
  body: string
  hint?: string
  iconName: string
  iconColor: string
  pending: boolean
  committed: boolean
}

interface Props {
  steps: [string, string, string]
  status: VoteSelectionStatus
}

export const VoteGuidance = memo(function VoteGuidance({ steps, status }: Props) {
  return (
    <>
      <View style={styles.quickGuide}>
        {steps.map((stepText, index) => (
          <View key={`${index + 1}-${stepText}`} style={styles.quickGuideStep}>
            <Text style={styles.quickGuideStepNumber}>{index + 1}</Text>
            <Text style={styles.quickGuideStepText}>{stepText}</Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.selectionStatus,
          status.pending && styles.selectionStatusPending,
          status.committed && styles.selectionStatusCommitted,
        ]}
      >
        <View style={styles.selectionStatusHeader}>
          <MaterialCommunityIcons name={status.iconName as never} size={16} color={status.iconColor} />
          <Text style={styles.selectionStatusTitle}>{status.title}</Text>
        </View>

        <Text style={styles.selectionStatusBody} numberOfLines={2}>
          {status.body}
        </Text>

        {status.hint ? <Text style={styles.selectionStatusHint}>{status.hint}</Text> : null}
      </View>
    </>
  )
})

const styles = StyleSheet.create({
  quickGuide: {
    gap: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.2)',
    backgroundColor: 'rgba(19, 11, 5, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickGuideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  quickGuideStepNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'rgba(245, 201, 96, 0.2)',
    color: colors.gold,
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: fonts.titleHeavy,
  },
  quickGuideStepText: {
    flex: 1,
    color: 'rgba(255, 241, 222, 0.78)',
    fontFamily: fonts.title,
    fontSize: 12,
    lineHeight: 17,
  },
  selectionStatus: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.24)',
    backgroundColor: 'rgba(20, 12, 5, 0.86)',
  },
  selectionStatusPending: {
    borderColor: 'rgba(255, 179, 92, 0.78)',
    backgroundColor: 'rgba(30, 14, 4, 0.92)',
  },
  selectionStatusCommitted: {
    borderColor: 'rgba(245, 201, 96, 0.56)',
  },
  selectionStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionStatusTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.titleHeavy,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  selectionStatusBody: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 13,
    lineHeight: 19,
  },
  selectionStatusHint: {
    color: 'rgba(255, 241, 222, 0.66)',
    fontFamily: fonts.title,
    fontSize: 12,
    lineHeight: 17,
  },
})
