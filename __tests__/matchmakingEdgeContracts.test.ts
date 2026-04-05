import fs from 'fs'
import path from 'path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('matchmaking edge functions', () => {
  test('enqueue function derives ranges and performs room + player creation flow', () => {
    const source = read('supabase/functions/matchmaking-enqueue/index.ts')

    expect(source).toContain('derivePlayerCountRange')
    expect(source).toContain('FOR UPDATE SKIP LOCKED')
    expect(source).toContain(".from('rooms')")
    expect(source).toContain(".from('room_players')")
    expect(source).toContain(".from('matchmaking_queue')")
  })

  test('cancel and status functions operate on matchmaking_queue', () => {
    expect(read('supabase/functions/matchmaking-cancel/index.ts')).toContain(".from('matchmaking_queue')")
    expect(read('supabase/functions/matchmaking-status/index.ts')).toContain(".from('matchmaking_queue')")
  })
})
