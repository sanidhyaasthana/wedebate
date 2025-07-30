'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Helper function to persist user data
  const persistUserData = (userData: User | null) => {
    if (typeof window !== 'undefined') {
      if (userData) {
        localStorage.setItem('wedebate_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('wedebate_user');
      }
    }
  };

  // Helper function to restore user data
  const restoreUserData = (): User | null => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('wedebate_user');
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.error('Error restoring user data:', error);
        localStorage.removeItem('wedebate_user');
      }
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    // Restore user data immediately from localStorage for faster UI updates
    const restoredUser = restoreUserData();
    if (restoredUser && mounted) {
      setUser(restoredUser);
      setLoading(false); // Set loading to false immediately if we have cached data
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          // Clear any stale localStorage data
          persistUserData(null);
        } else {
          if (mounted) {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            persistUserData(currentUser);
            console.log('Initial session loaded:', currentUser?.email || 'No user');
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        persistUserData(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up automatic token refresh
    const refreshSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Error refreshing session:', error);
        } else if (session && mounted) {
          setSession(session);
          setUser(session.user);
          console.log('Session refreshed successfully');
        }
      } catch (error) {
        console.error('Error in refreshSession:', error);
      }
    };

    // Refresh session every 30 minutes
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);

    // Refresh session when window gains focus (user comes back to tab)
    const handleFocus = () => {
      refreshSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        if (mounted) {
          const currentUser = session?.user ?? null;
          setSession(session);
          setUser(currentUser);
          persistUserData(currentUser);
          setLoading(false);

          // Handle session refresh
          if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
          }

          // Handle sign out
          if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setSession(null);
            setUser(null);
            persistUserData(null);
          }

          // Handle sign in
          if (event === 'SIGNED_IN') {
            console.log('User signed in:', session?.user?.email);
            persistUserData(currentUser);
          }

          // Handle initial session
          if (event === 'INITIAL_SESSION') {
            console.log('Initial session event:', session?.user?.email || 'No user');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        // Clear localStorage immediately
        persistUserData(null);
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}