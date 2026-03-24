import { buildRoomEndedCopy } from '../src/lib/roomEndReason'

const t = (key: string) => key

describe('buildRoomEndedCopy', () => {
  it('uses self copy when the current user caused the lobby closure', () => {
    expect(buildRoomEndedCopy(t, 'host_cancelled_lobby', true)).toEqual({
      title: 'ended.reason.hostCancelledSelfTitle',
      body: 'ended.reason.hostCancelledSelfBody',
    })
  })

  it('uses remote copy when another player caused the room to end', () => {
    expect(buildRoomEndedCopy(t, 'too_few_players_in_game', false)).toEqual({
      title: 'ended.reason.tooFewPlayersTitle',
      body: 'ended.reason.tooFewPlayersBody',
    })
  })

  it('falls back to a room-finished message for normal game end', () => {
    expect(buildRoomEndedCopy(t, 'room_finished', false)).toEqual({
      title: 'ended.reason.roomFinishedTitle',
      body: 'ended.reason.roomFinishedBody',
    })
  })

  it('uses a safe default for unknown end reasons', () => {
    expect(buildRoomEndedCopy(t, 'unexpected_reason', false)).toEqual({
      title: 'ended.reason.defaultTitle',
      body: 'ended.reason.defaultBody',
    })
  })
})
