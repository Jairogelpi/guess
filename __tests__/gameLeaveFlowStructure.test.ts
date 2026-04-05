import fs from 'node:fs'
import path from 'node:path'

const gameScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'room', '[code]', 'game.tsx'),
  'utf8',
)

const headerSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'layout', 'AppHeader.tsx'),
  'utf8',
)

test('game screen wires an explicit leave button that opens a confirmation modal', () => {
  expect(gameScreenSource).toContain('const [showLeaveModal, setShowLeaveModal] = useState(false)')
  expect(gameScreenSource).toContain("<AppHeader title={t('game.title', { defaultValue: 'PARTIDA' })} />")
  expect(gameScreenSource).toContain('testID="leave-game-button"')
  expect(gameScreenSource).toContain('<Modal visible={showLeaveModal}')
})

test('app header stays focused on title and global actions only', () => {
  expect(headerSource).not.toContain('onLeavePress?: () => void')
  expect(headerSource).not.toContain('leaveLabel?: string')
})
