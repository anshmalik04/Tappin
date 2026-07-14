// @ts-nocheck
import { Colors } from '@/constants/Colors';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const MUSIC_OPTIONS = ['Hip Hop', 'EDM', 'Top 40', 'R&B', 'Live Music', 'Latin', 'House', 'Other'];
const COVER_OPTIONS = ['Free', '$5', '$10', '$20+', 'Not sure'];
const CROWD_OPTIONS = ['Dead', 'Getting there', 'Packed', 'Shoulder to shoulder'];

interface CrowdsourceModalProps {
  visible: boolean;
  venueName: string;
  venueId: string;
  onSubmit: (data: { music: string; cover: string; crowd: string; venueId: string }) => void;
  onDismiss: () => void;
}

export default function CrowdsourceModal({ visible, venueName, venueId, onSubmit, onDismiss }: CrowdsourceModalProps) {
  const [step, setStep] = useState(0);
  const [music, setMusic] = useState('');
  const [cover, setCover] = useState('');
  const [crowd, setCrowd] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      setMusic('');
      setCover('');
      setCrowd('');
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onSubmit({ music, cover, crowd, venueId });
    }
  };

  const canNext = () => {
    if (step === 0) return !!music;
    if (step === 1) return !!cover;
    if (step === 2) return !!crowd;
    return false;
  };

  const questions = [
    {
      title: "What's the music?",
      options: MUSIC_OPTIONS,
      selected: music,
      onSelect: setMusic,
    },
    {
      title: "Cover tonight?",
      options: COVER_OPTIONS,
      selected: cover,
      onSelect: setCover,
    },
    {
      title: "How packed is it?",
      options: CROWD_OPTIONS,
      selected: crowd,
      onSelect: setCrowd,
    },
  ];

  const current = questions[step];

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.greeting}>You're at {venueName}! 👋</Text>
            <Text style={styles.subtext}>Quick update for the community</Text>

            {/* Progress dots */}
            <View style={styles.progressRow}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.progressDot, i <= step && styles.progressDotActive]}
                />
              ))}
            </View>
          </View>

          {/* Question */}
          <Text style={styles.question}>{current.title}</Text>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {current.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, current.selected === opt && styles.optionActive]}
                onPress={() => current.onSelect(opt)}
              >
                <Text style={[styles.optionText, current.selected === opt && styles.optionTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onDismiss}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !canNext() && styles.nextBtnDisabled]}
              onPress={handleNext}
              disabled={!canNext()}
            >
              <Text style={styles.nextBtnText}>
                {step === 2 ? '🎉 Submit' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  subtext: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 16 },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.primary, width: 24 },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  optionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  skipBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  nextBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
