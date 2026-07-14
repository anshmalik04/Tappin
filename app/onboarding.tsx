// @ts-nocheck
import { Colors } from '@/constants/Colors';
import { updateProfile } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const VIBE_OPTIONS = [
  'Adventurous', 'Night Owl', 'Creative', 'Social Butterfly',
  'Outgoing', 'Foodie', 'Explorer', 'Laid Back',
  'Outdoorsy', 'Funny', 'Athletic', 'Bookworm',
];

const STEPS = ['Photo', 'Bio', 'Vibe'];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState('');
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTag = (tag: string) => {
    if (vibeTags.includes(tag)) {
      setVibeTags(vibeTags.filter((t) => t !== tag));
    } else if (vibeTags.length < 5) {
      setVibeTags([...vibeTags, tag]);
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Last step — save and go to map
    setSaving(true);
    try {
      await updateProfile({
        bio: bio.trim(),
        personality_tags: vibeTags,
      });
    } catch (e) {
      console.error('Onboarding save error:', e);
    } finally {
      setSaving(false);
      router.replace('/(tabs)/map');
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)/map');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Progress bar */}
      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= step ? Colors.primary : Colors.border }
            ]}
          />
        ))}
      </View>

      {/* Step label */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepCount}>Step {step + 1} of {STEPS.length}</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Step 0 — Photo */}
      {step === 0 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Add your first photo</Text>
          <Text style={styles.stepSubtitle}>
            Profiles with photos get 3x more Tap Ins
          </Text>
          <TouchableOpacity style={styles.photoUploadBox} onPress={() => {
            // Photo picker — will be wired up with expo-image-picker
            console.log('Photo picker tapped');
          }}>
            <LinearGradient
              colors={['#B5CDEE', '#7FAADF']}
              style={styles.photoUploadGradient}
            >
              <Text style={styles.photoUploadIcon}>📷</Text>
              <Text style={styles.photoUploadText}>Tap to add photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1 — Bio */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Tell people about yourself</Text>
          <Text style={styles.stepSubtitle}>
            A quick bio helps others know if you'd vibe
          </Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="e.g. Music lover and night owl. Always looking for the next great show..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={200}
            autoFocus
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>
      )}

      {/* Step 2 — Vibe tags */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>What's your vibe?</Text>
          <Text style={styles.stepSubtitle}>
            Pick up to 5 traits that describe you
          </Text>
          <View style={styles.chipRow}>
            {VIBE_OPTIONS.map((tag) => {
              const active = vibeTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.tagCount}>{vibeTags.length}/5 selected</Text>
        </View>
      )}

      {/* Bottom button */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.nextBtnText}>
              {step === STEPS.length - 1 ? "Let's go 🎉" : 'Continue →'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 24 },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  stepCount: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  stepContainer: { flex: 1 },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
    marginBottom: 32,
  },
  photoUploadBox: {
    width: width - 48,
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  photoUploadGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  photoUploadIcon: { fontSize: 48 },
  photoUploadText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  bioInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 140,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  tagCount: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  bottomRow: { paddingVertical: 24 },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },
});
