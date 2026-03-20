import {
  buildExpiryIso,
  buildTempAssetPath,
} from '../../supabase/functions/_shared/tempAssets'

describe('temp asset helpers', () => {
  test('buildTempAssetPath uses round folder structure', () => {
    const path = buildTempAssetPath({
      scope: 'round',
      roomCode: 'ABCD12',
      roundId: 'round-1',
      userId: 'user-1',
      timestampMs: 1700000000000,
    })

    expect(path).toBe('rooms/ABCD12/rounds/round-1/user-1/1700000000000.jpg')
  })

  test('buildTempAssetPath uses gallery preview structure', () => {
    const path = buildTempAssetPath({
      scope: 'gallery',
      userId: 'user-1',
      timestampMs: 1700000000000,
    })

    expect(path).toBe('gallery-previews/user-1/1700000000000.jpg')
  })

  test('buildExpiryIso adds one hour', () => {
    expect(buildExpiryIso('2026-03-18T12:00:00.000Z')).toBe('2026-03-18T13:00:00.000Z')
  })
})
