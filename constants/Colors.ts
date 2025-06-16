/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 * Pink-themed color scheme for StickerSmash app
 */

const tintColorLight = '#EC4899'; // Pink-500
const tintColorDark = '#F9A8D4'; // Pink-300

export const Colors = {
  light: {
    text: '#1F2937', // Gray-800
    background: '#FFFFFF',
    backgroundSecondary: '#FDF2F8', // Pink-50
    tint: tintColorLight,
    icon: '#6B7280', // Gray-500
    tabIconDefault: '#9CA3AF', // Gray-400
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    border: '#E5E7EB', // Gray-200
    accent: '#F472B6', // Pink-400
    success: '#10B981', // Emerald-500
    warning: '#F59E0B', // Amber-500
    error: '#EF4444', // Red-500
    purple: '#8B5CF6', // Purple-500
  },
  dark: {
    text: '#F9FAFB', // Gray-50
    background: '#111827', // Gray-900
    backgroundSecondary: '#1F2937', // Gray-800
    tint: tintColorDark,
    icon: '#D1D5DB', // Gray-300
    tabIconDefault: '#9CA3AF', // Gray-400
    tabIconSelected: tintColorDark,
    card: '#1F2937', // Gray-800
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    border: '#374151', // Gray-700
    accent: '#EC4899', // Pink-500
    success: '#34D399', // Emerald-400
    warning: '#FBBF24', // Amber-400
    error: '#F87171', // Red-400
    purple: '#A78BFA', // Purple-400
  },
};
