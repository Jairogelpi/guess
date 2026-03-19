import { create } from 'zustand'

interface ProfileState {
  displayName: string
  avatarUrl: string | null
  setProfile: (profile: { displayName: string; avatarUrl: string | null }) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  displayName: '',
  avatarUrl: null,
  setProfile: ({ displayName, avatarUrl }) => set({ displayName, avatarUrl }),
  clearProfile: () => set({ displayName: '', avatarUrl: null }),
}))
