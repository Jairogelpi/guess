import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { resolveProfileAvatarFallback } from '../lib/profileAvatar'
import { useProfileStore } from '../stores/useProfileStore'

export function useProfile() {
  const auth = useAuth()
  const [profileLoading, setProfileLoading] = useState(true)
  const displayName = useProfileStore((state) => state.displayName)
  const avatarUrl = useProfileStore((state) => state.avatarUrl)
  const setProfile = useProfileStore((state) => state.setProfile)
  const clearProfile = useProfileStore((state) => state.clearProfile)

  const refresh = useCallback(async () => {
    const { supabase } = await import('../lib/supabase')

    if (!auth.userId) {
      clearProfile()
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', auth.userId)
      .maybeSingle()

    if (error) {
      console.error('Profile fetch error:', error)
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const authDisplayName =
      typeof user?.user_metadata?.display_name === 'string'
        ? user.user_metadata.display_name
        : ''

    setProfile({
      displayName: data?.display_name ?? authDisplayName ?? '',
      avatarUrl: data?.avatar_url ?? null,
    })
    setProfileLoading(false)
  }, [auth.userId, clearProfile, setProfile])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    ...auth,
    displayName,
    avatarUrl,
    profileLoading,
    refresh,
    setProfile,
    avatarFallback: resolveProfileAvatarFallback(avatarUrl, displayName || auth.email),
  }
}
