import { createClient } from '@/utils/supabase/client';

export async function checkAndSetupDatabase() {
  const supabase = createClient();
  
  try {
    // Check if required tables exist by trying to query them
    const checks = await Promise.allSettled([
      supabase.from('debate_feedback').select('id').limit(1),
      supabase.from('practice_sessions').select('id').limit(1),
    ]);
    
    const missingTables = [];
    
    if (checks[0].status === 'rejected') {
      missingTables.push('debate_feedback');
    }
    
    if (checks[1].status === 'rejected') {
      missingTables.push('practice_sessions');
    }
    
    if (missingTables.length > 0) {
      console.warn('Missing database tables:', missingTables);
      console.warn('Please run the database-setup.sql script in your Supabase SQL editor');
      return {
        success: false,
        missingTables,
        message: 'Some database tables are missing. Please run the database setup script.'
      };
    }
    
    return {
      success: true,
      message: 'All required database tables are present.'
    };
    
  } catch (error) {
    console.error('Error checking database setup:', error);
    return {
      success: false,
      error,
      message: 'Failed to check database setup.'
    };
  }
}

export async function createMissingTables() {
  const supabase = createClient();
  
  try {
    // This would require admin privileges, so we'll just log instructions
    console.log('To create missing tables, run the following SQL in your Supabase SQL editor:');
    console.log(`
-- Create debate_feedback table
CREATE TABLE IF NOT EXISTS public.debate_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic TEXT NOT NULL,
    creator_arguments TEXT NOT NULL,
    opponent_arguments TEXT NOT NULL,
    feedback JSONB NOT NULL,
    is_ai_response BOOLEAN DEFAULT false,
    clarity INTEGER CHECK (clarity >= 1 AND clarity <= 10),
    logic INTEGER CHECK (logic >= 1 AND logic <= 10),
    persuasiveness INTEGER CHECK (persuasiveness >= 1 AND persuasiveness <= 10)
);

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    topic TEXT NOT NULL,
    duration INTEGER,
    arguments_count INTEGER DEFAULT 0,
    feedback JSONB,
    completed BOOLEAN DEFAULT false
);

-- Enable RLS and create policies (see database-setup.sql for complete setup)
    `);
    
    return {
      success: false,
      message: 'Cannot create tables from client. Please run the SQL manually in Supabase.'
    };
    
  } catch (error) {
    console.error('Error in createMissingTables:', error);
    return {
      success: false,
      error,
      message: 'Failed to create tables.'
    };
  }
}