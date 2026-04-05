import fs from 'node:fs'
import path from 'node:path'

const narratorPhaseSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'game-phases', 'NarratorPhase.tsx'),
  'utf8',
)

const narratorStateHookSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'hooks', 'useNarratorPhaseState.ts'),
  'utf8',
)

const narratorSelectedFlowSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'components', 'game', 'NarratorSelectedCardFlow.tsx'),
  'utf8',
)

test('narrator phase uses extracted state + selected-flow components', () => {
  expect(narratorPhaseSource).toContain("from '@/hooks/useNarratorPhaseState'")
  expect(narratorPhaseSource).toContain('<NarratorSelectedCardFlow')
  expect(narratorStateHookSource).toContain('export function useNarratorPhaseState')
  expect(narratorSelectedFlowSource).toContain('<HandActionDock')
  expect(narratorSelectedFlowSource).toContain('<TacticalActionPicker')
})
