import { Colors } from '@/constants/Colors';
import { requestOTP } from '@/services/auth';
import { router } from 'expo-router';
import { useState } from 'react';
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

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit US phone number');
      return;
    }

    setLoading(true);
    setError('');

    const result = await requestOTP(digits);

    setLoading(false);

    if (result.success) {
        router.push({ pathname: '/auth/otp' as any, params: { phone: digits } });
    } else {
      setError(result.error || 'Failed to send code. Try again.');
    }
  };

  const formatDisplay = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>T</Text>
        </View>

        <Text style={styles.title}>What's your number?</Text>
        <Text style={styles.subtitle}>
          We'll send you a one-time code to verify your identity.
        </Text>

        {/* Phone input */}
        <View style={styles.inputRow}>
          <View style={styles.flagBox}>
            <Text style={styles.flag}>🇺🇸 +1</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="(555) 000-0000"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            value={formatDisplay(phone)}
            onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
            maxLength={14}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (loading || phone.replace(/\D/g, '').length !== 10) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading || phone.replace(/\D/g, '').length !== 10}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.buttonText}>Send Code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
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
  inputRow: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  flagBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  flag: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  legal: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});