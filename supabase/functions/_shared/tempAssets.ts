import { AI_ERROR_CODES, AiError } from './errors.ts'

export interface BuildTempAssetPathParams {
  scope: 'round' | 'gallery'
  roomCode?: string
  roundId?: string
  userId: string
  timestampMs: number
}

export function buildTempAssetPath({
  scope,
  roomCode,
  roundId,
  userId,
  timestampMs,
}: BuildTempAssetPathParams) {
  if (scope === 'round') {
    if (!roomCode || !roundId) {
      throw new AiError(
        AI_ERROR_CODES.MISSING_ROOM_CONTEXT,
        'Round generation requires room context',
        400,
      )
    }

    return `rooms/${roomCode}/rounds/${roundId}/${userId}/${timestampMs}.jpg`
  }

  return `gallery-previews/${userId}/${timestampMs}.jpg`
}

export function buildExpiryIso(baseIso: string, hours = 1) {
  const base = new Date(baseIso)
  const expires = new Date(base.getTime() + hours * 60 * 60 * 1000)
  return expires.toISOString()
}

export async function downloadRemoteImage(url: string, headers?: HeadersInit) {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    throw new AiError(
      AI_ERROR_CODES.TEMP_DOWNLOAD_FAILED,
      `Failed to download generated image: ${response.status}`,
    )
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? 'image/jpeg',
  }
}

export async function uploadTempImage({
  supabase,
  bucketId,
  objectPath,
  bytes,
  contentType,
}: {
  supabase: {
    storage: {
      from: (bucketId: string) => {
        upload: (
          path: string,
          body: ArrayBuffer,
          options: { contentType: string; upsert: boolean },
        ) => Promise<{ error: { message?: string } | null }>
      }
    }
  }
  bucketId: string
  objectPath: string
  bytes: ArrayBuffer
  contentType: string
}) {
  const { error } = await supabase.storage
    .from(bucketId)
    .upload(objectPath, bytes, { contentType, upsert: true })

  if (error) {
    throw new AiError(
      AI_ERROR_CODES.TEMP_UPLOAD_FAILED,
      error.message ?? 'Failed to upload temporary image',
    )
  }
}

export async function createSignedTempUrl({
  supabase,
  bucketId,
  objectPath,
  expiresInSeconds,
}: {
  supabase: {
    storage: {
      from: (bucketId: string) => {
        createSignedUrl: (
          path: string,
          expiresInSeconds: number,
        ) => Promise<{ data: { signedUrl: string } | null; error: { message?: string } | null }>
      }
    }
  }
  bucketId: string
  objectPath: string
  expiresInSeconds: number
}) {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .createSignedUrl(objectPath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new AiError(
      AI_ERROR_CODES.TEMP_URL_SIGN_FAILED,
      error?.message ?? 'Failed to create signed temporary URL',
    )
  }

  return data.signedUrl
}

export async function insertTempAssetRow({
  supabase,
  row,
}: {
  supabase: {
    from: (table: string) => {
      insert: (payload: Record<string, unknown>) => PromiseLike<{ error: { message?: string } | null }>
    }
  }
  row: Record<string, unknown>
}) {
  const { error } = await supabase.from('temporary_generation_assets').insert(row)

  if (error) {
    throw new AiError(
      AI_ERROR_CODES.TEMP_UPLOAD_FAILED,
      error.message ?? 'Failed to persist temporary asset metadata',
    )
  }
}
