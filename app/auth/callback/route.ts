import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options, path: '/' });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options, path: '/' });
          },
        },
      }
    );
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/signin?error=auth-error', request.url));
      }

      // Check if user has a profile, if not create one
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error getting user:', userError);
        return NextResponse.redirect(new URL('/auth/signin?error=profile-error', request.url));
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile && !profileError) {
        // Create profile
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          username: user.user_metadata.name || user.email?.split('@')[0] || 'user',
          debates_won: 0,
          debates_participated: 0,
        });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          return NextResponse.redirect(new URL('/auth/signin?error=profile-creation-error', request.url));
        }
      }

      // Successful authentication and profile setup
      const returnTo = requestUrl.searchParams.get('returnTo') || '/debate';
      return NextResponse.redirect(new URL(returnTo, request.url));

    } catch (error) {
      console.error('Unexpected error during auth:', error);
      return NextResponse.redirect(new URL('/auth/signin?error=unknown', request.url));
    }
  }

  // No code present, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', request.url));
      
    

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin);
}