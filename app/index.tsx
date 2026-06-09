import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.6, duration: 500, useNativeDriver: true }),
    ]).start();

    const init = async () => {
      await Location.requestForegroundPermissionsAsync();

      // Request background location for geofencing
      // iOS requires foreground permission first before asking for background
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Background location permission denied — geofencing disabled');
      }

      setTimeout(() => {
        router.replace('/(tabs)/map');
      }, 2800);
    };
    
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <LinearGradient
          colors={['#4A9BFF', '#1A5AC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoLetter}>T</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>TAPPIN</Text>
        <Text style={styles.tagline}>TAP INTO THE SCENE</Text>
      </Animated.View>

      <View style={styles.bottomContainer}>
        <Animated.Text style={[styles.locationText, { opacity: textOpacity }]}>
          FINDING YOUR LOCATION...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050E2B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: Colors.primary,
    opacity: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoLetter: {
    fontSize: 56,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: -2,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 3,
  },
});
