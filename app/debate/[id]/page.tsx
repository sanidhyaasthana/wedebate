'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DebateRoom from '@/components/debate/DebateRoom';

export default function DebateRoomPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const debateId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [debate, setDebate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        // Redirect to sign in if not authenticated
        router.push(`/auth/signin?redirect=/debate/${debateId}`);
        return;
      }
      
      // Fetch debate details
      fetchDebate();
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          router.push(`/auth/signin?redirect=/debate/${debateId}`);
        }
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, debateId, router]);

  // Fetch debate details
  const fetchDebate = async () => {
    try {
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('id', debateId)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        setError('Debate not found');
        setLoading(false);
        return;
      }
      
      setDebate(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching debate:', error);
      setError(error.message || 'Failed to load debate');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">Error</h2>
          <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/debate')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Back to Debates
          </button>
        </div>
      </div>
    );
  }

  const dailyRoomUrl = debate?.daily_room_url;

  if (!debate) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400 mb-4">Debate Not Found</h2>
          <p className="text-yellow-600 dark:text-yellow-300 mb-6">The debate you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/debate')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Back to Debates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {user?.id && debateId && (
        <DebateRoom 
          debateId={debateId} 
          userId={user.id} 
          dailyRoomUrl={dailyRoomUrl}
        />
      )}
    </div>
  );
}