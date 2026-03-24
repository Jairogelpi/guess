export interface RoomEndedCopy {
  title: string
  body: string
}

export function buildRoomEndedCopy(
  t: (key: string) => string,
  reason: string | null | undefined,
  userCaused: boolean,
): RoomEndedCopy {
  switch (reason) {
    case 'host_cancelled_lobby':
      return userCaused
        ? {
          title: t('ended.reason.hostCancelledSelfTitle'),
          body: t('ended.reason.hostCancelledSelfBody'),
        }
        : {
          title: t('ended.reason.hostCancelledOtherTitle'),
          body: t('ended.reason.hostCancelledOtherBody'),
        }
    case 'all_players_left':
      return userCaused
        ? {
          title: t('ended.reason.allPlayersLeftSelfTitle'),
          body: t('ended.reason.allPlayersLeftSelfBody'),
        }
        : {
          title: t('ended.reason.allPlayersLeftTitle'),
          body: t('ended.reason.allPlayersLeftBody'),
        }
    case 'too_few_players_in_game':
      return userCaused
        ? {
          title: t('ended.reason.tooFewPlayersSelfTitle'),
          body: t('ended.reason.tooFewPlayersSelfBody'),
        }
        : {
          title: t('ended.reason.tooFewPlayersTitle'),
          body: t('ended.reason.tooFewPlayersBody'),
        }
    case 'room_finished':
      return {
        title: t('ended.reason.roomFinishedTitle'),
        body: t('ended.reason.roomFinishedBody'),
      }
    case 'room_missing_or_invalid':
      return {
        title: t('ended.reason.invalidTitle'),
        body: t('ended.reason.invalidBody'),
      }
    default:
      return {
        title: t('ended.reason.defaultTitle'),
        body: t('ended.reason.defaultBody'),
      }
  }
}
