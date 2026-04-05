import fs from 'fs'
import path from 'path'

const source = fs.readFileSync(path.join(process.cwd(), 'src', 'hooks', 'useQuickMatch.ts'), 'utf8')

describe('useQuickMatch contracts', () => {
  test('subscribes to the current users queue ticket and exposes queue actions', () => {
    expect(source).toContain('supabase.channel(')
    expect(source).toContain("table: 'matchmaking_queue'")
    expect(source).toContain('enqueueQuickMatch')
    expect(source).toContain('cancelQuickMatch')
    expect(source).toContain('countdownRemainingMs')
  })

  test('bootstraps status off user identity instead of re-running on every render callback change', () => {
    expect(source).toContain('getQuickMatchStatus({ silent: true })')
    expect(source).toContain('}, [userId])')
  })

  test('adds polling fallbacks for queue and room state so all matched players can advance even if realtime lags', () => {
    expect(source).toContain('setInterval(() => {')
    expect(source).toContain('void refresh({ silent: true })')
    expect(source).toContain('void refreshRoomStatus(matchedRoomCode)')
  })
})
