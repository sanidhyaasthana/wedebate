'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/utils/supabase/client';
import { checkAndSetupDatabase } from '@/utils/database-setup';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const supabase = createClient();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDebates: 0,
    completedDebates: 0,
    averageClarity: 0,
    averageLogic: 0,
    averagePersuasiveness: 0,
    practiceSessions: 0
  });
  const [debateHistory, setDebateHistory] = useState<any[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'debates' | 'practice'>('debates');
  const [databaseStatus, setDatabaseStatus] = useState<string | null>(null);
  
  // Check authentication status and load data
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth/signin?redirect=/profile');
      return;
    }

    // Check database setup first
    checkAndSetupDatabase().then((result) => {
      if (!result.success) {
        setDatabaseStatus(result.message);
        console.warn('Database setup issue:', result);
      }
    });

    // Load user data
    fetchUserProfile(user.id);
    fetchUserStats(user.id);
    fetchDebateHistory(user.id);
    fetchPracticeHistory(user.id);
    setLoading(false);
  }, [user, authLoading, router]);

  // Fetch user profile
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setProfile(data || { id: userId, username: 'User' });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch user stats
  const fetchUserStats = async (userId: string) => {
    try {
      console.log('Fetching stats for user:', userId);
      
      // Get debate stats
      const { data: debatesData, error: debatesError } = await supabase
        .from('debates')
        .select('id, status')
        .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`);
      
      if (debatesError) {
        console.error('Error fetching debates:', debatesError);
        // Don't throw, continue with other queries
      }
      
      const totalDebates = debatesData?.length || 0;
      const completedDebates = debatesData?.filter(d => d.status === 'completed').length || 0;
      console.log('Debate stats:', { totalDebates, completedDebates });
      
      // Get feedback stats - handle case where table might not exist
      let avgClarity = 0;
      let avgLogic = 0;
      let avgPersuasiveness = 0;
      
      try {
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('debate_feedback')
          .select('clarity, logic, persuasiveness')
          .eq('user_id', userId);
        
        if (feedbackError) {
          console.error('Error fetching feedback (table might not exist):', feedbackError);
        } else if (feedbackData && feedbackData.length > 0) {
          avgClarity = feedbackData.reduce((sum, item) => sum + (item.clarity || 0), 0) / feedbackData.length;
          avgLogic = feedbackData.reduce((sum, item) => sum + (item.logic || 0), 0) / feedbackData.length;
          avgPersuasiveness = feedbackData.reduce((sum, item) => sum + (item.persuasiveness || 0), 0) / feedbackData.length;
          console.log('Feedback stats:', { avgClarity, avgLogic, avgPersuasiveness });
        }
      } catch (feedbackError) {
        console.error('Feedback table query failed (table might not exist):', feedbackError);
      }
      
      // Get practice stats - handle case where table might not exist
      let practiceSessions = 0;
      try {
        const { data: practiceData, error: practiceError } = await supabase
          .from('practice_sessions')
          .select('id')
          .eq('user_id', userId);
        
        if (practiceError) {
          console.error('Error fetching practice sessions (table might not exist):', practiceError);
        } else {
          practiceSessions = practiceData?.length || 0;
          console.log('Practice sessions:', practiceSessions);
        }
      } catch (practiceError) {
        console.error('Practice sessions table query failed (table might not exist):', practiceError);
      }
      
      setStats({
        totalDebates,
        completedDebates,
        averageClarity: parseFloat(avgClarity.toFixed(1)),
        averageLogic: parseFloat(avgLogic.toFixed(1)),
        averagePersuasiveness: parseFloat(avgPersuasiveness.toFixed(1)),
        practiceSessions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch debate history
  const fetchDebateHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('debates')
        .select(`
          id, topic, format, status, created_at, creator_id, opponent_id
        `)
        .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Fetch creator and opponent profiles separately
      const debatesWithProfiles = await Promise.all(
        (data || []).map(async (debate) => {
          const [creatorProfile, opponentProfile] = await Promise.all([
            debate.creator_id ? supabase
              .from('profiles')
              .select('id, username')
              .eq('id', debate.creator_id)
              .single() : null,
            debate.opponent_id ? supabase
              .from('profiles')
              .select('id, username')
              .eq('id', debate.opponent_id)
              .single() : null
          ]);
          
          return {
            ...debate,
            creator: creatorProfile?.data || { id: debate.creator_id, username: 'Unknown' },
            opponent: opponentProfile?.data || { id: debate.opponent_id, username: 'Unknown' }
          };
        })
      );
      
      setDebateHistory(debatesWithProfiles);
    } catch (error) {
      console.error('Error fetching debate history:', error);
    }
  };

  // Fetch practice history
  const fetchPracticeHistory = async (userId: string) => {
    try {
      console.log('Fetching practice history for user:', userId);
      
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching practice history (table might not exist):', error);
        setPracticeHistory([]);
        return;
      }
      
      console.log('Practice history data:', data);
      setPracticeHistory(data || []);
    } catch (error) {
      console.error('Error fetching practice history:', error);
      setPracticeHistory([]);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setProfile({ ...profile, username });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {databaseStatus && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Database Setup Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>{databaseStatus}</p>
                <p className="mt-1">
                  Please run the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">database-setup.sql</code> script in your Supabase SQL editor to enable all features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
            <h2 className="text-2xl font-semibold mb-6">Profile</h2>
            
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">{profile?.username || 'User'}</h3>
                <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="mb-6">
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={profile?.username || ''}
                  placeholder="Enter a username"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Update Profile
              </button>
            </form>
            
            <button
              onClick={async () => {
                await signOut();
                router.push('/');
              }}
              className="w-full border border-red-500 text-red-500 font-bold py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition duration-200"
            >
              Sign Out
            </button>
          </div>
          
          {/* Stats Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Your Stats</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Debates</p>
                <p className="text-2xl font-bold">{stats.totalDebates}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold">{stats.completedDebates}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Practice Sessions</p>
                <p className="text-2xl font-bold">{stats.practiceSessions}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold">
                  {stats.completedDebates > 0 ? `${Math.round((stats.completedDebates / stats.totalDebates) * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Average Scores</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Clarity</span>
                  <span>{stats.averageClarity}/10</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(stats.averageClarity / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Logic</span>
                  <span>{stats.averageLogic}/10</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${(stats.averageLogic / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Persuasiveness</span>
                  <span>{stats.averagePersuasiveness}/10</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-purple-600 h-2.5 rounded-full" 
                    style={{ width: `${(stats.averagePersuasiveness / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* History Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('debates')}
                className={`py-3 px-4 font-medium ${activeTab === 'debates' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Debate History
              </button>
              <button
                onClick={() => setActiveTab('practice')}
                className={`py-3 px-4 font-medium ${activeTab === 'practice' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Practice History
              </button>
            </div>
            
            {activeTab === 'debates' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Your Debate History</h2>
                
                {debateHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't participated in any debates yet.</p>
                    <Link
                      href="/debate"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                    >
                      Start Debating
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {debateHistory.map((debate) => (
                      <div key={debate.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold">{debate.topic}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(debate.status)}`}>
                            {formatStatus(debate.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {debate.creator?.username || 'User'} vs. {debate.opponent?.username || 'Waiting for opponent'}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(debate.created_at).toLocaleDateString()}
                          </span>
                          <Link
                            href={`/debate/${debate.id}`}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                          >
                            View Debate
                          </Link>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-6">
                      <Link
                        href="/debate"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View All Debates
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'practice' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Your Practice Sessions</h2>
                
                {practiceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">You haven't completed any practice sessions yet.</p>
                    <Link
                      href="/practice"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                    >
                      Start Practicing
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {practiceHistory.map((session) => (
                      <div key={session.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2">{session.topic}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Position: <span className="font-medium">{session.user_position === 'for' ? 'Supporting' : 'Opposing'}</span>
                        </p>
                        <div className="flex gap-4 mb-3">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Clarity</span>
                            <p className="font-semibold">{session.feedback?.clarity || 'N/A'}/10</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Logic</span>
                            <p className="font-semibold">{session.feedback?.logic || 'N/A'}/10</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Persuasiveness</span>
                            <p className="font-semibold">{session.feedback?.persuasiveness || 'N/A'}/10</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => {
                              // View practice details (could be implemented with a modal)
                              alert('Practice session details view not implemented in MVP');
                            }}
                            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-6">
                      <Link
                        href="/practice"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Practice More
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}

function formatStatus(status: string) {
  switch (status) {
    case 'waiting':
      return 'Waiting';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}