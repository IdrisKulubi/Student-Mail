import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface Animated3DCardProps {
  icon: string;
  title: string;
  value: number | string;
  color: string;
  delay?: number;
  onPress?: () => void;
}

export const Animated3DCard: React.FC<Animated3DCardProps> = ({
  icon,
  title,
  value,
  color,
  delay = 0,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 800 });
    }, delay);

    // Continuous glow animation
    glowOpacity.value = withRepeat(
      withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle rotation animation
    rotateY.value = withRepeat(
      withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { perspective: 1000 },
        { rotateY: `${rotateY.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  const handlePress = () => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={[animatedStyle]}>
        {/* Glow effect */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -10,
              left: -10,
              right: -10,
              bottom: -10,
              backgroundColor: color,
              borderRadius: 25,
              opacity: 0.2,
            },
            glowStyle,
          ]}
        />
        
        {/* Main card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            width: (width - 60) / 2,
            alignItems: 'center',
            shadowColor: colors.cardShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          {/* Icon container with 3D effect */}
          <View
            style={{
              backgroundColor: color,
              borderRadius: 15,
              padding: 12,
              marginBottom: 12,
              shadowColor: color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Ionicons name={icon as any} size={24} color="#FFFFFF" />
          </View>
          
          {/* Value */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {value}
          </Text>
          
          {/* Title */}
          <Text
            style={{
              fontSize: 12,
              color: colors.icon,
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            {title}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}; 