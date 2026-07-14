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

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [hotspotAlerts, setHotspotAlerts] = useState(true);
  const [tapInAlerts, setTapInAlerts] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);
  const [marketingAlerts, setMarketingAlerts] = useState(false);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.sectionLabel}>ACTIVITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>🔥 Hotspot alerts</Text>
              <Text style={styles.rowDesc}>Get notified when a nearby venue is heating up</Text>
            </View>
            <Switch
              value={hotspotAlerts}
              onValueChange={setHotspotAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>👋 Tap In received</Text>
              <Text style={styles.rowDesc}>Someone tapped in on your profile</Text>
            </View>
            <Switch
              value={tapInAlerts}
              onValueChange={setTapInAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>🎉 New match</Text>
              <Text style={styles.rowDesc}>You and someone mutually tapped in</Text>
            </View>
            <Switch
              value={matchAlerts}
              onValueChange={setMatchAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>💬 New message</Text>
              <Text style={styles.rowDesc}>Someone sent you a message in chat</Text>
            </View>
            <Switch
              value={messageAlerts}
              onValueChange={setMessageAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>SAFETY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>🛡 Safety alerts</Text>
              <Text style={styles.rowDesc}>Emergency contact notifications and safety check-ins</Text>
            </View>
            <Switch
              value={safetyAlerts}
              onValueChange={setSafetyAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>OTHER</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>📣 News & updates</Text>
              <Text style={styles.rowDesc}>New features, events, and announcements from Tappin</Text>
            </View>
            <Switch
              value={marketingAlerts}
              onValueChange={setMarketingAlerts}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        </View>

        <Text style={styles.note}>
          Safety alerts cannot be fully disabled while you have active emergency contacts set up.
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