import fs from 'node:fs'
import path from 'node:path'

const cardGeneratorSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'game', 'CardGenerator.tsx'),
  'utf8',
)

test('card generator preview uses hero tilt so generated cards can be dragged before selection', () => {
  expect(cardGeneratorSource).toContain("from '@/components/ui/InteractiveCardTilt'")
  expect(cardGeneratorSource).toContain('profileName="hero"')
  expect(cardGeneratorSource).toContain('regionKey="card-generator-preview"')
})
