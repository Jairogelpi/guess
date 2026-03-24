const DEFAULT_CHAT_ACCENT = {
  ringColor: 'rgba(244, 196, 104, 0.78)',
  nameColor: '#f4c468',
  bubbleBorderColor: 'rgba(244, 196, 104, 0.28)',
}

const CHAT_ACCENTS = [
  DEFAULT_CHAT_ACCENT,
  {
    ringColor: 'rgba(244, 114, 182, 0.72)',
    nameColor: '#f9a8d4',
    bubbleBorderColor: 'rgba(244, 114, 182, 0.24)',
  },
  {
    ringColor: 'rgba(96, 165, 250, 0.74)',
    nameColor: '#93c5fd',
    bubbleBorderColor: 'rgba(96, 165, 250, 0.26)',
  },
  {
    ringColor: 'rgba(74, 222, 128, 0.72)',
    nameColor: '#86efac',
    bubbleBorderColor: 'rgba(74, 222, 128, 0.24)',
  },
  {
    ringColor: 'rgba(192, 132, 252, 0.74)',
    nameColor: '#d8b4fe',
    bubbleBorderColor: 'rgba(192, 132, 252, 0.24)',
  },
]

function hashPlayerId(playerId: string): number {
  let hash = 0
  for (let index = 0; index < playerId.length; index += 1) {
    hash = (hash * 31 + playerId.charCodeAt(index)) >>> 0
  }
  return hash
}

export function getChatPlayerAccent(playerId: string) {
  return CHAT_ACCENTS[hashPlayerId(playerId) % CHAT_ACCENTS.length] ?? DEFAULT_CHAT_ACCENT
}
