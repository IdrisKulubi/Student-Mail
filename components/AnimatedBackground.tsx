import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface FloatingParticleProps {
  delay: number;
  size: number;
  color: string;
  startX: number;
  startY: number;
}

const FloatingParticle: React.FC<FloatingParticleProps> = ({
  delay,
  size,
  color,
  startX,
  startY,
}) => {
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      
      scale.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      translateY.value = withRepeat(
        withTiming(startY - 100, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      translateX.value = withRepeat(
        withTiming(startX + 50, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delay);
  }, [delay, startX, startY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const AnimatedBackground: React.FC = () => {
  const { colors, isDark } = useTheme();
  const gradientOpacity = useSharedValue(0);

  useEffect(() => {
    gradientOpacity.value = withRepeat(
      withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const gradientStyle = useAnimatedStyle(() => {
    return {
      opacity: gradientOpacity.value,
    };
  });

  // Generate particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 200,
    size: Math.random() * 20 + 10,
    color: isDark ? colors.accent + '40' : colors.tint + '30',
    startX: Math.random() * width,
    startY: Math.random() * height,
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Gradient overlay */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(249, 168, 212, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
          },
          gradientStyle,
        ]}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <FloatingParticle
          key={particle.id}
          delay={particle.delay}
          size={particle.size}
          color={particle.color}
          startX={particle.startX}
          startY={particle.startY}
        />
      ))}
    </View>
  );
}; 