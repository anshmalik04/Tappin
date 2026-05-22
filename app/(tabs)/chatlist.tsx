import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { users, chatThreads } from '@/data/mockData';

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();

  const threads = users.map((u) => ({
    user: u,
    lastMessage: chatThreads[u.id]?.messages.slice(-1)[0],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/chat/${item.user.id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.user.initial}</Text>
            </View>
            <View style={styles.rowInfo}>
              <View style={styles.rowTop}>
                <Text style={styles.userName}>{item.user.name}</Text>
                {item.lastMessage && (
                  <Text style={styles.timestamp}>{item.lastMessage.timestamp}</Text>
                )}
              </View>
              {item.user.currentVenue && (
                <View style={styles.atVenueRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.atVenue}>At {item.user.currentVenue}</Text>
                </View>
              )}
              {item.lastMessage && (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage.senderId === 'me' ? 'You: ' : ''}
                  {item.lastMessage.text}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 72 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  rowInfo: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  timestamp: { fontSize: 12, color: Colors.textMuted },
  atVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  atVenue: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  preview: { fontSize: 14, color: Colors.textMuted, marginTop: 3 },
});
