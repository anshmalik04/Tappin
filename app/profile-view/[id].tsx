// @ts-nocheck
import { Colors } from '@/constants/Colors';
import ReportModal from '@/components/ReportModal';
import { createTapIn } from '@/services/api';
import { blockUser } from '@/services/moderation';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PHOTO_GRADIENTS = [
  ['#B5CDEE', '#7FAADF'],
  ['#C9D8F0', '#9BBDE8'],
  ['#D4E4FF', '#A8C4F0'],
  ['#B8D0F5', '#85AADF'],
];

export default function ProfileViewScreen() {
  const { id, name, age, bio, matchPercent, personality, music } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [tapping, setTapping] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const traits = personality
    ? (Array.isArray(personality) ? personality : String(personality).split(','))
    : ['Adventurous', 'Night Owl', 'Creative'];

  const musicTastes = music
    ? (Array.isArray(music) ? music : String(music).split(','))
    : ['Hip Hop', 'R&B'];

  const handleTapIn = async () => {
    if (tapped || tapping) return;
    setTapping(true);
    try {
      await createTapIn(id, null);
      setTapped(true);
      Alert.alert('👋 Tap In Sent!', `You tapped in on ${name}. If they tap back, you'll match!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to send Tap In. Try again.');
    } finally {
      setTapping(false);
    }
  };

  // Silent block: the other user is never notified (Safety doc, section 3).
  const handleBlock = () => {
    setMenuOpen(false);
    Alert.alert(
      `Block ${name || 'this user'}?`,
      'They will disappear from People at Venue and your chats. They are not told you blocked them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await blockUser(String(id));
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Photo carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          data={PHOTO_GRADIENTS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <LinearGradient colors={item} style={styles.photoSlide}>
              <Text style={styles.photoInitial}>
                {(String(name || '?')).charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        {/* Overflow menu */}
        <TouchableOpacity
          style={[styles.moreBtn, { top: insets.top + 12 }]}
          onPress={() => setMenuOpen(true)}
        >
          <Text style={styles.moreBtnText}>{'\u22EF'}</Text>
        </TouchableOpacity>

        {/* Match badge */}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>{matchPercent || 87}% match</Text>
        </View>

        {/* Photo counter */}
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>{photoIndex + 1}/{PHOTO_GRADIENTS.length}</Text>
        </View>

        {/* Dot indicators */}
        <View style={styles.dotRow}>
          {PHOTO_GRADIENTS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === photoIndex && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <Text style={styles.name}>{name || 'Alex M.'}, {age || 26}</Text>
          <Text style={styles.bio}>{bio || 'Music lover and night owl. Always looking for the next great show.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personality</Text>
          <View style={styles.tagRow}>
            {traits.map((trait) => (
              <View key={trait} style={styles.tag}>
                <Text style={styles.tagText}>{String(trait).trim()}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music Taste</Text>
          <View style={styles.tagRow}>
            {musicTastes.map((m) => (
              <View key={m} style={[styles.tag, styles.musicTag]}>
                <Text style={[styles.tagText, styles.musicTagText]}>🎵 {String(m).trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.actionRow, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.passBtn} onPress={() => router.back()}>
          <Text style={styles.passBtnText}>✕ Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tapInBtn, tapped && styles.tapInBtnDone]}
          onPress={handleTapIn}
          disabled={tapped || tapping}
        >
          {tapping ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.tapInBtnText}>
              {tapped ? '✓ Tapped In!' : '👋 Tap In'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Block / report menu */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuOpen(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
            >
              <Text style={styles.menuItemText}>{'\u2691'}  Report</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
              <Text style={[styles.menuItemText, styles.menuItemDanger]}>
                {'\u2298'}  Block
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ReportModal
        visible={reportOpen}
        userId={String(id)}
        userName={name ? String(name) : undefined}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  carouselContainer: { height: 320, position: 'relative' },
  photoSlide: {
    width,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontSize: 120, fontWeight: '900', color: 'rgba(255,255,255,0.4)' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: Colors.white, fontWeight: '700' },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  photoCounter: {
    position: 'absolute',
    top: 16,
    left: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  photoCounterText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  dotRow: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: { backgroundColor: Colors.white, width: 18 },
  header: { padding: 24, paddingBottom: 8 },
  name: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  bio: { fontSize: 15, color: Colors.textMuted, marginTop: 8, lineHeight: 22 },
  section: { paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.divider },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  tagText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  musicTag: { backgroundColor: Colors.successLight },
  musicTagText: { color: Colors.success },
  actionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  passBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  passBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textMuted },
  tapInBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  tapInBtnDone: { backgroundColor: Colors.success },
  tapInBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  moreBtn: {
    position: 'absolute',
    right: 16,
    top: 64,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  moreBtnText: { fontSize: 20, color: Colors.white, fontWeight: '800' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    width: '78%',
    overflow: 'hidden',
  },
  menuItem: { paddingVertical: 16, alignItems: 'center' },
  menuItemText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  menuItemDanger: { color: Colors.hot, fontWeight: '700' },
  menuCancelText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  menuDivider: { height: 1, backgroundColor: Colors.divider },
});