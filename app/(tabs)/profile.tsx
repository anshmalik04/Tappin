import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const settings: {
  icon: string;
  label: string;
  description: string;
  iconBg: string;
  iconColor: string;
  route?: string;
}[] = [
  {
    icon: '📸',
    label: 'Photos',
    description: '4 photos uploaded',
    iconBg: Colors.primaryLight,
    iconColor: Colors.primary,
  },
  {
    icon: '🎵',
    label: 'Music Taste',
    description: 'Hip Hop, R&B, Indie',
    iconBg: Colors.primaryLight,
    iconColor: Colors.primary,
  },
  {
    icon: '✦',
    label: 'Personality',
    description: '5 traits selected',
    iconBg: '#FFF9E6',
    iconColor: Colors.warning,
  },
  {
    icon: '🛡',
    label: 'Emergency Contacts',
    description: '2 contacts set up',
    iconBg: Colors.dangerLight,
    iconColor: Colors.danger,
    route: '/emergency-contacts',
  },
  {
    icon: '👁',
    label: 'Visibility',
    description: 'Visible when app is open',
    iconBg: Colors.successLight,
    iconColor: Colors.success,
  },
  {
    icon: '🔔',
    label: 'Notifications',
    description: 'Hotspot alerts on',
    iconBg: Colors.mildLight,
    iconColor: Colors.mild,
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>My Profile</Text>

      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>V</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Vamshi P.</Text>
          <Text style={styles.verified}>✓ Verified</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/edit-profile' as any)}>
          <Text style={styles.editLink}>Edit Profile →</Text>
        </TouchableOpacity>
      </View>

      {/* Settings list */}
      <View style={styles.settingsList}>
        {settings.map((s, i) => (
          <React.Fragment key={s.label}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => s.route && router.push(s.route as any)}
              disabled={!s.route}
            >
              <View style={[styles.settingIcon, { backgroundColor: s.iconBg }]}>
                <Text style={styles.settingIconEmoji}>{s.icon}</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={styles.settingDesc}>{s.description}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            {i < settings.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: Colors.white },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  verified: { fontSize: 13, fontWeight: '600', color: Colors.success, marginTop: 2 },
  editLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  settingsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconEmoji: { fontSize: 18 },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  settingDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  chevron: { fontSize: 22, color: Colors.textMuted, fontWeight: '300' },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 70 },
});