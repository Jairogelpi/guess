import { useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useGallery } from '@/hooks/useGallery'
import { CardGenerator } from '@/components/game/CardGenerator'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { AppHeader } from '@/components/layout/AppHeader'
import { hasGalleryCapacity, MAX_GALLERY_CARDS, remainingGallerySlots } from '@/lib/galleryRules'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

export default function GalleryScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    userId, isAnon, avatarUrl,
    cards, loading,
    showModal, setShowModal,
    pendingCard, setPendingCard,
    title, setTitle,
    saving, saveToGallery, handleSelect,
    selectedCard, setSelectedCard,
    editingTitle, setEditingTitle,
    titleSaving, avatarSaving,
    saveSelectedTitle, setAsAvatar, deleteCard,
  } = useGallery()

  const renderCard = useCallback(({ item }: { item: GalleryCard }) => {
    const isCurrentAvatar = avatarUrl === item.image_url

    return (
      <InteractiveCardTilt
        profileName="lite"
        regionKey="gallery-grid"
        style={styles.card}
        onPress={() => {
          setSelectedCard(item)
          setEditingTitle(item.title ?? '')
        }}
        onLongPress={() => deleteCard(item.id)}
        testID={`gallery-card-${item.id}`}
      >
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />

        {isCurrentAvatar && (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{t('gallery.currentAvatar')}</Text>
          </View>
        )}

        {item.title && (
          <View style={styles.cardLabel}>
            <Text style={styles.cardLabelText} numberOfLines={1}>{item.title}</Text>
          </View>
        )}
      </InteractiveCardTilt>
    )
  }, [avatarUrl, t, deleteCard, setSelectedCard, setEditingTitle])

  if (loading) {
    return (
      <>
        <AppHeader title={t('gallery.title')} />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </>
    )
  }

  return (
    <>
      <AppHeader title={t('gallery.title')} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cards-outline" size={48} color={colors.gold} style={{ opacity: 0.8 }} />
            <Text style={styles.emptyText}>{t('gallery.noCards')}</Text>
            <Text style={styles.capacityText}>{t('gallery.capacity', { count: MAX_GALLERY_CARDS })}</Text>
            <Button onPress={() => setShowModal(true)}>{t('gallery.generate')}</Button>
          </View>
        ) : (
          <FlatList
            data={cards}
            keyExtractor={(c) => c.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            renderItem={renderCard}
            ListHeaderComponent={
              <Text style={styles.capacityText}>
                {t('gallery.slotsRemaining', { count: remainingGallerySlots(cards.length), max: MAX_GALLERY_CARDS })}
              </Text>
            }
            ListFooterComponent={
              <Button
                onPress={() => setShowModal(true)}
                variant="ghost"
                style={styles.footerBtn}
                disabled={!hasGalleryCapacity(cards.length)}
              >
                {t('gallery.generate')}
              </Button>
            }
          />
        )}

        {/* Generate & save modal */}
        <Modal
          visible={showModal}
          onClose={() => { setShowModal(false); setPendingCard(null) }}
          title={t('gallery.generate')}
        >
          {isAnon ? (
            <View style={styles.guestWall}>
              <Text style={styles.guestWallIcon}>✦</Text>
              <Text style={styles.guestWallTitle}>{t('gallery.guestWallTitle')}</Text>
              <Text style={styles.guestWallBody}>{t('gallery.guestWallBody')}</Text>
              <Button onPress={() => { setShowModal(false); router.push('/(auth)/login?mode=register') }}>
                {t('gallery.guestWallCta')}
              </Button>
            </View>
          ) : !pendingCard ? (
            <CardGenerator scope="gallery" onSelect={handleSelect} />
          ) : (
            <View style={styles.saveBlock}>
              <Image source={{ uri: pendingCard.imageUrl }} style={styles.previewImage} resizeMode="cover" />
              <Input
                label={t('gallery.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                placeholder={t('gallery.titlePlaceholder')}
                maxLength={60}
              />
              <Button onPress={saveToGallery} loading={saving}>
                {t('gallery.saveToGallery')}
              </Button>
            </View>
          )}
        </Modal>

        {/* Card detail modal */}
        <Modal
          visible={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          title={selectedCard?.title || t('gallery.title')}
        >
          {selectedCard && (
            <View style={styles.previewBlock}>
              <Input
                label={t('gallery.titlePlaceholder')}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder={t('gallery.titlePlaceholder')}
                maxLength={60}
              />
              <Image source={{ uri: selectedCard.image_url }} style={styles.previewLargeImage} resizeMode="cover" />
              <Text style={styles.previewPrompt}>{selectedCard.prompt}</Text>
              <Button onPress={saveSelectedTitle} variant="secondary" loading={titleSaving}>
                {t('gallery.saveTitle')}
              </Button>
              <Button
                onPress={setAsAvatar}
                loading={avatarSaving}
                disabled={selectedCard.image_url === avatarUrl}
              >
                {selectedCard.image_url === avatarUrl ? t('gallery.currentAvatar') : t('gallery.useAsAvatar')}
              </Button>
              <Button variant="ghost" onPress={() => deleteCard(selectedCard.id)}>
                {t('common.delete')}
              </Button>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#fff4d6',
    fontSize: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
  },
  capacityText: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  row: { gap: 12 },
  list: { gap: 12, padding: 16, paddingBottom: 120 },
  card: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    aspectRatio: 2 / 3,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardImage: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(10, 6, 2, 0.82)',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  avatarBadgeText: {
    color: colors.goldLight,
    fontSize: 10,
    fontFamily: fonts.title,
    letterSpacing: 0.6,
  },
  cardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,6,2,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.goldBorder,
  },
  cardLabelText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: fonts.title,
  },
  footerBtn: { marginTop: 8 },
  guestWall: { alignItems: 'center', gap: 16, paddingVertical: 12, paddingHorizontal: 8 },
  guestWallIcon: { color: colors.gold, fontSize: 28, fontFamily: fonts.title },
  guestWallTitle: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.title,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  guestWallBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  saveBlock: { gap: 14 },
  previewImage: {
    width: '60%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    alignSelf: 'center',
  },
  previewBlock: { gap: 14 },
  previewLargeImage: {
    width: '72%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    alignSelf: 'center',
  },
  previewPrompt: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
})
