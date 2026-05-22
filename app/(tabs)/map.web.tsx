import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { venues } from '@/data/mockData';
import HeatDot from '@/components/HeatDot';
import type { HeatLevel } from '@/data/mockData';

const { width } = Dimensions.get('window');
const FILTERS = ['All', 'Bars', 'Clubs', 'Events', 'Food'];

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

// Normalised positions for the mock map (0–1 relative to a 390×500 canvas)
const venuePositions: Record<string, { x: number; y: number }> = {
  '1': { x: 0.46, y: 0.52 },
  '2': { x: 0.62, y: 0.22 },
  '3': { x: 0.50, y: 0.61 },
  '4': { x: 0.48, y: 0.72 },
  '5': { x: 0.71, y: 0.18 },
};

function PulsingDot({ level }: { level: HeatLevel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const dotSize = level === 'hot' ? 20 : level === 'warm' ? 16 : level === 'mild' ? 12 : 9;
  const speed = level === 'hot' ? 700 : level === 'warm' ? 1300 : 0;

  useEffect(() => {
    if (!speed) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: speed / 2, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: speed / 2, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: speed / 2, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const color = heatColor[level];
  return (
    <View style={{ width: dotSize + 12, height: dotSize + 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: dotSize + 10,
          height: dotSize + 10,
          borderRadius: (dotSize + 10) / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, borderWidth: 2, borderColor: '#fff' }} />
    </View>
  );
}

const MAP_HEIGHT = 480;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeVenue] = useState(venues[0]);
  const slideUp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideUp, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Mock map background */}
      <View style={styles.mapArea}>
        {/* Grid lines to simulate map tiles */}
        {[...Array(8)].map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 14}%` }]} />
        ))}
        {[...Array(6)].map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: `${i * 20}%` }]} />
        ))}

        {/* Road lines */}
        <View style={styles.roadH1} />
        <View style={styles.roadH2} />
        <View style={styles.roadV1} />
        <View style={styles.roadV2} />

        {/* Block fills */}
        <View style={styles.block1} />
        <View style={styles.block2} />
        <View style={styles.block3} />

        {/* Venue dots */}
        {venues.map((v) => {
          const pos = venuePositions[v.id] ?? { x: 0.5, y: 0.5 };
          return (
            <TouchableOpacity
              key={v.id}
              style={[
                styles.markerWrapper,
                { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` },
              ]}
              onPress={() => router.push(`/venue/${v.id}`)}
            >
              <PulsingDot level={v.heatLevel} />
            </TouchableOpacity>
          );
        })}

        {/* User location dot */}
        <View style={styles.userDot}>
          <View style={styles.userDotInner} />
        </View>

        {/* "Philadelphia" label */}
        <Text style={styles.cityLabel}>Philadelphia, PA</Text>
      </View>

      {/* Top overlay */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.legendRow}>
          {(['hot', 'warm', 'mild', 'quiet'] as HeatLevel[]).map((lvl) => (
            <View key={lvl} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: heatColor[lvl] }]} />
              <Text style={styles.legendText}>{heatLabel[lvl]}</Text>
            </View>
          ))}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom card */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            paddingBottom: insets.bottom + 96,
            transform: [{ translateY: slideUp.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }],
          },
        ]}
      >
        <View style={styles.cardHandle} />
        <View style={styles.cardRow}>
          <HeatDot level={activeVenue.heatLevel} size={14} animate />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{activeVenue.name}</Text>
            <Text style={styles.cardMeta}>{activeVenue.type} · {activeVenue.distance} · {activeVenue.hours}</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/venue/${activeVenue.id}`)}>
            <Text style={styles.viewBtnText}>View →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.coverRow}>
          <View style={styles.coverBadge}>
            <Text style={styles.coverText}>Cover: {activeVenue.cover}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {activeVenue.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.mapBackground },

  mapArea: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#E8EDF2',
    overflow: 'hidden',
  },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(180,190,200,0.4)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(180,190,200,0.4)' },
  roadH1: { position: 'absolute', top: '38%', left: 0, right: 0, height: 6, backgroundColor: '#fff', opacity: 0.8 },
  roadH2: { position: 'absolute', top: '62%', left: 0, right: 0, height: 4, backgroundColor: '#fff', opacity: 0.7 },
  roadV1: { position: 'absolute', left: '44%', top: 0, bottom: 0, width: 6, backgroundColor: '#fff', opacity: 0.8 },
  roadV2: { position: 'absolute', left: '68%', top: 0, bottom: 0, width: 4, backgroundColor: '#fff', opacity: 0.7 },
  block1: { position: 'absolute', left: '20%', top: '10%', width: '22%', height: '26%', backgroundColor: '#D4DBE4', borderRadius: 4 },
  block2: { position: 'absolute', left: '50%', top: '40%', width: '15%', height: '18%', backgroundColor: '#D4DBE4', borderRadius: 4 },
  block3: { position: 'absolute', left: '10%', top: '50%', width: '30%', height: '20%', backgroundColor: '#D4DBE4', borderRadius: 4 },
  markerWrapper: { position: 'absolute', transform: [{ translateX: -16 }, { translateY: -16 }] },
  userDot: {
    position: 'absolute', left: '52%', top: '45%',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, borderWidth: 3, borderColor: '#fff',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
  },
  userDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', margin: 3 },
  cityLabel: { position: 'absolute', bottom: 160, alignSelf: 'center', fontSize: 11, fontWeight: '600', color: 'rgba(80,90,100,0.5)', letterSpacing: 2 },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 8 },
  legendRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  searchContainer: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 14,
    alignItems: 'center', paddingHorizontal: 14, height: 48,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  liveBadge: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  liveBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  filterRow: { paddingVertical: 2, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },

  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8,
  },
  cardHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  viewBtn: { backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  viewBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  coverRow: { flexDirection: 'row', marginTop: 10 },
  coverBadge: { backgroundColor: Colors.successLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  coverText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  tag: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8 },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
});
