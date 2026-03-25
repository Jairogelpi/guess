import { CARD_TILT_PROFILES, type CardTiltProfile, type CardTiltProfileName } from './cardTiltProfiles'

export function getCardTiltProfile(name: CardTiltProfileName): CardTiltProfile {
  return { ...CARD_TILT_PROFILES[name] }
}
