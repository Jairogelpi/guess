import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { CardGenerator } from '@/components/game/CardGenerator'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { AppHeader } from '@/components/layout/AppHeader'
import { useUIStore } from '@/stores/useUIStore'
import { hasGalleryCapacity, MAX_GALLERY_CARDS, remainingGallerySlots } from '@/lib/galleryRules'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

export default function GalleryScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const { userId, isAnon, avatarUrl, displayName, setProfile } = useProfile()

  const [cards, setCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingCard, setPendingCard] = useState<{ imageUrl: string; prompt: string } | null>(null)
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [titleSaving, setTitleSaving] = useState(false)

  useFocusEffect(
    useCallback(() => {
      void fetchCards()
    }, [userId]),
  )

  async function fetchCards() {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('gallery_cards')
      .select('*')
      .eq('player_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gallery fetch error:', error)
      showToast(error.message, 'error')
    }

    setCards((data as GalleryCard[]) ?? [])
    setLoading(false)
  }

  function handleSelect(imageUrl: string, prompt: string) {
    setPendingCard({ imageUrl, prompt })
    setTitle('')
    setShowModal(true)
  }

  async function saveToGallery() {
    if (!pendingCard || !userId) return
    setSaving(true)
    try {
      const { count, error: countError } = await supabase
        .from('gallery_cards')
        .select('id', { count: 'exact', head: true })
        .eq('player_id', userId)

      if (countError) {
        throw countError
      }

      if (!hasGalleryCapacity(count ?? 0)) {
        showToast(t('errors.GALLERY_LIMIT_REACHED'), 'error')
        setSaving(false)
        return
      }

      const response = await fetch(pendingCard.imageUrl)
      const blob = await response.blob()
      const fileName = `${userId}/${Date.now()}.jpg`

      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(uploaded.path)

      const { error: insertError } = await supabase.from('gallery_cards').insert({
        player_id: userId,
        image_url: publicUrl,
        prompt: pendingCard.prompt,
        title: title.trim() || pendingCard.prompt.slice(0, 40),
      })
      if (insertError) {
        await supabase.storage.from('gallery').remove([uploaded.path])
        throw insertError
      }

      setShowModal(false)
      setPendingCard(null)
      showToast(t('gallery.savedSuccess'), 'success')
      void fetchCards()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      console.error('Save to gallery error:', error)
      showToast(
        message.includes('GALLERY_LIMIT_REACHED')
          ? t('errors.GALLERY_LIMIT_REACHED')
          : message || t('errors.generic'),
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function setAsAvatar() {
    if (!selectedCard || !userId) return

    setAvatarSaving(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName || 'Player',
        avatar_url: selectedCard.image_url,
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      setProfile({ displayName, avatarUrl: selectedCard.image_url })
      showToast(t('gallery.avatarSaved'), 'success')
      setSelectedCard(null)
    } else {
      console.error('Set avatar error:', error)
      showToast(error.message || t('errors.generic'), 'error')
    }

    setAvatarSaving(false)
  }

  async function saveSelectedTitle() {
    if (!selectedCard) return
    setTitleSaving(true)
    const nextTitle = editingTitle.trim() || selectedCard.prompt.slice(0, 40)

    const { error } = await supabase
      .from('gallery_cards')
      .update({ title: nextTitle })
      .eq('id', selectedCard.id)

    if (!error) {
      setCards((prev) => prev.map((card) => (
        card.id === selectedCard.id ? { ...card, title: nextTitle } : card
      )))
      setSelectedCard({ ...selectedCard, title: nextTitle })
      showToast(t('gallery.titleSaved'), 'success')
    } else {
      console.error('Save gallery title error:', error)
      showToast(error.message || t('errors.generic'), 'error')
    }

    setTitleSaving(false)
  }

  async function deleteCard(id: string) {
    Alert.alert(t('gallery.deleteTitle'), t('gallery.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('gallery_cards').delete().eq('id', id)
          if (error) {
            console.error('Delete gallery card error:', error)
            showToast(error.message || t('errors.generic'), 'error')
            return
          }

          setCards((prev) => prev.filter((c) => c.id !== id))
          setSelectedCard((prev) => (prev?.id === id ? null : prev))
        },
      },
    ])
  }

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
        <Image
          source={{ uri: item.image_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />

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
  }, [avatarUrl, t])

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
              <Button onPress={() => {
                setShowModal(false)
                router.push('/(auth)/login?mode=register')
              }}>
                {t('gallery.guestWallCta')}
              </Button>
            </View>
          ) : !pendingCard ? (
            <CardGenerator scope="gallery" onSelect={handleSelect} />
          ) : (
            <View style={styles.saveBlock}>
              <Image
                source={{ uri: pendingCard.imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
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
              <Image
                source={{ uri: selectedCard.image_url }}
                style={styles.previewLargeImage}
                resizeMode="cover"
              />

              <Text style={styles.previewPrompt}>{selectedCard.prompt}</Text>

              <Button onPress={saveSelectedTitle} variant="secondary" loading={titleSaving}>
                {t('gallery.saveTitle')}
              </Button>

              <Button
                onPress={setAsAvatar}
                loading={avatarSaving}
                disabled={selectedCard.image_url === avatarUrl}
              >
                {selectedCard.image_url === avatarUrl
                  ? t('gallery.currentAvatar')
                  : t('gallery.useAsAvatar')}
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
  emptyIcon: {
    color: colors.gold,
    fontSize: 34,
    fontFamily: fonts.title,
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
  cardImage: {
    width: '100%',
    height: '100%',
  },
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
  footerBtn: {
    marginTop: 8,
  },
  guestWall: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  guestWallIcon: {
    color: colors.gold,
    fontSize: 28,
    fontFamily: fonts.title,
  },
  guestWallTitle: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.title,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  guestWallBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  saveBlock: { gap: 14 },
  previewImage: {
    width: '60%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    alignSelf: 'center',
  },
  previewBlock: {
    gap: 14,
  },
  previewLargeImage: {
    width: '72%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    alignSelf: 'center',
  },
  previewPrompt: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
})
