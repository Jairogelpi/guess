import { buildLeaveRoomConfirmCopy } from '../src/lib/leaveRoomConfirm'

describe('buildLeaveRoomConfirmCopy', () => {
  test('returns the translated leave-room confirmation strings', () => {
    const t = (key: string) => {
      const dictionary: Record<string, string> = {
        'roomExit.title': 'Salir de la partida',
        'roomExit.message': 'Si sales ahora, abandonarás la sala actual.',
        'roomExit.confirm': 'Salir',
        'common.cancel': 'Cancelar',
      }
      return dictionary[key] ?? key
    }

    expect(buildLeaveRoomConfirmCopy(t)).toEqual({
      title: 'Salir de la partida',
      message: 'Si sales ahora, abandonarás la sala actual.',
      confirmLabel: 'Salir',
      cancelLabel: 'Cancelar',
    })
  })
})
