import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { users } from '@/data/mockData';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = users.find((u) => u.id === id) ?? users[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.reportBtn}>
          <Text style={styles.reportBtnText}>⚑ Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Photo placeholder */}
        <View style={styles.photoContainer}>
          <LinearGradient
            colors={['#B5CDEE', '#7FAADF']}
            style={styles.photo}
          >
            <Text style={styles.photoInitial}>{user.initial}</Text>
          </LinearGradient>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED</Text>
          </View>
        </View>

        {/* Name and age */}
        <View style={styles.nameSection}>
          <Text style={styles.name}>
            {user.name}, <Text style={styles.age}>{user.age}</Text>
          </Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONALITY</Text>
          <View style={styles.tagRow}>
            {user.personality.map((trait) => (
              <View key={trait} style={styles.personalityTag}>
                <Text style={styles.personalityTagText}>{trait}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Music taste */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MUSIC TASTE</Text>
          <View style={styles.tagRow}>
            {user.musicTaste.map((genre) => (
              <View key={genre} style={styles.musicTag}>
                <Text style={styles.musicTagText}>{genre}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={[styles.actionRow, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Text style={styles.actionBtnSecondaryText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Pass</Text>
        </View>

        <View style={styles.actionItem}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.actionBtnPrimary}
          >
            <TouchableOpacity style={styles.actionBtnPrimaryInner}>
              <Text style={styles.actionBtnPrimaryText}>👋</Text>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={[styles.actionLabel, { color: Colors.primary, fontWeight: '700' }]}>
            Tap In
          </Text>
        </View>

        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.actionBtnSecondary}>
            <Text style={styles.actionBtnSecondaryText}>⭐</Text>
          </TouchableOpacity>
          <Text style={[styles.actionLabel, { color: Colors.warning }]}>Save</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 22, color: Colors.textPrimary },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  reportBtn: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reportBtnText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
  photoContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'visible',
    position: 'relative',
  },
  photo: {
    height: 320,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: { fontSize: 80, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  verifiedBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: { color: Colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  nameSection: { paddingHorizontal: 20, paddingTop: 20 },
  name: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  age: { fontSize: 26, fontWeight: '400', color: Colors.textSecondary },
  bio: { fontSize: 15, color: Colors.textSecondary, marginTop: 6, lineHeight: 22 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personalityTag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  personalityTagText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  musicTag: {
    backgroundColor: Colors.successLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  musicTagText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  actionRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 32,
    paddingTop: 16,
    paddingHorizontal: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionItem: { alignItems: 'center', gap: 6 },
  actionBtnSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnSecondaryText: { fontSize: 22 },
  actionBtnPrimary: {
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtnPrimaryInner: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: { fontSize: 28 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
});
