import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'hooks', 'useGameActions.ts'),
  'utf8',
)

test('game action errors fall back to the backend message when no translation exists', () => {
  expect(source).toContain("const translated = code ? t(`errors.${code}`, '') : ''")
  expect(source).toContain("const message = translated || edgeError?.message || t('errors.generic')")
})
