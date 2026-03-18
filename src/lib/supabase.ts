import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import type { Database } from '@/types/game'

const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl as string) ?? ''
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
