import fs from 'fs'
import path from 'path'

const quickMatchSource = fs.readFileSync(path.join(process.cwd(), 'app', '(tabs)', 'quick-match.tsx'), 'utf8')
const quickMatchSearchingStateSource = fs.readFileSync(
  path.join(process.cwd(), 'src', 'components', 'matchmaking', 'QuickMatchSearchingState.tsx'),
  'utf8',
)
const privateSource = fs.readFileSync(path.join(process.cwd(), 'app', '(tabs)', 'private.tsx'), 'utf8')

describe('quick match screen contracts', () => {
  test('quick match screen includes preference selection and queue actions', () => {
    expect(quickMatchSource).toContain('preferredPlayerCount')
    expect(quickMatchSource).toContain('enqueue(')
    expect(quickMatchSource).toContain('cancel(')
    expect(quickMatchSource).toContain('partida encontrada')
    expect(quickMatchSource).toContain('preparando partida')
    expect(quickMatchSource).toContain("/game`")
  })

  test('quick match screen keeps a dedicated searching state with loading copy and an explicit exit action', () => {
    expect(quickMatchSource).toContain('QuickMatchSearchingState')
    expect(quickMatchSearchingStateSource).toContain('buscando jugadores')
    expect(quickMatchSearchingStateSource).toContain('Salir de la busqueda')
  })

  test('private screen links to quick match entry point', () => {
    expect(privateSource).toContain('quick-match')
  })
})
