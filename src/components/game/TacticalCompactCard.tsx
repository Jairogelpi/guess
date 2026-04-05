import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii } from '@/constants/theme'

interface TacticalStatItem {
  text: string
  strong?: boolean
}

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  badgeText?: string
  statusTitle: string
  statusMeta?: string
  statusActive?: boolean
  stats: TacticalStatItem[]
  toggleLabel: string
  expanded: boolean
  onToggle: () => void
  summaryText?: string
  summaryHint?: string
  extraAction?: React.ReactNode
}

export function TacticalCompactCard({
  eyebrow,
  title,
  subtitle,
  badgeText,
  statusTitle,
  statusMeta,
  statusActive = false,
  stats,
  toggleLabel,
  expanded,
  onToggle,
  summaryText,
  summaryHint,
  extraAction,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.headerActions}>
          {badgeText ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          ) : null}

          <Pressable onPress={onToggle} style={styles.togglePill}>
            <Text style={styles.togglePillText}>{toggleLabel}</Text>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.goldLight}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((item, index) => (
          <Text key={`${item.text}-${index}`} style={item.strong ? styles.statsTextStrong : styles.statsText}>
            {item.text}
          </Text>
        ))}
      </View>

      <View style={[styles.statusCard, statusActive && styles.statusCardActive]}>
        <Text style={[styles.statusTitle, statusActive && styles.statusTitleActive]}>{statusTitle}</Text>
        {statusMeta ? <Text style={styles.statusMeta}>{statusMeta}</Text> : null}
      </View>

      {summaryText ? <Text style={styles.summaryText}>{summaryText}</Text> : null}
      {summaryHint ? <Text style={styles.summaryHint}>{summaryHint}</Text> : null}

      {extraAction ? <View style={styles.extraActionRow}>{extraAction}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.22)',
    backgroundColor: 'rgba(18, 10, 4, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: 'rgba(255,241,222,0.5)',
    fontFamily: fonts.titleHeavy,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.title,
    fontSize: 13,
    lineHeight: 18,
  },
  subtitle: {
    color: 'rgba(255, 241, 222, 0.62)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.title,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.26)',
    backgroundColor: 'rgba(28, 16, 8, 0.88)',
  },
  badgeText: {
    color: colors.goldLight,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.26)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(28, 16, 8, 0.88)',
  },
  togglePillText: {
    color: colors.goldLight,
    fontFamily: fonts.titleHeavy,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsText: {
    color: 'rgba(255,241,222,0.68)',
    fontFamily: fonts.title,
    fontSize: 12,
    lineHeight: 17,
  },
  statsTextStrong: {
    color: colors.gold,
    fontFamily: fonts.titleHeavy,
    fontSize: 12,
    lineHeight: 17,
  },
  statusCard: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.24)',
    backgroundColor: 'rgba(20, 12, 5, 0.86)',
  },
  statusCardActive: {
    borderColor: 'rgba(245, 201, 96, 0.56)',
  },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusTitleActive: {
    color: colors.goldLight,
  },
  statusMeta: {
    color: 'rgba(255, 241, 222, 0.68)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.title,
  },
  summaryText: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 12,
    lineHeight: 18,
  },
  summaryHint: {
    color: 'rgba(255,241,222,0.62)',
    fontFamily: fonts.title,
    fontSize: 12,
    lineHeight: 18,
  },
  extraActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
})
