'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AuthForm from '@/components/auth/AuthForm';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [loading, setLoading] = useState(true);
  
  // Check if user is already signed in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already signed in, redirect
        router.push(redirectTo);
        return;
      }
      setLoading(false);
    };
    
    checkUser();
  }, [supabase, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Sign In</h1>
        
        <AuthForm 
          mode="signin" 
          redirectTo={redirectTo} 
        />
        
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Don't have an account?{' '}
            <Link 
              href={`/auth/signup${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}