import { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native'
import {
  ScrollView,
  GestureHandlerRootView,
} from 'react-native-gesture-handler'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
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
    setEditingCardId,
  } = useGallery()

  const [isEditingCard, setIsEditingCard] = useState(false)
  const [regenerationPrompt, setRegenerationPrompt] = useState('')
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropOffsetY, setCropOffsetY] = useState(0.5)

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].item && viewableItems[0].item.id) {
      const item = viewableItems[0].item as GalleryCard
      setSelectedCard(item)
      setEditingTitle(item.title ?? '')
    }
  }).current

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current

  const renderSlide = useCallback(({ item }: { item: GalleryCard }) => {
    const isCurrentAvatar = avatarUrl === item.image_url
    const isActive = selectedCard?.id === item.id

    // Size based on reactive screen dimensions
    const displayWidth = screenWidth > 0 ? screenWidth : 400
    const displayHeight = screenHeight > 0 ? screenHeight : 800
    const cardWidth = Math.min(displayWidth * 0.90, displayHeight * 0.45)
    const cardHeight = cardWidth * 1.5

    return (
      <View style={[styles.slide, { width: displayWidth, minHeight: cardHeight + 40 }]}>
        <View style={styles.cardContainer}>
          <InteractiveCardTilt
            profileName="hero"
            regionKey={`gallery-card-${item.id}`}
            disabled={!isActive}
            style={Platform.OS === 'web' ? { width: cardWidth, height: cardHeight } : undefined}
          >
            <View style={[styles.cardWrapper, Platform.OS === 'web' && { height: '100%', width: '100%' }]}>
              <View style={styles.card}>
                <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />

                {isCurrentAvatar && (
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>{t('gallery.currentAvatar')}</Text>
                  </View>
                )}

                <LinearGradient
                  colors={['transparent', 'rgba(5,2,0,0.85)', 'rgba(0,0,0,0.98)']}
                  locations={[0, 0.4, 1]}
                  style={styles.cinematicOverlay}
                >
                  <Text style={styles.cinematicTitle} numberOfLines={2}>
                    {item.title || t('gallery.untitled', 'Carta sin título')}
                  </Text>

                  <View style={styles.cinematicIconGroup}>
                    <TouchableOpacity
                      style={styles.cinematicIconBtn}
                      onPress={() => {
                        setSelectedCard(item)
                        setEditingTitle(item.title ?? '')
                        setIsEditingCard(true)
                      }}
                    >
                      <MaterialCommunityIcons name="pencil" size={22} color={colors.goldLight} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cinematicIconBtn}
                      onPress={() => {
                        setSelectedCard(item)
                        setCropOffsetY(0.5)
                        setShowCropModal(true)
                      }}
                      disabled={!isActive || isCurrentAvatar || avatarSaving}
                    >
                      <MaterialCommunityIcons
                        name={isCurrentAvatar ? "account-check" : "account-circle-outline"}
                        size={22}
                        color={isCurrentAvatar ? colors.gold : colors.textPrimary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cinematicIconBtn}
                      onPress={() => deleteCard(item.id)}
                      disabled={!isActive}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </InteractiveCardTilt>
        </View>
      </View>
    )
  }, [avatarUrl, t, deleteCard, setSelectedCard, setEditingTitle, selectedCard, screenWidth, avatarSaving])

  const renderFooterSlide = useCallback(() => {
    // Sizing for footer
    const displayWidth = screenWidth > 0 ? screenWidth : 400

    return (
      <View style={[styles.slide, { width: displayWidth }]}>
        <View style={styles.footerSlideContent}>
          <View style={styles.footerIconContainer}>
            <MaterialCommunityIcons
              name="cards-playing-outline"
              size={80}
              color={colors.gold}
              style={{ opacity: 0.6 }}
            />
          </View>

          <View style={styles.footerTextContainer}>
            <Text style={styles.slotsLabel}>{t('gallery.slotsLabel', { defaultValue: 'CAPACIDAD DE GALERÍA' })}</Text>
            <Text style={styles.slotsCount}>
              {cards.length} / {MAX_GALLERY_CARDS}
            </Text>
            <Text style={styles.capacityText}>
              {`${t('gallery.slotsRemainingPrefix', { defaultValue: 'Huecos libres' })}: ${remainingGallerySlots(cards.length)} / ${MAX_GALLERY_CARDS}`}
            </Text>
          </View>

          <Button
            onPress={() => setShowModal(true)}
            disabled={!hasGalleryCapacity(cards.length)}
            style={styles.addCardBtn}
            contentStyle={{ paddingHorizontal: 20 }}
            textStyle={Platform.OS === 'web' ? ({ whiteSpace: 'nowrap' } as any) : undefined}
          >
            {t('gallery.generate')}
          </Button>
        </View>
      </View>
    )
  }, [screenWidth, t, cards.length, setShowModal])

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
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cards-outline" size={48} color={colors.gold} style={{ opacity: 0.8 }} />
            <Text style={styles.emptyText}>{t('gallery.noCards')}</Text>
            <Text style={styles.emptyCapacityText}>{t('gallery.capacity', { count: 8 })}</Text>
            <Button onPress={() => setShowModal(true)}>{t('gallery.generate')}</Button>
          </View>
        ) : (
          <GestureHandlerRootView style={styles.swiperContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              disallowInterruption={true}
            >
              {cards.map((card) => (
                <View key={card.id}>
                  {renderSlide({ item: card })}
                </View>
              ))}
              {renderFooterSlide()}
            </ScrollView>
          </GestureHandlerRootView>
        )}

        {/* Generate & save modal */}
        <Modal
          visible={showModal}
          onClose={() => { 
            setShowModal(false)
            setPendingCard(null)
            setRegenerationPrompt('')
            setEditingCardId(null)
          }}
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
            <CardGenerator scope="gallery" onSelect={handleSelect} initialPrompt={regenerationPrompt} />
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

        {/* Edit Card Detail Modal */}
        <Modal
          visible={isEditingCard}
          onClose={() => setIsEditingCard(false)}
          title={t('gallery.editCard', 'Editar Carta')}
        >
          {selectedCard && (
            <View style={styles.previewBlock}>
              <Image source={{ uri: selectedCard.image_url }} style={styles.previewLargeImage} resizeMode="cover" />
              <Input
                label={t('gallery.titlePlaceholder')}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder={t('gallery.titlePlaceholder')}
                maxLength={60}
              />
              <Text style={styles.previewPromptLabel}>{t('gallery.promptLabel', 'Prompt original:')}</Text>
              <Text style={styles.previewPrompt}>{selectedCard.prompt}</Text>
              
              <Button onPress={saveSelectedTitle} variant="secondary" loading={titleSaving} disabled={editingTitle === selectedCard.title}>
                {t('gallery.saveTitle', 'Guardar Título')}
              </Button>
              <Button
                onPress={() => {
                  setIsEditingCard(false)
                  setTimeout(() => {
                    setEditingCardId(selectedCard.id)
                    setRegenerationPrompt(selectedCard.prompt)
                    setShowModal(true)
                  }, 400) // allow close animation
                }}
              >
                {t('gallery.regenerate', 'Regenerar Variante')}
              </Button>
              <Button
                onPress={() => {
                  setIsEditingCard(false)
                  setTimeout(() => {
                    setCropOffsetY(0.5)
                    setShowCropModal(true)
                  }, 400)
                }}
                loading={avatarSaving}
                disabled={selectedCard.image_url === avatarUrl}
                variant="secondary"
              >
                {selectedCard.image_url === avatarUrl ? t('gallery.currentAvatar') : t('gallery.useAsAvatar')}
              </Button>
              <Button variant="danger" onPress={() => { deleteCard(selectedCard.id); setIsEditingCard(false) }}>
                {t('common.delete')}
              </Button>
            </View>
          )}
        </Modal>

        {/* Avatar Crop Modal */}
        <Modal
          visible={showCropModal}
          onClose={() => setShowCropModal(false)}
          title={t('gallery.adjustAvatar', 'Encuadrar Avatar')}
        >
          {selectedCard && (
            <View style={styles.cropContainer}>
              <Text style={styles.cropHint}>
                {t('gallery.cropHint', 'Desliza arriba o abajo para encuadrar la parte ilustrada que quieres ver en tu perfil.')}
              </Text>
              
              <View style={styles.cropMask}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={styles.cropScroll}
                  contentContainerStyle={{ height: 360 }}
                  onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y
                    setCropOffsetY(Math.min(1, Math.max(0, y / 120)))
                  }}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                >
                  <Image
                    source={{ uri: selectedCard.image_url }}
                    style={{ width: 240, height: 360 }}
                    resizeMode="cover"
                  />
                </ScrollView>
              </View>

              <Button
                onPress={() => {
                   setShowCropModal(false)
                   setAsAvatar(cropOffsetY)
                }}
                loading={avatarSaving}
              >
                {t('common.save', 'Guardar Avatar')}
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
  swiperContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80,
    paddingTop: 10,
  },
  slide: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cardContainer: {
    alignItems: 'center',
    width: '100%',
  },
  cardWrapper: {
    width: '95%',
    ...Platform.select({
      web: {
        // En web, flex: 1 dentro de InteractiveCardTilt a veces falla.
        // Forzamos el tamaño en el prop 'style' del componente de arriba,
        // pero aquí nos aseguramos de que ocupe todo ese espacio.
        flex: 1,
        minHeight: 1,
      },
      default: {
        aspectRatio: 2 / 3,
      },
    }),
    ...shadows.card,
  },
  card: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(230, 184, 0, 0.65)',
    backgroundColor: colors.surfaceDeep,
  },
  cardImage: { width: '100%', height: '100%' },
  avatarBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(10, 6, 2, 0.9)',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
  },
  avatarBadgeText: {
    color: colors.goldLight,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.6,
  },
  cinematicOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  cinematicTitle: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cinematicIconGroup: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  cinematicIconBtn: {
    padding: 10,
    backgroundColor: 'rgba(28, 14, 8, 0.45)',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.35)',
  },
  footerSlideContent: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.15)',
    borderRadius: radii.xl,
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: 'rgba(15, 8, 4, 0.4)',
    minHeight: 400,
  },
  footerIconContainer: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: 'rgba(230, 184, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.1)',
  },
  footerTextContainer: {
    alignItems: 'center',
    gap: 6,
  },
  slotsLabel: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
  },
  slotsCount: {
    color: colors.goldLight,
    fontSize: 32,
    fontFamily: fonts.titleHeavy,
  },
  capacityText: {
    color: 'rgba(255, 241, 222, 0.65)',
    fontSize: 13,
    fontFamily: fonts.title,
  },
  addCardBtn: {
    width: '100%',
    maxWidth: 280, // Increased to fit text in one line
  },
  footerIcon: {
    opacity: 0.8,
  },
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
  emptyCapacityText: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
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
    width: '50%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 8,
  },
  previewPromptLabel: {
    color: colors.goldLight,
    fontSize: 12,
    fontFamily: fonts.title,
    marginTop: 4,
  },
  previewPrompt: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cropContainer: {
    alignItems: 'center',
    gap: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  cropHint: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  cropMask: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(230, 184, 0, 0.45)', // elegant gold
    backgroundColor: colors.surfaceDeep,
  },
  cropScroll: {
    flex: 1,
  },
})
