import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      cookies: {
        getAll() {
          if (typeof document !== 'undefined') {
            return document.cookie
              .split('; ')
              .map(cookie => {
                const [name, ...rest] = cookie.split('=');
                return { name, value: rest.join('=') };
              })
              .filter(cookie => cookie.name);
          }
          return [];
        },
        setAll(cookiesToSet) {
          if (typeof document !== 'undefined') {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                path: '/',
                maxAge: 60 * 60 * 24 * 30, // 30 days for better persistence
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                ...options
              };
              
              let cookieString = `${name}=${value}; path=${cookieOptions.path}; max-age=${cookieOptions.maxAge}; samesite=${cookieOptions.sameSite}`;
              
              if (cookieOptions.secure) {
                cookieString += '; secure';
              }
              
              document.cookie = cookieString;
            });
          }
        },
      },
    }
  )
}
