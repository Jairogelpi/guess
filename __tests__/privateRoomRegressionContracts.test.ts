import fs from 'fs'
import path from 'path'

describe('private room regressions', () => {
  test('existing room actions remain exposed', () => {
    const apiSource = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'api.ts'), 'utf8')
    expect(apiSource).toContain("('room-create'")
    expect(apiSource).toContain("('room-join'")
    expect(apiSource).toContain("('room-leave'")
    expect(apiSource).toContain("('game-action'")
  })
})
