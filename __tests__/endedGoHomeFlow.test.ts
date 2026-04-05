import fs from 'node:fs'
import path from 'node:path'

const endedScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'room', '[code]', 'ended.tsx'),
  'utf8',
)

test('ended go-home flow bypasses the room-exit guard before navigating home', () => {
  expect(endedScreenSource).toContain('const { allowNextNavigation } = useConfirmRoomExit')
  expect(endedScreenSource).toContain('function handleGoHome() {')
  expect(endedScreenSource).toContain('allowNextNavigation()')
  expect(endedScreenSource).toContain("router.replace('/(tabs)')")
})
