// @ts-nocheck
import HeatDot from '@/components/HeatDot';
import { Colors } from '@/constants/Colors';
import type { HeatLevel } from '@/data/mockData';
import { venues as mockVenues } from '@/data/mockData';
import { connectWebSocket, disconnectWebSocket, getNearbyVenues } from '@/services/api';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const PHILLY_CENTER = { latitude: 39.9526, longitude: -75.1652 };
const FILTERS = ['All', 'Bars', 'Clubs', 'Events', 'Food'];
const REFRESH_INTERVAL_MS = 300000; // 5 minutes

interface LiveVenue {
  id: string;
  foursquare_id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  type: string;
  category: string;
  heatmap_score: number;
  heatmap_color: string | null;
  going_count: number;
  arrived_count: number;
  has_activity: boolean;
}

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

const TYPE_COLORS: Record<string, string> = {
  bar: '#6C63FF',
  club: '#FF2D55',
  food: '#FF9500',
  event: '#30B0C7',
};

function toHeatLevel(color: string): HeatLevel {
  const c = (color || '').toLowerCase();
  if (c === 'hot' || c === 'red') return 'hot';
  if (c === 'warm' || c === 'orange') return 'warm';
  if (c === 'mild' || c === 'yellow') return 'mild';
  return 'quiet';
}

function PulsingMarker({ level, type = 'bar' }: { level: HeatLevel; type?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const hasActivity = level !== 'quiet';
  const dotSize = level === 'hot' ? 26 : level === 'warm' ? 22 : level === 'mild' ? 16 : 13;
  const speed = level === 'hot' ? 700 : level === 'warm' ? 1200 : 0;
  const color = hasActivity ? heatColor[level] : (TYPE_COLORS[type] || TYPE_COLORS.bar);

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

  return (
    <View style={{ width: dotSize + 14, height: dotSize + 14, alignItems: 'center', justifyContent: 'center' }}>
      {hasActivity && (
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
      )}
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          borderWidth: 1.5,
          borderColor: Colors.white,
          opacity: hasActivity ? 1 : 0.75,
        }}
      />
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [liveVenues, setLiveVenues] = useState<LiveVenue[]>([]);
  const [usingMockData, setUsingMockData] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const slideUp = useRef(new Animated.Value(0)).current;
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchHeatmap = useCallback(async (lat?: number, lng?: number) => {
    try {
      const centerLat = lat ?? userLocation?.latitude ?? PHILLY_CENTER.latitude;
      const centerLng = lng ?? userLocation?.longitude ?? PHILLY_CENTER.longitude;
      const category = activeFilter === 'All' ? 'all' : activeFilter.toLowerCase();
      const data = await getNearbyVenues(centerLat, centerLng, 5000, category);
      const venues = data?.venues || [];
      if (venues.length > 0) {
        setLiveVenues(venues);
        setUsingMockData(false);
      } else {
        setUsingMockData(true);
      }
    } catch (e) {
      console.error('Failed to load venues:', e);
      setUsingMockData(true);
    }
  }, [userLocation, activeFilter]);

  // Get user location on mount — always fetch Philly first, then re-fetch if real location available
  useEffect(() => {
    fetchHeatmap(PHILLY_CENTER.latitude, PHILLY_CENTER.longitude);
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((loc) => {
        const { latitude, longitude } = loc.coords;
        setUserLocation({ latitude, longitude });
        fetchHeatmap(latitude, longitude);
      })
      .catch(() => {});
  }, []);

  // 30-second polling refresh
  useEffect(() => {
    refreshTimer.current = setInterval(() => fetchHeatmap(), REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchHeatmap]);

  // Re-fetch when filter changes
  useEffect(() => {
    fetchHeatmap();
  }, [activeFilter]);

  // WebSocket real-time updates
  useEffect(() => {
    connectWebSocket(
      (_heatmapPayload) => {
        console.log('WebSocket heatmap update received');
        fetchHeatmap();
      },
      () => {}
    );
    return () => disconnectWebSocket();
  }, [fetchHeatmap]);

  const markers = usingMockData
    ? mockVenues.map((v) => ({
        id: v.id,
        name: v.name,
        latitude: v.latitude,
        longitude: v.longitude,
        heatLevel: v.heatLevel,
        isMock: true,
        cover: v.cover,
        type: v.type,
        distance: v.distance,
        hours: v.hours,
        tags: v.tags,
      }))
    : liveVenues.map((v) => ({
        id: v.id,
        name: v.name,
        latitude: v.lat,
        longitude: v.lng,
        heatLevel: v.has_activity ? toHeatLevel(v.heatmap_color || 'quiet') : 'quiet' as HeatLevel,
        isMock: false,
        cover: 'Free',
        type: v.type || 'bar',
        distance: '',
        hours: '',
        tags: v.category ? [v.category] : [],
      }));

  const handleMarkerPress = (marker: typeof markers[0]) => {
    setSelectedVenue(marker);
    slideUp.setValue(0);
    Animated.spring(slideUp, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  const handleDismissCard = () => {
    Animated.spring(slideUp, { toValue: 0, friction: 8, useNativeDriver: true }).start(() => {
      setSelectedVenue(null);
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: PHILLY_CENTER.latitude,
          longitude: PHILLY_CENTER.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle="light"
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsCompass={false}
      >
        {markers.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.latitude, longitude: v.longitude }}
            onPress={() => handleMarkerPress(v)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <PulsingMarker level={v.heatLevel} type={v.type} />
          </Marker>
        ))}
      </MapView>

      {/* Top overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
      <View style={styles.legendRow}>
          {(['hot', 'warm', 'mild', 'quiet'] as HeatLevel[]).map((lvl) => (
            <View key={lvl} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: heatColor[lvl] }]} />
              <Text style={styles.legendText}>{heatLabel[lvl]}</Text>
            </View>
          ))}
          {usingMockData && (
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>PREVIEW</Text>
            </View>
          )}
        </View>

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

      {/* Bottom venue card */}
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
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismissCard}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.cardRow}>
            <HeatDot level={selectedVenue.heatLevel} size={14} animate />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedVenue.name}</Text>
              <Text style={styles.cardMeta}>
                {[selectedVenue.type, selectedVenue.distance, selectedVenue.hours]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewBtn}
              onPress={() => router.push({
                pathname: `/venue/${selectedVenue.id}`,
                params: {
                  name: selectedVenue.name,
                  lat: selectedVenue.latitude,
                  lng: selectedVenue.longitude,
                  type: selectedVenue.type,
                  category: selectedVenue.tags?.[0] || '',
                  foursquare_id: selectedVenue.id,
                }
              })}
            >
              <Text style={styles.viewBtnText}>View →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.coverRow}>
            <View style={styles.coverBadge}>
              <Text style={styles.coverText}>Cover: {selectedVenue.cover}</Text>
            </View>
          </View>

          {selectedVenue.tags?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {selectedVenue.tags.map((tag: string, i: number) => (
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  legendDivider: { width: 1, height: 16, backgroundColor: Colors.divider, marginHorizontal: 4 },
  mockBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  mockBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
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