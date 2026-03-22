import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { DixitCard } from '@/components/ui/DixitCard'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

interface GalleryWildcardPickerProps {
  onPick: (card: GalleryCard) => void
  onClose: () => void
}

export function GalleryWildcardPicker({ onPick, onClose }: GalleryWildcardPickerProps) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const [cards, setCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadCards() {
      if (!userId) return
      setLoading(true)
      const { data } = await supabase
        .from('gallery_cards')
        .select('*')
        .eq('player_id', userId)
        .order('created_at', { ascending: false })
      setCards((data as GalleryCard[]) ?? [])
      setLoading(false)
    }

    void loadCards()
  }, [userId])

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('game.galleryWildcardTitle')}</Text>
        <Text style={styles.infoBody}>{t('game.galleryWildcardHint')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} size="large" />
      ) : cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('game.galleryWildcardEmpty')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {cards.map((card) => (
            <InteractiveCardTilt
              key={card.id}
              profileName="lite"
              regionKey="wildcard-picker"
              onPress={() => onPick(card)}
              style={styles.cardButton}
            >
              <View>
                <View style={styles.cardWrap}>
                  <DixitCard uri={card.image_url} />
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {card.title || card.prompt}
                </Text>
              </View>
            </InteractiveCardTilt>
          ))}
        </ScrollView>
      )}

      <Button variant="ghost" onPress={onClose}>
        {t('common.cancel')}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
    fontSize: 14,
    fontFamily: fonts.title,
    letterSpacing: 1,
    textAlign: 'center',
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyState: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(18, 10, 6, 0.56)',
    padding: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardButton: {
    width: '47%',
    gap: 8,
  },
  cardWrap: {
    width: '100%',
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.title,
    textAlign: 'center',
  },
})
