import type {
  QuickMatchEnqueuePayload,
  QuickMatchEnqueueResult,
  QuickMatchTicketResult,
} from '@/types/game'
import { supabase } from './supabase'

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as string | ArrayBuffer | Blob | FormData | ReadableStream<Uint8Array> | Record<string, any> | undefined,
  })
  if (error) {
    const context = (error as { context?: Response }).context

    if (context && typeof context.json === 'function') {
      let payload: unknown = null
      try {
        payload = await context.json()
      } catch {
        payload = null
      }

      if (payload) throw { error: payload }
    }

    throw error
  }
  return data as T
}

export const api = {
  roomCreate: (payload: { displayName: string }) =>
    callFunction<{ code: string }>('room-create', payload),

  roomJoin: (payload: { code: string; displayName: string }) =>
    callFunction<void>('room-join', payload),

  roomLeave: (payload: { code: string }) =>
    callFunction<void>('room-leave', payload),

  matchmakingEnqueue: (payload: QuickMatchEnqueuePayload) =>
    callFunction<QuickMatchEnqueueResult>('matchmaking-enqueue', payload),

  matchmakingCancel: () =>
    callFunction<{ ok: true }>('matchmaking-cancel', {}),

  matchmakingStatus: () =>
    callFunction<QuickMatchTicketResult>('matchmaking-status', {}),

  gameAction: <T = { ok: true }>(payload: { roomCode: string; action: string; payload?: unknown }) =>
    callFunction<T>('game-action', payload),

  imageGenerate: (payload: {
    prompt: string
    scope: 'round' | 'gallery'
    roomCode?: string
    roundId?: string
  }) =>
    callFunction<{
      imageUrl: string
      brief: string
      provider: string
      model: string
      expiresAt: string
    }>('image-generate', payload),

  promptSuggest: (payload?: { basePrompt?: string }) =>
    callFunction<{ prompt: string }>('prompt-suggest', payload ?? {}),
}
