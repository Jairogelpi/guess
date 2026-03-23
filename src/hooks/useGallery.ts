import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { useUIStore } from '@/stores/useUIStore'
import { hasGalleryCapacity } from '@/lib/galleryRules'
import type { GalleryCard } from '@/types/game'

/**
 * Manages all gallery state and operations for the GalleryScreen.
 *
 * Owns: card list, modal visibility, pending card (generate→save flow),
 * selected card (detail/edit flow), and all async operations.
 *
 * Calls `useFocusEffect` internally to refresh cards on screen focus.
 */
export function useGallery() {
  const { t } = useTranslation()
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

      if (countError) throw countError

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
      setCards((prev) => prev.map((card) =>
        card.id === selectedCard.id ? { ...card, title: nextTitle } : card,
      ))
      setSelectedCard({ ...selectedCard, title: nextTitle })
      showToast(t('gallery.titleSaved'), 'success')
    } else {
      console.error('Save gallery title error:', error)
      showToast(error.message || t('errors.generic'), 'error')
    }
    setTitleSaving(false)
  }

  function deleteCard(id: string) {
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

  return {
    // profile
    userId, isAnon, avatarUrl,
    // card list
    cards, loading,
    // generate-and-save modal
    showModal, setShowModal,
    pendingCard, setPendingCard,
    title, setTitle,
    saving,
    saveToGallery,
    handleSelect,
    // card detail modal
    selectedCard, setSelectedCard,
    editingTitle, setEditingTitle,
    titleSaving,
    avatarSaving,
    saveSelectedTitle,
    setAsAvatar,
    deleteCard,
  }
}
