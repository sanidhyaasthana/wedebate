-- Database setup script for WeDebate application
-- Run this in your Supabase SQL editor

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
    duration INTEGER, -- in seconds
    arguments_count INTEGER DEFAULT 0,
    feedback JSONB,
    completed BOOLEAN DEFAULT false
);

-- Add format column to debates table if it doesn't exist
ALTER TABLE public.debates 
ADD COLUMN IF NOT EXISTS format TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debate_feedback_user_id ON public.debate_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_debate_feedback_created_at ON public.debate_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.debate_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debate_feedback
CREATE POLICY "Users can view their own feedback" ON public.debate_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback" ON public.debate_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.debate_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" ON public.debate_feedback
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON public.practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" ON public.practice_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice sessions" ON public.practice_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Update existing RLS policies for profiles table (if needed)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Update existing RLS policies for debates table (if needed)
DROP POLICY IF EXISTS "Users can view debates they participate in" ON public.debates;
DROP POLICY IF EXISTS "Users can create debates" ON public.debates;
DROP POLICY IF EXISTS "Users can update debates they created" ON public.debates;

CREATE POLICY "Users can view debates they participate in" ON public.debates
    FOR SELECT USING (
        auth.uid() = creator_id OR 
        auth.uid() = opponent_id OR
        status = 'waiting'
    );

CREATE POLICY "Users can create debates" ON public.debates
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update debates they participate in" ON public.debates
    FOR UPDATE USING (
        auth.uid() = creator_id OR 
        auth.uid() = opponent_id
    );

-- Update existing RLS policies for debate_arguments table (if needed)
DROP POLICY IF EXISTS "Users can view arguments from debates they participate in" ON public.debate_arguments;
DROP POLICY IF EXISTS "Users can insert their own arguments" ON public.debate_arguments;

CREATE POLICY "Users can view arguments from debates they participate in" ON public.debate_arguments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.debates 
            WHERE debates.id = debate_arguments.debate_id 
            AND (debates.creator_id = auth.uid() OR debates.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own arguments" ON public.debate_arguments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to extract numeric scores from feedback JSON
CREATE OR REPLACE FUNCTION extract_feedback_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract numeric scores from the feedback JSON if they exist
    IF NEW.feedback IS NOT NULL THEN
        NEW.clarity := COALESCE((NEW.feedback->>'clarity')::INTEGER, NEW.clarity);
        NEW.logic := COALESCE((NEW.feedback->>'logic')::INTEGER, NEW.logic);
        NEW.persuasiveness := COALESCE((NEW.feedback->>'persuasiveness')::INTEGER, NEW.persuasiveness);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically extract scores from feedback
DROP TRIGGER IF EXISTS extract_scores_trigger ON public.debate_feedback;
CREATE TRIGGER extract_scores_trigger
    BEFORE INSERT OR UPDATE ON public.debate_feedback
    FOR EACH ROW
    EXECUTE FUNCTION extract_feedback_scores();

-- Grant necessary permissions
GRANT ALL ON public.debate_feedback TO authenticated;
GRANT ALL ON public.practice_sessions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;