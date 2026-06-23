import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

export default function AuthLandingScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Top branding area */}
      <LinearGradient
        colors={['#050E2B', '#0D1F5C']}
        style={[styles.brandArea, { paddingTop: insets.top + 60 }]}
      >
        <LinearGradient
          colors={['#4A9BFF', '#1A5AC4']}
          style={styles.logoBox}
        >
          <Text style={styles.logoLetter}>T</Text>
        </LinearGradient>
        <Text style={styles.appName}>TAPPIN</Text>
        <Text style={styles.tagline}>TAP INTO THE SCENE</Text>
      </LinearGradient>

      {/* Bottom actions area */}
      <View style={[styles.actionsArea, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.welcomeText}>Philadelphia's nightlife, live.</Text>
        <Text style={styles.subText}>
          Discover where people are, connect with who's out tonight.
        </Text>

        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => router.push('/auth/signup' as any)}
        >
          <Text style={styles.signUpBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/auth/phone' as any)}
        >
          <Text style={styles.loginBtnText}>Log In</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  brandArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  logoLetter: { fontSize: 56, fontWeight: '900', color: Colors.white, letterSpacing: -2 },
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
  actionsArea: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingTop: 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signUpBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpBtnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  loginBtn: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  loginBtnText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  legal: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});