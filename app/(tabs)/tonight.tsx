import { HeatDotInline } from '@/components/HeatDot';
import { Colors } from '@/constants/Colors';
import { useCheckIn } from '@/context/CheckInContext';
import type { HeatLevel } from '@/data/mockData';
import { events, venues as mockVenues } from '@/data/mockData';
import { getHeatmapData } from '@/services/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PHILLY_CENTER = { lat: 39.9526, lng: -75.1652 };

const heatLabel: Record<HeatLevel, string> = {
  hot: 'Hot',
  warm: 'Warming up',
  mild: 'Mild',
  quiet: 'Quiet',
};
const heatBadgeColor: Record<HeatLevel, string> = {
  hot: Colors.hotLight,
  warm: Colors.warmLight,
  mild: Colors.mildLight,
  quiet: Colors.quietLight,
};
const heatTextColor: Record<HeatLevel, string> = {
  hot: Colors.hot,
  warm: Colors.warm,
  mild: Colors.mild,
  quiet: Colors.quiet,
};

function toHeatLevel(color: string): HeatLevel {
  const c = (color || '').toLowerCase();
  if (c === 'hot' || c === 'red') return 'hot';
  if (c === 'warm' || c === 'orange') return 'warm';
  if (c === 'mild' || c === 'yellow') return 'mild';
  return 'quiet';
}

interface LiveVenue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  cover_charge: string | null;
  heatmap_color: string;
  heatmap_score: number;
  going_count: number;
  arrived_count: number;
}

export default function TonightScreen() {
  const insets = useSafeAreaInsets();
  const { isCheckedIn, toggleCheckIn, canCheckIn, checkInCount } = useCheckIn();
  const [liveVenues, setLiveVenues] = useState<LiveVenue[]>([]);
  const [usingMockData, setUsingMockData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVenues = useCallback(async () => {
    try {
      const data = await getHeatmapData(PHILLY_CENTER.lat, PHILLY_CENTER.lng, 5000);
      const venues = data?.venues || [];
      if (venues.length > 0) {
        setLiveVenues(venues);
        setUsingMockData(false);
      } else {
        setUsingMockData(true);
      }
    } catch (e) {
      console.error('Tonight: failed to load venues:', e);
      setUsingMockData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVenues();
  };

  // Build display venues — real data preferred, mock fallback
  const displayVenues = usingMockData
    ? mockVenues.filter((v) => v.heatLevel === 'hot' || v.heatLevel === 'warm').map((v) => ({
        id: v.id,
        name: v.name,
        type: v.type,
        cover: v.cover,
        heatLevel: v.heatLevel,
        latitude: v.latitude,
        longitude: v.longitude,
        isMock: true,
      }))
    : liveVenues
        .filter((v) => v.heatmap_score > 0)
        .sort((a, b) => b.heatmap_score - a.heatmap_score)
        .slice(0, 10)
        .map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type || 'Venue',
          cover: v.cover_charge || 'Free',
          heatLevel: toHeatLevel(v.heatmap_color),
          latitude: v.lat,
          longitude: v.lng,
          isMock: false,
        }));

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tonight</Text>
        <View style={styles.headerRight}>
          {usingMockData && (
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>PREVIEW</Text>
            </View>
          )}
          {checkInCount > 0 && (
            <View style={styles.checkInBadge}>
              <Text style={styles.checkInBadgeText}>{checkInCount}/3 checked in</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.subHeader}>{today} · Philadelphia</Text>

      {/* Trending section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🔥</Text>
        <Text style={[styles.sectionTitle, { color: Colors.hot }]}>TRENDING NOW</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : displayVenues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌙</Text>
          <Text style={styles.emptyTitle}>Quiet night so far</Text>
          <Text style={styles.emptySubtitle}>Check back later — the night is young</Text>
        </View>
      ) : (
        displayVenues.map((venue) => {
          const checkedIn = isCheckedIn(venue.id);
          const maxReached = !canCheckIn && !checkedIn;

          return (
            <TouchableOpacity
              key={venue.id}
              style={[styles.venueCard, checkedIn && styles.venueCardCheckedIn]}
              onPress={() => router.push({
                pathname: '/venue/[id]',
                params: {
                  id: venue.id,
                  name: venue.name,
                  lat: venue.latitude,
                  lng: venue.longitude,
                  type: venue.type,
                  foursquare_id: venue.id,
                }
              })}
              activeOpacity={0.9}
            >
              <View style={styles.venueCardRow}>
                <View style={[styles.heatIconBox, { backgroundColor: heatBadgeColor[venue.heatLevel] }]}>
                  <HeatDotInline level={venue.heatLevel} size={16} />
                </View>
                <View style={styles.venueInfo}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueMeta}>
                    {venue.type} · Cover: {venue.cover}
                  </Text>
                </View>
                <View style={[styles.heatBadge, { backgroundColor: heatBadgeColor[venue.heatLevel] }]}>
                  <Text style={[styles.heatBadgeText, { color: heatTextColor[venue.heatLevel] }]}>
                    {heatLabel[venue.heatLevel]}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkInBtn,
                  checkedIn && styles.checkInBtnActive,
                  maxReached && styles.checkInBtnDisabled,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleCheckIn(venue.id, venue.latitude, venue.longitude, venue.name, '', venue.type);
                }}
                disabled={maxReached}
              >
                <Text
                  style={[
                    styles.checkInBtnText,
                    checkedIn && styles.checkInBtnTextActive,
                    maxReached && styles.checkInBtnTextDisabled,
                  ]}
                >
                  {checkedIn ? '✓ Checked In' : maxReached ? 'Max Reached' : '📍 Check In'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      )}

      {/* Events section */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionIcon}>📅</Text>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>EVENTS NEARBY</Text>
      </View>

      {/* Under Construction overlay */}
      <View style={styles.underConstructionContainer}>
        <View style={styles.blurredContent} pointerEvents="none">
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventMeta}>
                  {event.time} · {event.distance} · {event.venue}
                </Text>
              </View>
              <View style={styles.eventActions}>
                <View style={styles.goingBtn}>
                  <Text style={styles.goingBtnText}>I'm Going</Text>
                </View>
                <View style={styles.interestedBtn}>
                  <Text style={styles.interestedBtnText}>Interested</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.constructionOverlay}>
          <Text style={styles.constructionEmoji}>🚧</Text>
          <Text style={styles.constructionText}>Under Construction</Text>
          <Text style={styles.constructionSubtext}>Events are coming soon!</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subHeader: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 20 },
  previewBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  checkInBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  checkInBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  venueCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  venueCardCheckedIn: { borderColor: Colors.success },
  venueCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  heatIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueInfo: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  venueMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  heatBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  heatBadgeText: { fontSize: 12, fontWeight: '700' },
  checkInBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  checkInBtnActive: { backgroundColor: Colors.successLight },
  checkInBtnDisabled: { backgroundColor: Colors.divider },
  checkInBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  checkInBtnTextActive: { color: Colors.success },
  checkInBtnTextDisabled: { color: Colors.textMuted },
  underConstructionContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  blurredContent: { opacity: 0.15 },
  constructionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingVertical: 32,
  },
  constructionEmoji: { fontSize: 40, marginBottom: 12 },
  constructionText: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  constructionSubtext: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  eventInfo: { marginBottom: 12 },
  eventName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  eventMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  eventActions: { flexDirection: 'row', gap: 10 },
  goingBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  goingBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  interestedBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  interestedBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});