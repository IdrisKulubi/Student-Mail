import React, { useEffect } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useTheme();
  const animatedValue = useSharedValue(isDark ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    animatedValue.value = withSpring(isDark ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isDark]);

  const containerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedValue.value,
      [0, 1],
      ['#F3F4F6', '#374151'] // Light gray to dark gray
    );

    return {
      backgroundColor,
      transform: [{ scale: scale.value }],
    };
  });

  const toggleStyle = useAnimatedStyle(() => {
    const translateX = animatedValue.value * 28; // Width of toggle minus circle width
    
    return {
      transform: [{ translateX }],
    };
  });

  const sunStyle = useAnimatedStyle(() => {
    const opacity = 1 - animatedValue.value;
    const rotate = animatedValue.value * 180;
    
    return {
      opacity,
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const moonStyle = useAnimatedStyle(() => {
    const opacity = animatedValue.value;
    const rotate = (1 - animatedValue.value) * 180;
    
    return {
      opacity,
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });
    toggleTheme();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View
        style={[
          {
            width: 56,
            height: 28,
            borderRadius: 14,
            padding: 2,
            justifyContent: 'center',
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          containerStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            },
            toggleStyle,
          ]}
        >
          {/* Sun icon */}
          <Animated.View
            style={[
              { position: 'absolute' },
              sunStyle,
            ]}
          >
            <Ionicons name="sunny" size={16} color="#F59E0B" />
          </Animated.View>
          
          {/* Moon icon */}
          <Animated.View
            style={[
              { position: 'absolute' },
              moonStyle,
            ]}
          >
            <Ionicons name="moon" size={16} color="#6366F1" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}; 