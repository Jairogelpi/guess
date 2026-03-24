import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { useUIStore } from '@/stores/useUIStore'
import { hasGalleryCapacity } from '@/lib/galleryRules'
import type { GalleryCard } from '@/types/game'

export function useGallery() {
  const { t } = useTranslation()
  const showToast = useUIStore((s) => s.showToast)
  const { userId, isAnon, avatarUrl, displayName, setProfile } = useProfile()

  const [cards, setCards] = useState<GalleryCard[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendingCard, setPendingCard] = useState<{ imageUrl: string; prompt: string } | null>(null)
  const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
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
      if (!editingCardId) {
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
      }

      // Download as Blob
      const response = await fetch(pendingCard.imageUrl)
      const blob = await response.blob()

      // Convert Blob to Base64 using FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const res = reader.result as string
          resolve(res.split(',')[1] || res) // Strip data URI prefix if present
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const fileName = `${userId}/${Date.now()}.jpg`

      // Upload base64 decoded to ArrayBuffer natively
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, decode(base64), { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(uploaded.path)

      if (editingCardId) {
        // Find old card if we want to delete later
        const oldCard = cards.find(c => c.id === editingCardId)

        const { error: updateError } = await supabase.from('gallery_cards').update({
          image_url: publicUrl,
          prompt: pendingCard.prompt,
          title: title.trim() || pendingCard.prompt.slice(0, 40),
        }).eq('id', editingCardId)

        if (updateError) {
          await supabase.storage.from('gallery').remove([uploaded.path])
          throw updateError
        }

        // Clean up old image if possible (fire and forget)
        if (oldCard && oldCard.image_url.includes('gallery/')) {
          const oldPath = oldCard.image_url.split('gallery/')[1]
          if (oldPath) supabase.storage.from('gallery').remove([oldPath]).catch(console.error)
        }
      } else {
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
      }

      setShowModal(false)
      setPendingCard(null)
      setEditingCardId(null)
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

  async function setAsAvatar(offsetY?: number) {
    if (!selectedCard || !userId) return
    setAvatarSaving(true)

    let finalUrl = selectedCard.image_url
    if (offsetY !== undefined) {
      try {
        const urlObj = new URL(finalUrl)
        urlObj.searchParams.set('offsetY', offsetY.toString())
        finalUrl = urlObj.toString()
      } catch (e) {
        console.warn('Failed to append offsetY to avatar URL:', e)
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName || 'Player',
        avatar_url: finalUrl,
        updated_at: new Date().toISOString(),
      })

    if (!error) {
      setProfile({ displayName, avatarUrl: finalUrl })
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
    editingCardId, setEditingCardId,
    editingTitle, setEditingTitle,
    titleSaving,
    avatarSaving,
    saveSelectedTitle,
    setAsAvatar,
    deleteCard,
  }
}
