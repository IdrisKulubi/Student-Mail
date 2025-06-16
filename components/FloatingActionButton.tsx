import React, { useEffect } from 'react';
import { TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  color,
  size = 60,
}) => {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);

  const buttonColor = color || colors.tint;

  useEffect(() => {
    // Entry animation
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    shadowOpacity.value = withTiming(0.3, { duration: 500 });

    // Continuous glow animation
    glowOpacity.value = withRepeat(
      withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle rotation animation
    rotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[animatedStyle]}>
        {/* Glow effect */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -15,
              left: -15,
              right: -15,
              bottom: -15,
              backgroundColor: buttonColor,
              borderRadius: (size + 30) / 2,
              opacity: 0.2,
            },
            glowStyle,
          ]}
        />
        
        {/* Shadow layer */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: size / 2,
              opacity: 0.3,
            },
            shadowStyle,
          ]}
        />
        
        {/* Main button */}
        <Animated.View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: buttonColor,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: buttonColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.4 : 0.3,
            shadowRadius: 15,
            elevation: 12,
          }}
        >
          <Ionicons name={icon as any} size={size * 0.4} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}; 