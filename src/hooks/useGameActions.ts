import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import type { EdgeFunctionError, QuickMatchEnqueuePayload } from '@/types/game'

/**
 * Provides all game-level actions: room management, game flow, and card insertion.
 *
 * Every method catches errors internally and shows a user-visible toast via
 * `useUIStore`, so callers don't need their own try/catch.
 *
 * Returns `null` / `false` on failure so callers can still branch on the result.
 */
export function useGameActions() {
  const showToast = useUIStore((s) => s.showToast)
  const { t } = useTranslation()

  function handleError(error: unknown) {
    const edgeError = (error as { error?: EdgeFunctionError })?.error
    const code = edgeError?.code
    const translated = code ? t(`errors.${code}`, '') : ''
    const message = translated || edgeError?.message || t('errors.generic')
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
    enqueueQuickMatch: async (payload: QuickMatchEnqueuePayload) => {
      try {
        return await api.matchmakingEnqueue(payload)
      } catch (e) {
        handleError(e)
        return null
      }
    },
    cancelQuickMatch: async () => {
      try {
        await api.matchmakingCancel()
        return true
      } catch (e) {
        handleError(e)
        return false
      }
    },
    getQuickMatchStatus: async (options?: { silent?: boolean }) => {
      try {
        return await api.matchmakingStatus()
      } catch (e) {
        if (!options?.silent) handleError(e)
        return null
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
    /** Insert a card for the current user via the authorized edge function. */
    insertCard: async (roomCode: string, imageUrl: string, prompt: string) => {
      try {
        const result = await api.gameAction<{ cardId: string }>({
          roomCode,
          action: 'insert_card',
          payload: { imageUrl, prompt },
        })
        return result?.cardId ?? null
      } catch (e) {
        handleError(e)
        return null
      }
    },
  }
}
