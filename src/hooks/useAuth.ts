import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Centralized auth state — avoid calling getUser() in every component. */
export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAnon, setIsAnon] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        setIsAnon(data.user.is_anonymous ?? false)
        setEmail(data.user.email ?? null)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      setIsAnon(session?.user?.is_anonymous ?? false)
      setEmail(session?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { userId, isAnon, email, loading }
}
