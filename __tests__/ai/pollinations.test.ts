import {
  buildPollinationsAuthHeaders,
  buildPollinationsImageUrl,
  getPollinationsModels,
} from '../../supabase/functions/_shared/pollinations'

describe('pollinations helpers', () => {
  test('getPollinationsModels exposes primary and fallback model ids', () => {
    expect(getPollinationsModels()).toEqual({
      primary: 'gptimage-large',
      fallback: 'nanobanana-2',
    })
  })

  test('buildPollinationsImageUrl encodes prompt, model, and size', () => {
    const url = buildPollinationsImageUrl({
      prompt: 'painted moon horse',
      model: 'gptimage-large',
      seed: 7,
    })

    expect(url).toContain('gptimage-large')
    expect(url).toContain('seed=7')
    expect(url).toContain('width=768')
    expect(url).toContain('height=1152')
  })

  test('buildPollinationsAuthHeaders returns bearer auth header', () => {
    expect(buildPollinationsAuthHeaders('secret-key')).toEqual({
      Authorization: 'Bearer secret-key',
    })
  })
})
