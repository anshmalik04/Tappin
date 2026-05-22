import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { venues } from '@/data/mockData';
import { useCheckIn } from '@/context/CheckInContext';
import { HeatDotInline } from '@/components/HeatDot';

const { width } = Dimensions.get('window');
const PHOTO_COUNT = 4;

const PLACEHOLDER_COLORS = ['#C9D8F0', '#B5CDEE', '#D4E4FF', '#C2D6F5'];

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const venue = venues.find((v) => v.id === id) ?? venues[0];
  const { isCheckedIn, toggleCheckIn, canCheckIn, checkInCount } = useCheckIn();
  const checkedIn = isCheckedIn(venue.id);
  const maxReached = !canCheckIn && !checkedIn;
  const [photoIndex, setPhotoIndex] = useState(0);

  const maxTraffic = Math.max(...venue.traffic.map((t) => t.level));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Photo carousel */}
      <View style={styles.carousel}>
        <FlatList
          data={PLACEHOLDER_COLORS}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <View style={[styles.photo, { backgroundColor: item }]}>
              <Text style={styles.photoPlaceholder}>{venue.name}</Text>
            </View>
          )}
        />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 12 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        {/* Photo counter */}
        <View style={styles.photoCounter}>
          <Text style={styles.photoCounterText}>
            {photoIndex + 1}/{PHOTO_COUNT}
          </Text>
        </View>

        {/* Dot indicators */}
        <View style={styles.dotRow}>
          {PLACEHOLDER_COLORS.map((_, i) => (
            <View
              key={i}
              style={[styles.dotIndicator, i === photoIndex && styles.dotIndicatorActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Venue header */}
        <View style={styles.header}>
          <View style={styles.venueNameRow}>
            <HeatDotInline level={venue.heatLevel} size={12} />
            <Text style={styles.venueName}>{venue.name}</Text>
          </View>
          <Text style={styles.venueAddress}>{venue.address}</Text>
          <Text style={styles.venueType}>{venue.type}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{venue.cover}</Text>
            <Text style={styles.statLabel}>COVER</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{venue.peakHours}</Text>
            <Text style={styles.statLabel}>PEAK</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{venue.vibe}</Text>
            <Text style={styles.statLabel}>VIBE</Text>
          </View>
        </View>

        {/* Cover info */}
        <View style={styles.coverCard}>
          <Text style={styles.coverCardTitle}>💳 COVER INFO</Text>
          <Text style={styles.coverCardText}>{venue.coverInfo}</Text>
        </View>

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crowd Demographics</Text>
          <View style={styles.demoBar}>
            {venue.demographics.map((d, i) => {
              const colors = [Colors.primary, '#7AB8FF', '#B8D9FF'];
              return (
                <View
                  key={d.label}
                  style={[
                    styles.demoSegment,
                    { flex: d.percentage, backgroundColor: colors[i % colors.length] },
                    i === 0 && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
                    i === venue.demographics.length - 1 && {
                      borderTopRightRadius: 6,
                      borderBottomRightRadius: 6,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.demoLabels}>
            {venue.demographics.map((d, i) => {
              const colors = [Colors.primary, '#7AB8FF', '#B8D9FF'];
              return (
                <View key={d.label} style={styles.demoLabelItem}>
                  <View style={[styles.demoLabelDot, { backgroundColor: colors[i % colors.length] }]} />
                  <Text style={styles.demoLabelText}>
                    {d.label}: {d.percentage}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Traffic chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tonight's Traffic</Text>
          <View style={styles.trafficChart}>
            {venue.traffic.map((t, i) => {
              const isNow = t.hour === '9pm';
              const barHeight = Math.max(8, (t.level / maxTraffic) * 80);
              return (
                <View key={t.hour} style={styles.trafficBarCol}>
                  <View
                    style={[
                      styles.trafficBar,
                      { height: barHeight, backgroundColor: isNow ? Colors.primary : Colors.border },
                    ]}
                  />
                  <Text style={[styles.trafficLabel, isNow && { color: Colors.primary, fontWeight: '700' }]}>
                    {t.hour.replace('pm', '').replace('am', '')}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.trafficAxisRow}>
            <Text style={styles.trafficAxisLabel}>6pm</Text>
            <Text style={styles.trafficAxisLabel}>2am</Text>
          </View>
        </View>

        {/* Check-in button */}
        <View style={styles.checkInContainer}>
          <TouchableOpacity
            style={[
              styles.checkInBtn,
              checkedIn && styles.checkInBtnActive,
              maxReached && styles.checkInBtnDisabled,
            ]}
            onPress={() => toggleCheckIn(venue.id)}
            disabled={maxReached}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.checkInBtnText,
                checkedIn && styles.checkInBtnTextActive,
                maxReached && styles.checkInBtnTextDisabled,
              ]}
            >
              {checkedIn ? '✓ Checked In' : maxReached ? 'Max 3 Check-Ins Reached' : '📍 Check In Here'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.checkInSubtext}>{checkInCount}/3 check-ins used tonight</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  carousel: { height: 280, position: 'relative' },
  photo: {
    width,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, color: Colors.white, fontWeight: '700' },
  photoCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  photoCounterText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  dotRow: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotIndicatorActive: { backgroundColor: Colors.white, width: 18 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  venueNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  venueName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  venueAddress: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  venueType: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: Colors.white },
  statCardMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, marginTop: 2, letterSpacing: 1 },
  coverCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  coverCardTitle: { fontSize: 12, fontWeight: '800', color: Colors.primary, letterSpacing: 1, marginBottom: 6 },
  coverCardText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  demoBar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  demoSegment: { height: 12 },
  demoLabels: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  demoLabelItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  demoLabelDot: { width: 8, height: 8, borderRadius: 4 },
  demoLabelText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  trafficChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 4,
  },
  trafficBarCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  trafficBar: { width: '80%', borderRadius: 4, minHeight: 8 },
  trafficLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },
  trafficAxisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  trafficAxisLabel: { fontSize: 11, color: Colors.textMuted },
  checkInContainer: { paddingHorizontal: 20, marginBottom: 8 },
  checkInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkInBtnActive: { backgroundColor: Colors.success },
  checkInBtnDisabled: { backgroundColor: Colors.border },
  checkInBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  checkInBtnTextActive: { color: Colors.white },
  checkInBtnTextDisabled: { color: Colors.textMuted },
  checkInSubtext: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});
