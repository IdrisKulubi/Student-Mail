-- Streak Activity Log Enhancement
-- This migration adds a table to track all streak-related activities and XP gains

-- 1. Create streak_activities table to log all XP-earning activities
CREATE TABLE public.streak_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('email_read', 'daily_streak', 'weekly_bonus', 'monthly_bonus', 'milestone_bonus')) NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_day INTEGER, -- The streak day when this activity occurred
  description TEXT, -- Human-readable description of the activity
  metadata JSONB, -- Additional data (email_id, milestone_reached, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX idx_streak_activities_user_id ON public.streak_activities(user_id);
CREATE INDEX idx_streak_activities_created_at ON public.streak_activities(created_at);
CREATE INDEX idx_streak_activities_activity_type ON public.streak_activities(activity_type);

-- 3. Enable RLS on the new table
ALTER TABLE public.streak_activities ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for streak activities
CREATE POLICY "Users can access own streak activities" ON public.streak_activities
  FOR ALL USING (auth.uid() = user_id);

-- 5. Add a function to get user's recent streak activities
CREATE OR REPLACE FUNCTION get_user_streak_activities(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  xp_earned INTEGER,
  streak_day INTEGER,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.activity_type,
    sa.xp_earned,
    sa.streak_day,
    sa.description,
    sa.metadata,
    sa.created_at
  FROM public.streak_activities sa
  WHERE sa.user_id = p_user_id
  ORDER BY sa.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 6. Add a function to get user's XP summary by activity type
CREATE OR REPLACE FUNCTION get_user_xp_summary(p_user_id UUID)
RETURNS TABLE (
  activity_type TEXT,
  total_xp INTEGER,
  activity_count INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.activity_type,
    SUM(sa.xp_earned)::INTEGER as total_xp,
    COUNT(*)::INTEGER as activity_count,
    MAX(sa.created_at) as last_activity
  FROM public.streak_activities sa
  WHERE sa.user_id = p_user_id
  GROUP BY sa.activity_type
  ORDER BY total_xp DESC;
END;
$$;

-- 7. Create a trigger function to automatically log streak activities
CREATE OR REPLACE FUNCTION log_streak_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- This trigger can be used to automatically log certain activities
  -- For now, we'll handle logging manually in the application
  RETURN NEW;
END;
$$;

-- 8. Add some sample data for testing (optional - remove in production)
-- INSERT INTO public.streak_activities (user_id, activity_type, xp_earned, streak_day, description, metadata)
-- SELECT 
--   id as user_id,
--   'email_read' as activity_type,
--   5 as xp_earned,
--   1 as streak_day,
--   'Read first email of the day' as description,
--   '{"email_count": 1}'::jsonb as metadata
-- FROM public.users
-- LIMIT 1;

SELECT 'Streak activity tracking enhancement completed successfully!' as message; 