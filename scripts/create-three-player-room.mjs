import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const appJsonPath = path.join(projectRoot, 'app.json')

let SUPABASE_URL = ''
let SUPABASE_ANON_KEY = ''

function readExpoExtra() {
  const raw = fs.readFileSync(appJsonPath, 'utf8')
  const appJson = JSON.parse(raw)
  const extra = appJson?.expo?.extra ?? {}
  if (!extra.supabaseUrl || !extra.supabaseAnonKey) {
    throw new Error('Missing expo.extra.supabaseUrl or expo.extra.supabaseAnonKey in app.json')
  }
  return {
    supabaseUrl: extra.supabaseUrl,
    supabaseAnonKey: extra.supabaseAnonKey,
  }
}

function makeClient(supabaseUrl, supabaseAnonKey) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function makePlayer(displayName, supabaseUrl, supabaseAnonKey) {
  const client = makeClient(supabaseUrl, supabaseAnonKey)
  const { error } = await client.auth.signInAnonymously()
  if (error) throw error
  return { client, displayName }
}

async function call(player, fn, body) {
  const { data: sessionData, error: sessionError } = await player.client.auth.getSession()
  if (sessionError) throw sessionError

  const accessToken = sessionData?.session?.access_token
  if (!accessToken) {
    throw new Error(`Missing access token for player ${player.displayName}`)
  }

  const { data, error } = await player.client.functions.invoke(fn, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  })
  if (error) {
    const context = error?.context
    if (context && typeof context.text === 'function') {
      const payload = await context.text().catch(() => '')
      error.message = `${error.message}${payload ? ` | ${payload}` : ''}`
    }
    throw error
  }
  return data
}

async function main() {
  const [hostName = 'Host', player2Name = 'Player 2', player3Name = 'Player 3'] = process.argv.slice(2)
  const { supabaseUrl, supabaseAnonKey } = readExpoExtra()
  SUPABASE_URL = supabaseUrl
  SUPABASE_ANON_KEY = supabaseAnonKey

  const host = await makePlayer(hostName, supabaseUrl, supabaseAnonKey)
  const player2 = await makePlayer(player2Name, supabaseUrl, supabaseAnonKey)
  const player3 = await makePlayer(player3Name, supabaseUrl, supabaseAnonKey)

  const created = await call(host, 'room-create', { displayName: host.displayName })
  const code = created?.code
  if (!code) {
    throw new Error('room-create did not return a room code')
  }

  await call(player2, 'room-join', { code, displayName: player2.displayName })
  await call(player3, 'room-join', { code, displayName: player3.displayName })

  await call(player2, 'game-action', { roomCode: code, action: 'set_ready', payload: { ready: true } })
  await call(player3, 'game-action', { roomCode: code, action: 'set_ready', payload: { ready: true } })

  try {
    await call(host, 'game-action', { roomCode: code, action: 'start_game' })
    console.log(`Room created and started: ${code}`)
  } catch (error) {
    console.warn(`Room created and joined, but start_game failed: ${code}`)
    console.warn(String(error?.message ?? error))
    console.log(`Room created and ready in lobby: ${code}`)
  }

  console.log(`Players: ${host.displayName}, ${player2.displayName}, ${player3.displayName}`)
  console.log(`Open lobby: /room/${code}/lobby`)
}

main().catch((error) => {
  console.error('Failed to create 3-player room')
  console.error(error)
  process.exit(1)
})
