import fs from 'node:fs'
import path from 'node:path'

const narratorSelectedFlowSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'game', 'NarratorSelectedCardFlow.tsx'),
  'utf8',
)

test('narrator selected card keeps the hero tilt wrapper for drag interactions', () => {
  expect(narratorSelectedFlowSource).toContain("from '@/components/ui/InteractiveCardTilt'")
  expect(narratorSelectedFlowSource).toContain('profileName="hero"')
  expect(narratorSelectedFlowSource).toContain('regionKey="narrator-selected"')
})
