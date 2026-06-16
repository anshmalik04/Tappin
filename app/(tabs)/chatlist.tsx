import { Colors } from '@/constants/Colors';
import { chatThreads, users } from '@/data/mockData';
import { getMatches } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MatchUser {
  id: string;
  name?: string;
  initial?: string;
  photo?: string;
  venue_id?: string;
  venue?: string;
}

// TODO: remove once real matches exist in the backend — placeholder for layout preview
const MOCK_MATCHES: MatchUser[] = [
  { id: 'mock-1', name: 'Maya L.', initial: 'M' },
  { id: 'mock-2', name: 'Chris T.', initial: 'C' },
  { id: 'mock-3', name: 'Dana W.', initial: 'D' },
];

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    getMatches()
      .then((data: any) => {
        const real = data?.matches || [];
        // TODO: remove MOCK_MATCHES fallback once real matches exist
        setMatches(real.length > 0 ? real : MOCK_MATCHES);
      })
      .catch((e: any) => console.error('Failed to load matches:', e))
      .finally(() => setLoadingMatches(false));
  }, []);

  const threads = users.map((u) => ({
    user: u,
    lastMessage: chatThreads[u.id]?.messages.slice(-1)[0],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Matches</Text>

      {/* Matches - horizontal row */}
      {loadingMatches ? (
        <View style={styles.matchesLoading}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : matches.length > 0 ? (
        <View style={styles.matchesSection}>
          <Text style={styles.matchesHeading}>
            {matches.length} {matches.length === 1 ? 'MATCH' : 'MATCHES'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {matches.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.matchUser}
                onPress={() => router.push(`/user/${m.id}${m.venue_id ? `?venueId=${m.venue_id}` : ''}` as any)}
              >
                <LinearGradient colors={['#B5CDEE', '#7FAADF']} style={styles.matchPhoto}>
                  <Text style={styles.matchInitial}>
                    {(m.initial || m.name || '?').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <Text style={styles.matchName} numberOfLines={1}>
                  {m.name || 'Match'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Chat threads */}
      <FlatList
        data={threads}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16, paddingTop: 8 }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListHeaderComponent={() => (
          <Text style={styles.messagesHeading}>MESSAGES</Text>
        )}
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
  matchesLoading: { paddingVertical: 16, alignItems: 'center' },
  matchesSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  matchesHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  matchUser: { alignItems: 'center', marginRight: 16, width: 64 },
  matchPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInitial: { fontSize: 22, fontWeight: '800', color: Colors.white },
  matchName: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
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
  messagesHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 4,
  },
});