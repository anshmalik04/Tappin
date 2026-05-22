import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { HeatLevel } from '@/data/mockData';

interface HeatDotProps {
  level: HeatLevel;
  size?: number;
  animate?: boolean;
}

const levelConfig = {
  hot: { color: Colors.hot, pulseSpeed: 800, baseSize: 18 },
  warm: { color: Colors.warm, pulseSpeed: 1400, baseSize: 14 },
  mild: { color: Colors.mild, pulseSpeed: 0, baseSize: 10 },
  quiet: { color: Colors.quiet, pulseSpeed: 0, baseSize: 8 },
};

export default function HeatDot({ level, size, animate = true }: HeatDotProps) {
  const config = levelConfig[level];
  const dotSize = size ?? config.baseSize;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate || !config.pulseSpeed) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: config.pulseSpeed / 2, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: config.pulseSpeed / 2, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [level, animate]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: config.color,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

export function HeatDotInline({ level, size = 10 }: { level: HeatLevel; size?: number }) {
  const config = levelConfig[level];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: config.color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
