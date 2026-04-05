export const APP_VERSION = 'v1.0.0'

export const APP_TAB_ITEMS = [
  { route: 'index', titleKey: 'home.playTitle', icon: 'creation' },
  { route: 'gallery', titleKey: 'gallery.title', icon: 'image-multiple-outline' },
  { route: 'profile', titleKey: 'profile.title', icon: 'account-circle-outline' },
] as const

export const APP_TAB_BAR_THEME = {
  backgroundColor: '#120a06',
  borderColor: 'rgba(244, 192, 119, 0.22)',
} as const

export const APP_HEADER_THEME = {
  backgroundColor: 'rgba(18, 10, 6, 0.58)',
  borderColor: 'rgba(255, 228, 186, 0.28)',
} as const

export const APP_HEADER_LOGO_SCALE = 1.38

export type AppTabItem = (typeof APP_TAB_ITEMS)[number]
