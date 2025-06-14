// User Actions
export * from './userActions';

// Email Actions  
export * from './emailActions';

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