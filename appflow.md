# 🚀 University Student App - Development Workflow

## 📋 Project Overview
A cross-platform mobile app built with React Native + Expo and Supabase backend to help university students manage emails, find jobs, build resumes, track mental health, and trade event tickets.

---

## 🗄️ Database Schema Design (Supabase)

### Core Tables

#### 1. **users** (extends Supabase auth.users)
```sql
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
```

#### 2. **emails**
```sql
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
```

#### 3. **jobs**
```sql
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
```

#### 4. **job_applications**
```sql
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
```

#### 5. **resumes**
```sql
CREATE TABLE public.resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_id TEXT NOT NULL,
  content JSONB NOT NULL, -- Structured resume data
  pdf_url TEXT,
  docx_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. **mood_entries**
```sql
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
```

#### 7. **confessions**
```sql
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
```

#### 8. **confession_reactions**
```sql
CREATE TABLE public.confession_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  confession_id UUID REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('heart', 'support', 'relate', 'hug')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(confession_id, user_id)
);
```

#### 9. **tickets**
```sql
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
```

#### 10. **messages**
```sql
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 11. **friendships**
```sql
CREATE TABLE public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Pending', 'Accepted', 'Blocked')) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
```

#### 12. **daily_challenges**
```sql
CREATE TABLE public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 10,
  category TEXT CHECK (category IN ('Wellness', 'Social', 'Productivity', 'Health')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 13. **user_challenge_completions**
```sql
CREATE TABLE public.user_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date DATE NOT NULL,
  UNIQUE(user_id, challenge_id, completion_date)
);
```

---

## 🔧 Development Phases

### Phase 1: Foundation Setup (Week 1-2)
#### 1.1 Project Initialization
- [ ] Create Expo React Native project
- [ ] Set up TypeScript configuration
- [ ] Install and configure essential dependencies
- [ ] Set up folder structure and navigation

#### 1.2 Supabase Setup
- [ ] Create Supabase project
- [ ] Set up database tables (run SQL scripts above)
- [ ] Configure Row Level Security (RLS) policies
- [ ] Set up Supabase client in React Native
- [ ] Configure Google OAuth with Supabase Auth

#### 1.3 Authentication Flow
- [ ] Implement Google OAuth login
- [ ] Create user profile setup screen
- [ ] Set up protected routes
- [ ] Implement logout functionality

### Phase 2: Core Features - Email & Gamification (Week 3-4)
#### 2.1 Gmail Integration
- [ ] Set up Gmail API credentials
- [ ] Implement email fetching service
- [ ] Create email filtering logic (school-relevant)
- [ ] Set up email caching system
- [ ] Implement AI email summarization (OpenAI)

#### 2.2 Email UI & Gamification
- [ ] Design email list interface
- [ ] Implement email detail view
- [ ] Create streak tracking system
- [ ] Build XP and leveling system
- [ ] Design leaderboard interface

### Phase 3: Job Features (Week 5-6)
#### 3.1 Job Swiping Interface
- [ ] Create Tinder-style swipe component
- [ ] Design job card UI
- [ ] Implement swipe gestures and animations
- [ ] Set up job data management

#### 3.2 Job Application System
- [ ] Build job application tracker
- [ ] Implement application status updates
- [ ] Create job search and filtering
- [ ] Set up job recommendation algorithm

### Phase 4: Resume Builder (Week 7)
#### 4.1 Resume Creation
- [ ] Design resume templates
- [ ] Build form-based resume editor
- [ ] Implement AI resume generation
- [ ] Set up PDF/DOCX export functionality

#### 4.2 Cover Letter Generator
- [ ] Create cover letter templates
- [ ] Implement AI-powered cover letter generation
- [ ] Build editing interface
- [ ] Add export options

### Phase 5: Mental Health Hub (Week 8-9)
#### 5.1 Mood Tracking
- [ ] Create mood entry interface
- [ ] Implement mood analytics and trends
- [ ] Build streak system for mood tracking
- [ ] Design mood calendar view

#### 5.2 Journaling & Confessions
- [ ] Build journaling interface with AI assistance
- [ ] Create anonymous confessions board
- [ ] Implement content moderation system
- [ ] Add reaction and interaction features

#### 5.3 Daily Challenges
- [ ] Create challenge system
- [ ] Implement challenge completion tracking
- [ ] Build wellness resource center
- [ ] Add mindfulness features

### Phase 6: Ticket Marketplace (Week 10)
#### 6.1 Ticket Listing
- [ ] Create ticket posting form
- [ ] Implement image upload for tickets
- [ ] Build ticket browsing interface
- [ ] Add search and filtering

#### 6.2 Messaging System
- [ ] Implement real-time chat for ticket transactions
- [ ] Create conversation management
- [ ] Add notification system
- [ ] Build transaction status tracking

### Phase 7: Social Features (Week 11)
#### 7.1 Friends & Social
- [ ] Implement friend request system
- [ ] Create friend leaderboards
- [ ] Build user profile pages
- [ ] Add social activity feeds

#### 7.2 Notifications
- [ ] Set up push notification system
- [ ] Implement smart notification logic
- [ ] Create notification preferences
- [ ] Add in-app notification center

### Phase 8: Admin Panel (Week 12)
#### 8.1 Web Admin Interface
- [ ] Create admin dashboard
- [ ] Build job posting management
- [ ] Implement content moderation tools
- [ ] Add analytics and reporting

### Phase 9: Testing & Polish (Week 13-14)
#### 9.1 Testing
- [ ] Unit testing for core functions
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Performance optimization

#### 9.2 Deployment Preparation
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Prepare app store submissions
- [ ] Create user documentation

---

## 🔒 Supabase Security Policies (RLS)

### Users Table
```sql
-- Users can only read/update their own profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

### Emails Table
```sql
-- Users can only access their own emails
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own emails" ON public.emails
  FOR ALL USING (auth.uid() = user_id);
```

### Jobs Table
```sql
-- Jobs are publicly readable, only admins can create/update
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs are publicly readable" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage jobs" ON public.jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND email LIKE '%@admin.%'
    )
  );
```

---

## 🛠️ Key Dependencies

### React Native/Expo
```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@react-navigation/native": "^6.x.x",
  "@react-navigation/stack": "^6.x.x",
  "expo-auth-session": "^5.x.x",
  "expo-google-app-auth": "^11.x.x",
  "react-native-gesture-handler": "^2.x.x",
  "react-native-reanimated": "^3.x.x",
  "expo-notifications": "^0.x.x",
  "expo-document-picker": "^11.x.x",
  "expo-file-system": "^15.x.x"
}
```

### AI & External APIs
```json
{
  "openai": "^4.x.x",
  "googleapis": "^126.x.x"
}
```

---

## 📱 App Architecture

### Folder Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/           # API services and utilities
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── assets/             # Images, fonts, etc.
```

### State Management
- Use React Context for global state
- Implement custom hooks for data fetching
- Utilize Supabase real-time subscriptions

---

## 🚀 Deployment Strategy

### Development Environment
1. Supabase development project
2. Expo development build
3. Local testing with Expo Go

### Production Environment
1. Supabase production project
2. EAS Build for app store deployment
3. Expo Updates for OTA updates

---

## 📊 Success Metrics

### User Engagement
- Daily active users
- Email reading streaks
- Job applications submitted
- Mood entries logged

### Feature Adoption
- Resume downloads
- Ticket transactions
- Confession posts
- Friend connections

---

## 🔄 Maintenance & Updates

### Regular Tasks
- Monitor Supabase usage and costs
- Update AI model prompts
- Moderate confession content
- Update job listings
- Analyze user feedback

### Future Enhancements
- Calendar integration
- Advanced AI features
- University partnerships
- Payment system integration
- Advanced analytics

---

This workflow provides a comprehensive roadmap for building your university student app with Supabase. Each phase builds upon the previous one, ensuring a solid foundation while maintaining development momentum.
