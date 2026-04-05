import fs from 'node:fs'
import path from 'node:path'

const tabsLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'app', '(tabs)', '_layout.tsx'),
  'utf8',
)

test('tabs layout uses a floating bottom bar instead of a full-width strip', () => {
  expect(tabsLayoutSource).toContain('tabBarBackground:')
  expect(tabsLayoutSource).not.toContain('left: 0')
  expect(tabsLayoutSource).not.toContain('right: 0')
})
