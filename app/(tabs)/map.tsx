import HeatDot from '@/components/HeatDot';
import { Colors } from '@/constants/Colors';
import type { HeatLevel } from '@/data/mockData';
import { venues as mockVenues } from '@/data/mockData';
import { connectWebSocket, disconnectWebSocket, getHeatmapData } from '@/services/api';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PHILLY_CENTER = { latitude: 39.9526, longitude: -75.1652 };
const FILTERS = ['All', 'Bars', 'Clubs', 'Events', 'Food'];
const REFRESH_INTERVAL_MS = 30000; // 30 seconds

const heatColor: Record<HeatLevel, string> = {
  hot: Colors.hot,
  warm: Colors.warm,
  mild: Colors.mild,
  quiet: Colors.quiet,
};

const heatLabel: Record<HeatLevel, string> = {
  hot: 'Hot',
  warm: 'Warm',
  mild: 'Mild',
  quiet: 'Quiet',
};

// Normalized venue shape the UI renders, regardless of source (real API or mock).
interface MapVenue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  heatLevel: HeatLevel;
  type: string;
  goingCount: number | null;
  arrivedCount: number | null;
  // mock-only extras (undefined for real venues)
  cover?: string;
  distance?: string;
  hours?: string;
  tags?: string[];
}

// Turn a real API heatmap_score (0-100ish) into our hot/warm/mild/quiet levels.
const scoreToLevel = (score: number): HeatLevel => {
  if (score >= 75) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 25) return 'mild';
  return 'quiet';
};

// Map a real API venue object to our normalized MapVenue shape.
const fromApiVenue = (v: any): MapVenue => ({
  id: String(v.id),
  name: v.name,
  latitude: v.lat,
  longitude: v.lng,
  heatLevel: scoreToLevel(Number(v.heatmap_score) || 0),
  type: v.type || v.category || 'Venue',
  goingCount: typeof v.going_count === 'number' ? v.going_count : null,
  arrivedCount: typeof v.arrived_count === 'number' ? v.arrived_count : null,
});

// Map a mock venue to the same shape so the UI code is uniform.
const fromMockVenue = (v: any): MapVenue => ({
  id: String(v.id),
  name: v.name,
  latitude: v.latitude,
  longitude: v.longitude,
  heatLevel: v.heatLevel,
  type: v.type,
  goingCount: null,
  arrivedCount: null,
  cover: v.cover,
  distance: v.distance,
  hours: v.hours,
  tags: v.tags,
});

const MOCK_MAP_VENUES: MapVenue[] = mockVenues.map(fromMockVenue);

function PulsingMarker({ level }: { level: HeatLevel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const dotSize = level === 'hot' ? 22 : level === 'warm' ? 18 : level === 'mild' ? 13 : 10;
  const speed = level === 'hot' ? 700 : level === 'warm' ? 1200 : 0;

  useEffect(() => {
    if (!speed) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.5, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: speed / 2, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.5, duration: speed / 2, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const color = heatColor[level];

  return (
    <View style={{ width: dotSize + 14, height: dotSize + 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: dotSize + 12,
          height: dotSize + 12,
          borderRadius: (dotSize + 12) / 2,
          backgroundColor: color,
          opacity: pulseOpacity,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: Colors.white,
        }}
      />
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState<MapVenue | null>(null);
  const [venues, setVenues] = useState<MapVenue[]>(MOCK_MAP_VENUES);
  const [usingMock, setUsingMock] = useState(true);
  const slideUp = useRef(new Animated.Value(0)).current;

  // Fetch real heatmap data; fall back to mock on failure or empty.
  const loadVenues = async () => {
    try {
      const data: any = await getHeatmapData(PHILLY_CENTER.latitude, PHILLY_CENTER.longitude);
      const list = data?.venues || data || [];
      if (Array.isArray(list) && list.length > 0) {
        setVenues(list.map(fromApiVenue));
        setUsingMock(false);
      } else {
        setVenues(MOCK_MAP_VENUES);
        setUsingMock(true);
      }
    } catch (e) {
      console.error('Failed to load heatmap:', e);
      setVenues(MOCK_MAP_VENUES);
      setUsingMock(true);
    }
  };

  useEffect(() => {
    // Initial load
    loadVenues();

    // Refresh every 30 seconds
    const interval = setInterval(loadVenues, REFRESH_INTERVAL_MS);

    // Subscribe to live heatmap updates via WebSocket
    connectWebSocket(
      (payload: any) => {
        const list = payload?.venues || payload || [];
        if (Array.isArray(list) && list.length > 0) {
          setVenues(list.map(fromApiVenue));
          setUsingMock(false);
        }
      },
      undefined as any // no chat handler on the map screen
    );

    return () => {
      clearInterval(interval);
      disconnectWebSocket();
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: PHILLY_CENTER.latitude,
          longitude: PHILLY_CENTER.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="light"
      >
        {venues.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.latitude, longitude: v.longitude }}
            onPress={() => {
              setSelectedVenue(v);
              slideUp.setValue(0);
              Animated.spring(slideUp, { toValue: 1, friction: 8, useNativeDriver: true }).start();
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <PulsingMarker level={v.heatLevel} />
          </Marker>
        ))}
      </MapView>

      {/* Overlay UI */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        {/* Heat legend */}
        <View style={styles.legendRow}>
          {(['hot', 'warm', 'mild', 'quiet'] as HeatLevel[]).map((lvl) => (
            <View key={lvl} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: heatColor[lvl] }]} />
              <Text style={styles.legendText}>{heatLabel[lvl]}</Text>
            </View>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, events..."
            placeholderTextColor={Colors.textMuted}
          />
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Preview-data badge when falling back to mock */}
        {usingMock && (
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW DATA</Text>
          </View>
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* User location dot overlay hint */}
      <View style={styles.userDotGlow} pointerEvents="none" />

      {/* Bottom card - only shows when a venue marker is tapped */}
      {selectedVenue && (
        <Animated.View
          style={[
            styles.bottomCard,
            {
              paddingBottom: insets.bottom + 96,
              transform: [
                {
                  translateY: slideUp.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHandle} />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => {
              Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }).start(() => {
                setSelectedVenue(null);
              });
            }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardRow}>
            <HeatDot level={selectedVenue.heatLevel} size={14} animate />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedVenue.name}</Text>
              <Text style={styles.cardMeta}>
                {selectedVenue.type}
                {selectedVenue.distance ? ` · ${selectedVenue.distance}` : ''}
                {selectedVenue.hours ? ` · ${selectedVenue.hours}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => router.push(`/venue/${selectedVenue.id}`)}
            >
              <Text style={styles.viewBtnText}>View →</Text>
            </TouchableOpacity>
          </View>

          {/* Live counts (real venues) or cover (mock venues) */}
          <View style={styles.coverRow}>
            {selectedVenue.goingCount !== null || selectedVenue.arrivedCount !== null ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>
                  {selectedVenue.arrivedCount ?? 0} here · {selectedVenue.goingCount ?? 0} going
                </Text>
              </View>
            ) : selectedVenue.cover ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>Cover: {selectedVenue.cover}</Text>
              </View>
            ) : null}
          </View>

          {selectedVenue.tags && selectedVenue.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {selectedVenue.tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.mapBackground },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  liveBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  previewBadge: {
    alignSelf: 'center',
    backgroundColor: Colors.warning,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  previewBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  filterRow: { paddingVertical: 2, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },
  userDotGlow: {
    position: 'absolute',
    bottom: '40%',
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  viewBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  coverRow: { flexDirection: 'row', marginTop: 10 },
  coverBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coverText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  tag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
});