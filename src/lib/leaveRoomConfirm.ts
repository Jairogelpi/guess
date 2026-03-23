export interface LeaveRoomConfirmCopy {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}

export function buildLeaveRoomConfirmCopy(
  t: (key: string) => string,
): LeaveRoomConfirmCopy {
  return {
    title: t('roomExit.title'),
    message: t('roomExit.message'),
    confirmLabel: t('roomExit.confirm'),
    cancelLabel: t('common.cancel'),
  }
}
