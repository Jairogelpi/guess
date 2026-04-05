import fs from 'node:fs'
import path from 'node:path'

const cardGeneratorSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'game', 'CardGenerator.tsx'),
  'utf8',
)

test('card generator uses the same paid cost copy for generate and regenerate states', () => {
  expect(cardGeneratorSource).toContain("t('game.firstGenerationFree'")
  expect(cardGeneratorSource).toContain("t('game.generationCostsOne'")
  expect(cardGeneratorSource).toContain("t('game.regenerate')")
  expect(cardGeneratorSource).toContain('styles.regenerateCostChip')
  expect(cardGeneratorSource).toContain("t('game.generationCostsOne')")
  expect(cardGeneratorSource).not.toContain('styles.regenerateCostLabel')
})
