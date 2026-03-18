import { useCallback, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CardGenerator } from '@/components/game/CardGenerator'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Background } from '@/components/layout/Background'
import { useUIStore } from '@/stores/useUIStore'
import { colors, radii, shadows } from '@/constants/theme'
import type { GalleryCard } from '@/types/game'

export default function GalleryScreen() {
  const { t } = useTranslation()
  const showToast = useUIStore((s) => s.showToast)
  const { userId } = useAuth()

  const [cards, setCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingCard, setPendingCard] = useState<{ url: string; prompt: string } | null>(null)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchCards()
    }, [userId]),
  )

  async function fetchCards() {
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

  function handleSelect(url: string, prompt: string) {
    setPendingCard({ url, prompt })
    setTitle('')
    setShowModal(true)
  }

  async function saveToGallery() {
    if (!pendingCard || !userId) return
    setSaving(true)
    try {
      const response = await fetch(pendingCard.url)
      const blob = await response.blob()
      const fileName = `${userId}/${Date.now()}.jpg`

      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(uploaded.path)

      await supabase.from('gallery_cards').insert({
        player_id: userId,
        image_url: publicUrl,
        prompt: pendingCard.prompt,
        title: title.trim() || pendingCard.prompt.slice(0, 40),
      })

      setShowModal(false)
      setPendingCard(null)
      showToast(t('gallery.savedSuccess'), 'success')
      fetchCards()
    } catch {
      showToast(t('errors.generic'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCard(id: string) {
    Alert.alert(t('gallery.deleteTitle'), t('gallery.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await supabase.from('gallery_cards').delete().eq('id', id)
          setCards((prev) => prev.filter((c) => c.id !== id))
        },
      },
    ])
  }

  const renderCard = useCallback(({ item }: { item: GalleryCard }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => deleteCard(item.id)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.image_url }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {item.title && (
        <View style={styles.cardLabel}>
          <Text style={styles.cardLabelText} numberOfLines={1}>{item.title}</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [])

  if (loading) {
    return (
      <Background>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="large" />
        </View>
      </Background>
    )
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyText}>{t('gallery.noCards')}</Text>
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
            ListFooterComponent={
              <Button onPress={() => setShowModal(true)} variant="ghost" style={styles.footerBtn}>
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
          {!pendingCard ? (
            <CardGenerator onSelect={handleSelect} />
          ) : (
            <View style={styles.saveBlock}>
              <Image
                source={{ uri: pendingCard.url }}
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
      </SafeAreaView>
    </Background>
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
    fontSize: 40,
    opacity: 0.5,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  row: { gap: 12 },
  list: { gap: 12, padding: 16 },
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
    fontWeight: '600',
  },
  footerBtn: {
    marginTop: 8,
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
})
