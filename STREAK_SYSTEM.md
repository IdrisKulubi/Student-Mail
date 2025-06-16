# 🔥 Streak & XP System Documentation

## Overview

The Streak & XP System gamifies email reading by rewarding users with experience points (XP) and maintaining daily streaks. This modular system is designed with senior-level architecture principles, featuring proper separation of concerns, comprehensive logging, and extensible design.

## 🏗️ Architecture

### Core Components

1. **Actions Layer** (`actions/streakActions.ts`)
   - Pure business logic functions
   - Database operations
   - Streak calculations and validations

2. **Hooks Layer** (`hooks/useStreak.ts`)
   - React state management
   - UI integration
   - Error handling and user feedback

3. **Components Layer** (`components/StreakDisplay.tsx`)
   - Reusable UI components
   - Responsive design
   - Accessibility features

4. **Database Layer**
   - User streak data in `users` table
   - Activity logging in `streak_activities` table
   - PostgreSQL functions for analytics

## 📊 Database Schema

### Users Table (Enhanced)
```sql
-- Existing fields for streak tracking
total_xp INTEGER DEFAULT 0,
current_streak INTEGER DEFAULT 0,
longest_streak INTEGER DEFAULT 0,
last_email_check TIMESTAMP WITH TIME ZONE,
```

### Streak Activities Table (New)
```sql
CREATE TABLE public.streak_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('email_read', 'daily_streak', 'weekly_bonus', 'monthly_bonus', 'milestone_bonus')),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_day INTEGER,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎮 XP Reward System

### Base Rewards
- **Email Read**: 5 XP
- **Daily Streak**: 10 XP (bonus for maintaining streak)

### Bonus Rewards
- **Weekly Bonus**: 25 XP (every 7 days)
- **Monthly Bonus**: 100 XP (every 30 days)

### Milestone Bonuses
- **5 Days**: 50 XP
- **10 Days**: 100 XP
- **30 Days**: 300 XP
- **100 Days**: 1000 XP

## 🔧 Usage Examples

### Basic Integration

```typescript
import { useStreak } from '../hooks/useStreak';
import { StreakDisplay } from '../components/StreakDisplay';

function EmailScreen() {
  const { updateStreak, streakData } = useStreak();

  const handleEmailRead = async () => {
    // Mark email as read in your system
    await markEmailAsRead(emailId);
    
    // Update streak and XP
    const result = await updateStreak();
    if (result) {
      console.log(`Earned ${result.xpEarned} XP!`);
    }
  };

  return (
    <View>
      <StreakDisplay compact={true} />
      {/* Your email list */}
    </View>
  );
}
```

### Advanced Usage with Activity Logging

```typescript
import { 
  getUserStreakActivities, 
  getUserXPSummary 
} from '../actions/streakActions';

// Get recent activities
const activities = await getUserStreakActivities(userId, 20);

// Get XP breakdown by activity type
const xpSummary = await getUserXPSummary(userId);
```

## 🎯 Key Features

### 1. Smart Streak Logic
- **New Day Detection**: Compares dates at midnight boundary
- **Streak Breaking**: Automatically breaks streaks after 1+ day gap
- **Streak Recovery**: Starts fresh streak when broken

### 2. Comprehensive Logging
- Every XP-earning activity is logged
- Detailed metadata for analytics
- Separate entries for base rewards and bonuses

### 3. Flexible UI Components
- **Compact Mode**: For headers and tight spaces
- **Full Mode**: Detailed streak information
- **Debug Mode**: Reset functionality for development

### 4. Error Resilience
- Streak updates don't block email reading
- Graceful fallbacks for failed operations
- Comprehensive error logging

## 🔄 Streak Logic Flow

1. User reads an email
2. Check if it's a new day since last email check
3. If new day:
   - Check if streak should be broken (>1 day gap)
   - If broken: Reset to day 1
   - If not broken: Increment streak
   - Award daily streak bonus + any milestone bonuses
4. If same day: Award only base email reading XP
5. Log all activities to database
6. Update user's total XP and streak counters

## 🛠️ Development & Testing

### Running Database Migrations

1. **Initial Setup**: Run `database-setup.sql`
2. **Streak Enhancement**: Run `database-streak-enhancement.sql`

### Testing Streak Logic

```typescript
// Reset streak for testing
const { resetUserStreak } = useStreak();
await resetUserStreak();

// Simulate different scenarios
// Test same-day reading (should only award base XP)
// Test next-day reading (should award streak bonus)
// Test gap > 1 day (should break streak)
```

### Debug Features

- **Development Mode**: Shows reset button in StreakDisplay
- **Console Logging**: Detailed logs for all streak operations
- **Activity History**: View all XP-earning activities

## 📈 Analytics & Insights



```sql
-- User's total XP by activity type
SELECT * FROM get_user_xp_summary('user-id');

-- Recent streak activities
SELECT * FROM get_user_streak_activities('user-id', 10);

-- Top performers
SELECT u.email, u.total_xp, u.current_streak, u.longest_streak
FROM users u
ORDER BY u.total_xp DESC
LIMIT 10;
```

### Metrics to Track

- Daily active users (by email reading)
- Average streak length
- XP distribution across users
- Most common streak break points
- Milestone achievement rates

## 🚀 Future Enhancements

### Planned Features

1. **Leaderboards**: Compare streaks with friends
2. **Achievements**: Unlock badges for milestones
3. **Streak Freezes**: Allow users to pause streaks
4. **Social Features**: Share achievements
5. **Push Notifications**: Remind users to maintain streaks

### Extension Points

- **Custom Rewards**: Easy to add new XP sources
- **Dynamic Bonuses**: Time-based or event-based multipliers
- **Integration**: Connect with other app features
- **Personalization**: User-specific reward preferences

## 🔒 Security & Performance

### Security Measures
- Row Level Security (RLS) on all tables
- User can only access their own data
- Secure database functions with proper permissions

### Performance Optimizations
- Indexed database queries
- Efficient date calculations
- Minimal UI re-renders
- Async operations with proper error handling

### Scalability Considerations
- Partitioned activity logs (future)
- Cached leaderboards (future)
- Background streak maintenance jobs (future)

## 📝 Best Practices

### For Developers

1. **Always handle errors gracefully** - Don't let streak failures break core functionality
2. **Log comprehensively** - Every XP change should be traceable
3. **Test edge cases** - Timezone changes, date boundaries, etc.
4. **Keep UI responsive** - Use loading states and optimistic updates
5. **Follow the modular pattern** - Actions → Hooks → Components

### For Product Teams

1. **Monitor engagement metrics** - Track how streaks affect user behavior
2. **A/B test rewards** - Optimize XP values for maximum engagement
3. **Gather user feedback** - Understand what motivates your users
4. **Plan for abuse** - Consider rate limiting and validation
5. **Celebrate milestones** - Make achievements feel special

---

## 🤝 Contributing

When extending the streak system:

1. Add new reward types to the `XP_REWARDS` constant
2. Update the `StreakActivity` type for new activity types
3. Add corresponding database constraints
4. Update this documentation
5. Add comprehensive tests

