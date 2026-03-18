import { supabase } from './supabase'

async function callFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error) throw error
  return data as T
}

export const api = {
  roomCreate: (payload: { displayName: string }) =>
    callFunction<{ code: string }>('room-create', payload),

  roomJoin: (payload: { code: string; displayName: string }) =>
    callFunction<void>('room-join', payload),

  roomLeave: (payload: { code: string }) =>
    callFunction<void>('room-leave', payload),

  gameAction: (payload: { roomCode: string; action: string; payload?: unknown }) =>
    callFunction<{ ok: true }>('game-action', payload),

  imageGenerate: (payload: { prompt: string }) =>
    callFunction<{ url: string; brief: string }>('image-generate', payload),

  promptSuggest: () =>
    callFunction<{ prompt: string }>('prompt-suggest', {}),
}
