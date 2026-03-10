import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
  }
})

// Parse hash manually and set session if present
const hash = window.location.hash
if (hash && hash.includes('access_token')) {
  const params = new URLSearchParams(hash.slice(1))
  const access_token  = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
      console.log('[supabaseClient] setSession:', data?.session?.user?.email, error)
      if (!error) window.history.replaceState(null, '', window.location.pathname)
    })
  }
}
