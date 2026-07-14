// @ts-nocheck
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VisibilityScreen() {
  const insets = useSafeAreaInsets();
  const [visibleWhenOpen, setVisibleWhenOpen] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [showInPeople, setShowInPeople] = useState(true);
  const [approximateLocation, setApproximateLocation] = useState(false);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visibility</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>PRESENCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Visible when app is open</Text>
              <Text style={styles.rowDesc}>Others can see you on the map while you have the app open</Text>
            </View>
            <Switch
              value={visibleWhenOpen}
              onValueChange={(val) => {
                setVisibleWhenOpen(val);
                if (val) setGhostMode(false);
              }}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Ghost mode</Text>
              <Text style={styles.rowDesc}>Temporarily invisible to all users — you can still browse</Text>
            </View>
            <Switch
              value={ghostMode}
              onValueChange={(val) => {
                setGhostMode(val);
                if (val) setVisibleWhenOpen(false);
              }}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>DISCOVERY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Show me in People Nearby</Text>
              <Text style={styles.rowDesc}>Appear in the swipe deck for others at the same venue</Text>
            </View>
            <Switch
              value={showInPeople}
              onValueChange={setShowInPeople}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Approximate location only</Text>
              <Text style={styles.rowDesc}>Show nearby area instead of exact venue on your profile</Text>
            </View>
            <Switch
              value={approximateLocation}
              onValueChange={setApproximateLocation}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.note}>
          🔒 Your exact location is never shared with other users. Only your checked-in venue is visible.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.white,
  },
  backBtn: { fontSize: 24, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 3, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  note: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 20,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
});