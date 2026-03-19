import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'

export function useGameActions() {
  const showToast = useUIStore((s) => s.showToast)
  const { t } = useTranslation()

  function handleError(error: unknown) {
    const code = (error as { error?: { code?: string } })?.error?.code
    const message = code ? t(`errors.${code}`, t('errors.generic')) : t('errors.generic')
    showToast(message, 'error')
  }

  return {
    createRoom: async (displayName: string) => {
      try {
        return await api.roomCreate({ displayName })
      } catch (e) {
        handleError(e)
        return null
      }
    },
    joinRoom: async (code: string, displayName: string) => {
      try {
        await api.roomJoin({ code, displayName })
        return true
      } catch (e) {
        handleError(e)
        return false
      }
    },
    leaveRoom: async (code: string) => {
      try {
        await api.roomLeave({ code })
      } catch (e) {
        handleError(e)
      }
    },
    gameAction: async (roomCode: string, action: string, payload?: unknown) => {
      try {
        await api.gameAction({ roomCode, action, payload })
        return true
      } catch (e) {
        handleError(e)
        return false
      }
    },
    gameActionResult: async <T>(roomCode: string, action: string, payload?: unknown) => {
      try {
        return await api.gameAction<T>({ roomCode, action, payload })
      } catch (e) {
        handleError(e)
        return null
      }
    },
    /** Insert a card for the current user in a given round. */
    insertCard: async (roundId: string, userId: string, imageUrl: string, prompt: string) => {
      try {
        const { data, error } = await supabase
          .from('cards')
          .insert({ round_id: roundId, player_id: userId, image_url: imageUrl, prompt })
          .select('id')
          .single()
        if (error) throw error
        return data?.id ?? null
      } catch (e) {
        handleError(e)
        return null
      }
    },
  }
}
