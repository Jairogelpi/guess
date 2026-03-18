import {
  brandButtons,
  brandTypography,
  decorativeFontFamily,
  entryShell,
} from '../src/constants/brand'

describe('brand tokens', () => {
  test('decorative font family uses Cinzel Decorative', () => {
    expect(decorativeFontFamily).toContain('CinzelDecorative')
    expect(brandTypography.titleHero.fontFamily).toContain('CinzelDecorative')
  })

  test('title variants expose the required keys', () => {
    expect(brandTypography.titleHero).toEqual(
      expect.objectContaining({
        fontFamily: expect.any(String),
        fontSize: expect.any(Number),
        letterSpacing: expect.any(Number),
      }),
    )
    expect(brandTypography.titleScreen).toEqual(
      expect.objectContaining({
        fontFamily: expect.any(String),
        fontSize: expect.any(Number),
      }),
    )
    expect(brandTypography.titleSection).toEqual(
      expect.objectContaining({
        fontFamily: expect.any(String),
        fontSize: expect.any(Number),
      }),
    )
    expect(brandTypography.buttonLabel).toEqual(
      expect.objectContaining({
        fontFamily: expect.any(String),
        fontSize: expect.any(Number),
      }),
    )
  })

  test('button tokens expose gradients for primary and secondary actions', () => {
    expect(brandButtons.primary.gradient.length).toBeGreaterThanOrEqual(2)
    expect(brandButtons.primary.borderColor).toEqual(expect.any(String))
    expect(brandButtons.secondary.backgroundColor).toEqual(expect.any(String))
    expect(brandButtons.ghost.textColor).toEqual(expect.any(String))
  })

  test('entry shell exposes stable spacing metrics', () => {
    expect(entryShell.utilityPill.height).toBeGreaterThan(0)
    expect(entryShell.card.radius).toBeGreaterThan(0)
    expect(entryShell.card.outerPadding).toBeGreaterThan(0)
    expect(entryShell.actions.gap).toBeGreaterThan(0)
  })
})
