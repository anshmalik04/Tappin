import { Colors } from '@/constants/Colors';
import { registerUser } from '@/services/api';
import { requestOTP, verifyOTP } from '@/services/auth';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function OTPScreen() {
  const { phone, isNewUser, name, birthdate } = useLocalSearchParams<{
    phone: string;
    isNewUser?: string;
    name?: string;
    birthdate?: string;
  }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputRef = useRef<TextInput>(null);

  const hasSentOTP = useRef(false);

  useEffect(() => {
    const sendOTP = async () => {
      if (!phone || hasSentOTP.current) { setLoading(false); return; }
      hasSentOTP.current = true;
      const result = await requestOTP(phone);
      if (!result.success) {
        setError(result.error || 'Failed to send code. Go back and try again.');
      }
      setLoading(false);
      inputRef.current?.focus();
    };

    sendOTP();

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (otp: string) => {
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');

    const result = await verifyOTP(otp);

    if (!result.success) {
      setLoading(false);
      setError(result.error || 'Invalid code. Try again.');
      setCode('');
      return;
    }

    // Now that we're verified and have a real JWT, create the Postgres user row
    // if this was a new signup.
    if (isNewUser === 'true' && phone && name && birthdate) {
      try {
        await registerUser(phone, name, birthdate);
      } catch (e: any) {
        console.error('registerUser error after OTP:', e);
        // Don't block navigation on this — the user is authenticated either way;
        // worst case their profile is incomplete and they can fix it in Edit Profile.
      }
    }

    setLoading(false);
    router.replace('/(tabs)/map');
  };

  const handleChangeText = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) handleVerify(digits);
  };

  const handleResend = async () => {
    if (!phone) return;
    setCountdown(30);
    setError('');
    const result = await requestOTP(phone);
    if (!result.success) {
      setError(result.error || 'Failed to resend code.');
    }
  };

  const formattedPhone = phone
    ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>T</Text>
        </View>

        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phoneHighlight}>+1 {formattedPhone}</Text>
        </Text>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.dotsRow}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    code.length > i && styles.dotFilled,
                    code.length === i && styles.dotActive,
                  ]}
                >
                  <Text style={styles.dotText}>{code[i] || ''}</Text>
                </View>
              ))}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              value={code}
              onChangeText={handleChangeText}
              maxLength={6}
            />
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.resendButton}
          disabled={countdown > 0}
          onPress={handleResend}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 32 },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoLetter: { fontSize: 36, fontWeight: '900', color: Colors.white },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 22,
  },
  phoneHighlight: { fontWeight: '700', color: Colors.textPrimary },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dot: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  dotActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dotText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  resendButton: { marginTop: 32 },
  resendText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  resendDisabled: { color: Colors.textMuted },
});