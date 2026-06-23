import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatDate = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length >= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  } else if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};

const formatPhone = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length >= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length >= 3) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return digits;
};

const parseBirthdate = (display: string): string | null => {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const month = digits.slice(0, 2);
  const day = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  const age = new Date().getFullYear() - date.getFullYear();
  if (age < 18 || age > 100) return null;
  return `${year}-${month}-${day}`;
};

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');

    if (!name.trim()) { setError('Please enter your first name.'); return; }

    const birthdate = parseBirthdate(dob);
    if (!birthdate) { setError('Please enter a valid date of birth (MM/DD/YYYY). Must be 18 or older.'); return; }

    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Please enter a valid 10-digit US phone number.'); return; }

    // Registration now happens after OTP verification (once we have a valid JWT),
    // not here. We just pass the collected info forward via navigation params.
    router.push({
      pathname: '/auth/otp' as any,
      params: { phone: digits, name: name.trim(), birthdate, isNewUser: 'true' },
    });
  };

  const isReady = name.trim().length > 0
    && phone.replace(/\D/g, '').length === 10
    && dob.replace(/\D/g, '').length === 8;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>T</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>You'll use your phone number to log in.</Text>

        <Text style={styles.label}>FIRST NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Your first name"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.label}>DATE OF BIRTH</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={Colors.textMuted}
          value={dob}
          onChangeText={(text) => setDob(formatDate(text))}
          keyboardType="number-pad"
          maxLength={10}
          returnKeyType="next"
        />

        <Text style={styles.label}>PHONE NUMBER</Text>
        <View style={styles.phoneRow}>
          <View style={styles.flagBox}>
            <Text style={styles.flag}>🇺🇸 +1</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="(555) 000-0000"
            placeholderTextColor={Colors.textMuted}
            value={formatPhone(phone)}
            onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
            keyboardType="phone-pad"
            maxLength={14}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !isReady && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={!isReady || loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.btnText}>Send Verification Code</Text>
          }
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy.
          You must be 18 or older to use Tappin.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 24 },
  backBtnText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoLetter: { fontSize: 30, fontWeight: '900', color: Colors.white },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.textMuted, marginBottom: 32, lineHeight: 22 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  flagBox: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: Colors.border,
  },
  flag: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  error: { color: Colors.danger, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 17, fontWeight: '700', color: Colors.white },
  legal: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});