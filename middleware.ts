import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: { path?: string }) {
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            httpOnly: true,
          })
        },
        remove(name: string, options: { path?: string }) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if available
  await supabase.auth.getUser()

  // Add security headers for content security policy
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self' https://*.supabase.co wss://*.daily.co https://*.daily.co;  wedebate-q5p3jywe.livekit.cloud wss://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud wss://*.livekit.cloud;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';

    frame-src 'self' https://*.daily.co; wedebate-q5p3jywe.livekit.cloud wss://wedebate-q5p3jywe.livekit.cloud https://*.livekit.cloud wss://*.livekit.cloud;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
    media-src 'self' blob:;
    worker-src 'self' blob:;
    base-uri 'self';
    form-action 'self';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  // Set security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    // Match all paths except public files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

