// User Actions
export * from './userActions';

// Email Actions  
export * from './emailActions';

// Streak Actions
export * from './streakActions';

// Re-export all user actions
export {
  getUserProfile,
  createOrUpdateUserFromAuth,
  completeUserProfile,
  getUserStats,
  isProfileComplete,
  updateUserXP,
  testDatabaseConnection,
} from './userActions';

// Re-export streak actions
export {
  updateEmailReadingStreak,
  getStreakData,
  resetStreak,
  checkStreakMaintenance,
  getUserStreakActivities,
  getUserXPSummary,
  XP_REWARDS,
} from './streakActions';

// Re-export types for convenience
export type {
  UserProfile,
  UserStats,
  CreateUserProfileData,
} from './userActions';

export type {
  Email,
  CreateEmailData,
  EmailFilters,
} from './emailActions';

export type {
  StreakData,
  StreakUpdateResult,
  StreakActivity,
} from './streakActions'; 