import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 30, // 30 days
            })
          })
        },
      },
    }
  )

  // This will refresh the session if needed
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Log session status for debugging
  if (error) {
    console.log('Middleware auth error:', error.message)
  } else if (user) {
    console.log('Middleware: User authenticated:', user.email)
  } else {
    console.log('Middleware: No authenticated user')
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https: *.googleusercontent.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co https://api.daily.co https://*.daily.co wss://*.daily.co https://wedebate-q5p3jywe.livekit.cloud wss://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud wss://*.livekit.cloud https://accounts.google.com https://openrouter.ai https://api.openrouter.ai;
    frame-src 'self' https://*.daily.co https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud https://accounts.google.com;
    media-src 'self' blob: data: https://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud mediastream:;
    worker-src 'self' blob:;
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
    object-src 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
