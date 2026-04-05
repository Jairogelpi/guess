import fs from 'node:fs'
import path from 'node:path'

function readSource(...segments: string[]) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8')
}

describe('hero tilt bindings', () => {
  test('keeps welcome and gallery on hero while gameplay interactive cards also use hero', () => {
    expect(readSource('app', '(auth)', 'welcome.tsx')).toContain('profileName="hero"')
    expect(readSource('app', '(tabs)', 'gallery.tsx')).toContain('profileName="hero"')

    expect(readSource('src', 'components', 'game', 'HandGrid.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'HandGrid.tsx')).not.toContain('profileName="lite"')

    expect(readSource('src', 'components', 'game', 'FanHand.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'FanHand.tsx')).not.toContain('profileName="lite"')

    expect(readSource('src', 'components', 'game', 'CardGrid.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'CardGrid.tsx')).not.toContain('profileName="lite"')

    expect(readSource('src', 'components', 'game', 'VoteCardField.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'VoteCardField.tsx')).not.toContain('profileName="lite"')

    expect(readSource('src', 'components', 'game', 'GalleryWildcardPicker.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'GalleryWildcardPicker.tsx')).not.toContain('profileName="lite"')
  })

  test('keeps preview-only surfaces out of the hero tilt binding swap', () => {
    expect(readSource('src', 'components', 'game', 'ResultsReveal.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'NarratorSelectedCardFlow.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game-phases', 'PlayersPhase.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'CardGenerator.tsx')).toContain('profileName="hero"')
  })
})
