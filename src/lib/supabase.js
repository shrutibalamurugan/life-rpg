import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://airwyejmzxjfydrcgldu.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_FT81O1gvMHGkklHzFlkO1A_8QkgKFNh'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
