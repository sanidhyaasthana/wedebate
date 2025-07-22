'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DebateRoom from '@/components/debate/DebateRoom';
import { sampleDebateTopics, debateFormats } from '@/utils/aiPrompts';
import { nanoid } from 'nanoid';

export default function DebatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDebates, setActiveDebates] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDebate, setNewDebate] = useState({
    topic: searchParams.get('topic') || '',
    format: 'standard',
    isPublic: true
  });
  const [createdDebate, setCreatedDebate] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchActiveDebates();
      }
      setLoading(false);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchActiveDebates();
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch active debates
  const fetchActiveDebates = async () => {
    try {
      const { data, error } = await supabase
        .from('debates')
        .select('*')
        .eq('status', 'waiting')
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setActiveDebates(data || []);
    } catch (error) {
      console.error('Error fetching debates:', error || error);
    }
  };

  // Create new debate
  const handleCreateDebate = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=/debate');
      return;
    }
    try {
      const joinKey = nanoid(8);
      const { data, error } = await supabase
        .from('debates')
        .insert([
          {
            topic: newDebate.topic,
            format: newDebate.format,
            is_public: newDebate.isPublic,
            creator_id: user.id,
            status: 'waiting',
            join_key: joinKey
          }
        ])
        .select();
      if (error) throw error;
      
      if (data && data[0]) {
        // Create a Daily.co room for the debate
        const debateId = data[0].id;
        const dailyResponse = await fetch('/api/daily/create-room', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ debateId }),
        });
        
        if (!dailyResponse.ok) {
          throw new Error('Failed to create video room');
        }
        
        const dailyData = await dailyResponse.json();
        
        // Update the debate with the Daily.co room URL
        const { error: updateError } = await supabase
          .from('debates')
          .update({ daily_room_url: dailyData.url })
          .eq('id', debateId);
          
        if (updateError) throw updateError;
        
        // Set the created debate with the updated data
        const { data: updatedDebate, error: fetchError } = await supabase
          .from('debates')
          .select('*')
          .eq('id', debateId)
          .single();
          
        if (fetchError) throw fetchError;
        
        setCreatedDebate(updatedDebate);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating debate:', error);
      console.error('Failed to create debate. Please try again.');
    }
  };

  // Join existing debate
  const handleJoinDebate = (debateId: string) => {
    if (!user) {
      router.push(`/auth/signin?redirect=/debate/${debateId}`);
      return;
    }
    
    router.push(`/debate/${debateId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Debate Arena</h1>
      
      {/* Create Debate Button */}
      <div className="mb-12">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
        >
          Start a New Debate
        </button>
      </div>
      
      {/* Active Debates List */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Join an Active Debate</h2>
        
        {activeDebates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow-md">
            <p className="text-gray-600 dark:text-gray-300 mb-4">No active debates available at the moment.</p>
            <p className="text-gray-600 dark:text-gray-300">Start your own debate or try again later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDebates.map((debate) => (
              <div key={debate.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 line-clamp-2">{debate.topic}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  Format: {debateFormats[debate.format]?.name || debate.format}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Created {new Date(debate.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleJoinDebate(debate.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Sample Topics */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Popular Debate Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleDebateTopics.slice(0, 6).map((topic, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-medium mb-4">{topic}</p>
              <button
                onClick={() => {
                  setNewDebate({ ...newDebate, topic });
                  setShowCreateModal(true);
                }}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center"
              >
                Debate this topic
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Create Debate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Create a New Debate</h2>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="topic">
                Debate Topic
              </label>
              <input
                id="topic"
                type="text"
                value={newDebate.topic}
                onChange={(e) => setNewDebate({ ...newDebate, topic: e.target.value })}
                placeholder="Enter a debate topic"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="format">
                Debate Format
              </label>
              <select
                id="format"
                value={newDebate.format}
                onChange={(e) => setNewDebate({ ...newDebate, format: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {Object.entries(debateFormats).map(([key, format]) => (
                  <option key={key} value={key}>
                    {format.name} ({format.description})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newDebate.isPublic}
                  onChange={(e) => setNewDebate({ ...newDebate, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Make this debate public</span>
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Public debates can be joined by anyone. Private debates require a direct link.
              </p>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDebate}
                disabled={!newDebate.topic.trim()}
                className={`px-4 py-2 rounded-lg text-white transition duration-200 ${newDebate.topic.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
              >
                Create Debate
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!user && (
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-3">Sign In to Start Debating</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Create an account or sign in to start your own debates and join others.
          </p>
          <Link
            href="/auth/signin?redirect=/debate"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Sign In / Sign Up
          </Link>
        </div>
      )}
      {/* Show shareable link after creation */}
      {createdDebate && (
        <div className="mt-8 bg-green-50 dark:bg-green-900/30 rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-3">Debate Created!</h3>
          <p className="mb-2">Share this link for others to join your debate:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/debate/join/${createdDebate.join_key}`}
              className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700"
              onFocus={e => e.target.select()}
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/debate/join/${createdDebate.join_key}`)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >Copy</button>
          </div>
        </div>
      )}
    </div>
  );
}