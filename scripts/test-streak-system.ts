/**
 * Test Script for Streak System
 * 
 * This script demonstrates the streak system functionality
 * Run with: npx ts-node scripts/test-streak-system.ts
 */

import { 
  updateEmailReadingStreak,
  getStreakData,
  resetStreak,
  getUserStreakActivities,
  XP_REWARDS
} from '../actions/streakActions';

// Mock user ID for testing (replace with actual user ID)
const TEST_USER_ID = 'your-test-user-id-here';

async function testStreakSystem() {
  console.log('🔥 Testing Streak System\n');

  try {
    // 1. Reset streak to start fresh
    console.log('1. Resetting streak...');
    await resetStreak(TEST_USER_ID);
    console.log('✅ Streak reset successfully\n');

    // 2. Get initial streak data
    console.log('2. Getting initial streak data...');
    let streakData = await getStreakData(TEST_USER_ID);
    console.log('Initial data:', {
      currentStreak: streakData.currentStreak,
      totalXp: streakData.totalXp,
      longestStreak: streakData.longestStreak
    });
    console.log('');

    // 3. Simulate first email read
    console.log('3. Simulating first email read...');
    let result = await updateEmailReadingStreak(TEST_USER_ID);
    console.log('Result:', {
      message: result.message,
      xpEarned: result.xpEarned,
      newStreak: result.newStreak,
      streakIncreased: result.streakIncreased
    });
    console.log('');

    // 4. Simulate same-day email read (should only give base XP)
    console.log('4. Simulating same-day email read...');
    result = await updateEmailReadingStreak(TEST_USER_ID);
    console.log('Result:', {
      message: result.message,
      xpEarned: result.xpEarned,
      newStreak: result.newStreak,
      streakIncreased: result.streakIncreased
    });
    console.log('');

    // 5. Get updated streak data
    console.log('5. Getting updated streak data...');
    streakData = await getStreakData(TEST_USER_ID);
    console.log('Updated data:', {
      currentStreak: streakData.currentStreak,
      totalXp: streakData.totalXp,
      longestStreak: streakData.longestStreak
    });
    console.log('');

    // 6. Get recent activities
    console.log('6. Getting recent streak activities...');
    const activities = await getUserStreakActivities(TEST_USER_ID, 5);
    console.log('Recent activities:');
    activities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.activity_type}: +${activity.xp_earned} XP - ${activity.description}`);
    });
    console.log('');

    // 7. Display XP rewards configuration
    console.log('7. XP Rewards Configuration:');
    Object.entries(XP_REWARDS).forEach(([key, value]) => {
      console.log(`  ${key}: ${value} XP`);
    });
    console.log('');

    console.log('✅ Streak system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Utility function to simulate multiple days of email reading
async function simulateMultipleDays(days: number) {
  console.log(`🗓️ Simulating ${days} days of email reading...\n`);

  for (let day = 1; day <= days; day++) {
    console.log(`Day ${day}:`);
    
    // In a real scenario, you would manipulate the last_email_check timestamp
    // For testing, we'll just call the function
    const result = await updateEmailReadingStreak(TEST_USER_ID);
    console.log(`  ${result.message}`);
    
    if (day % 7 === 0) {
      console.log(`  🎉 Weekly milestone reached!`);
    }
    if (day % 30 === 0) {
      console.log(`  🏆 Monthly milestone reached!`);
    }
  }

  const finalData = await getStreakData(TEST_USER_ID);
  console.log(`\nFinal Results after ${days} days:`);
  console.log(`  Current Streak: ${finalData.currentStreak} days`);
  console.log(`  Total XP: ${finalData.totalXp}`);
  console.log(`  Longest Streak: ${finalData.longestStreak} days`);
}

// Export functions for use in other test files
export {
  testStreakSystem,
  simulateMultipleDays,
  TEST_USER_ID
};

// Run the test if this file is executed directly
if (require.main === module) {
  testStreakSystem().catch(console.error);
} 