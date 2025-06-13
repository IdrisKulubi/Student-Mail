

ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  school_domain TEXT,
  university TEXT,
  major TEXT,
  graduation_year INTEGER,
  career_goals TEXT,
  total_xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_email_check TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Emails table
CREATE TABLE public.emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  gmail_id TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  body_preview TEXT,
  full_body TEXT,
  ai_summary TEXT,
  category TEXT CHECK (category IN ('Events', 'Jobs', 'Finance', 'Class', 'Other')),
  is_read BOOLEAN DEFAULT FALSE,
  is_important BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo_url TEXT,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('Full-time', 'Part-time', 'Internship', 'Contract')),
  application_deadline DATE,
  external_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Job Applications table
CREATE TABLE public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Applied', 'Under Review', 'Interview', 'Rejected', 'Accepted')) DEFAULT 'Applied',
  cover_letter TEXT,
  resume_url TEXT,
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 5. Resumes table
CREATE TABLE public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_id TEXT NOT NULL,
  content JSONB NOT NULL,
  pdf_url TEXT,
  docx_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Mood Entries table
CREATE TABLE public.mood_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5) NOT NULL,
  mood_emoji TEXT,
  notes TEXT,
  journal_entry TEXT,
  ai_reflection TEXT,
  entry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- 7. Confessions table
CREATE TABLE public.confessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  reaction_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Confession Reactions table
CREATE TABLE public.confession_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'support', 'relate', 'hug')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(confession_id, user_id)
);

-- 9. Tickets table
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES public.users(id),
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_location TEXT,
  original_price DECIMAL(10,2),
  selling_price DECIMAL(10,2) NOT NULL,
  ticket_image_url TEXT,
  description TEXT,
  is_urgent BOOLEAN DEFAULT FALSE,
  status TEXT CHECK (status IN ('Available', 'Pending', 'Sold', 'Cancelled')) DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Friendships table
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Pending', 'Accepted', 'Blocked')) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 12. Daily Challenges table
CREATE TABLE public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  category TEXT CHECK (category IN ('Wellness', 'Social', 'Productivity', 'Health')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. User Challenge Completions table
CREATE TABLE public.user_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date DATE NOT NULL,
  UNIQUE(user_id, challenge_id, completion_date)
);

-- Create indexes for better performance
CREATE INDEX idx_emails_user_id ON public.emails(user_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at);
CREATE INDEX idx_job_applications_user_id ON public.job_applications(user_id);
CREATE INDEX idx_mood_entries_user_id ON public.mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON public.mood_entries(entry_date);
CREATE INDEX idx_tickets_seller_id ON public.tickets(seller_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Can only access their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Emails: Users can only access their own emails
CREATE POLICY "Users can access own emails" ON public.emails
  FOR ALL USING (auth.uid() = user_id);

-- Jobs: Publicly readable, authenticated users can apply
CREATE POLICY "Jobs are publicly readable" ON public.jobs
  FOR SELECT USING (true);

-- Job Applications: Users can only access their own applications
CREATE POLICY "Users can access own job applications" ON public.job_applications
  FOR ALL USING (auth.uid() = user_id);

-- Resumes: Users can only access their own resumes
CREATE POLICY "Users can access own resumes" ON public.resumes
  FOR ALL USING (auth.uid() = user_id);

-- Mood Entries: Users can only access their own mood entries
CREATE POLICY "Users can access own mood entries" ON public.mood_entries
  FOR ALL USING (auth.uid() = user_id);

-- Confessions: Users can read all, but only manage their own
CREATE POLICY "Users can read all confessions" ON public.confessions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own confessions" ON public.confessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own confessions" ON public.confessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own confessions" ON public.confessions
  FOR DELETE USING (auth.uid() = user_id);

-- Confession Reactions: Users can manage their own reactions
CREATE POLICY "Users can manage own reactions" ON public.confession_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Tickets: Users can read all, but only manage their own
CREATE POLICY "Users can read all tickets" ON public.tickets
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own tickets" ON public.tickets
  FOR ALL USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Messages: Users can only access messages for their tickets
CREATE POLICY "Users can access ticket messages" ON public.messages
  FOR ALL USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    EXISTS (
      SELECT 1 FROM public.tickets 
      WHERE id = ticket_id AND (seller_id = auth.uid() OR buyer_id = auth.uid())
    )
  );

-- Friendships: Users can manage their own friendships
CREATE POLICY "Users can manage own friendships" ON public.friendships
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Daily Challenges: Publicly readable
CREATE POLICY "Challenges are publicly readable" ON public.daily_challenges
  FOR SELECT USING (true);

-- User Challenge Completions: Users can only access their own completions
CREATE POLICY "Users can access own challenge completions" ON public.user_challenge_completions
  FOR ALL USING (auth.uid() = user_id);

INSERT INTO public.daily_challenges (title, description, category, xp_reward) VALUES
('Drink 8 glasses of water', 'Stay hydrated throughout the day', 'Health', 10),
('Take 3 deep breaths', 'Practice mindfulness with breathing exercises', 'Wellness', 5),
('Send a compliment', 'Make someone''s day better with a kind word', 'Social', 15),
('Read for 30 minutes', 'Expand your knowledge with reading', 'Productivity', 20),
('Take a 10-minute walk', 'Get some fresh air and movement', 'Health', 10),
('Write in your journal', 'Reflect on your day and thoughts', 'Wellness', 15),
('Call a friend or family member', 'Connect with someone you care about', 'Social', 20),
('Organize your workspace', 'Create a clean and productive environment', 'Productivity', 10);

SELECT 'Database setup completed successfully! All tables and policies have been created.' as message; 