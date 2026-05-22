import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { venues, events } from '@/data/mockData';
import { useCheckIn } from '@/context/CheckInContext';
import { HeatDotInline } from '@/components/HeatDot';
import type { HeatLevel } from '@/data/mockData';

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

const trendingVenues = venues.filter((v) => v.heatLevel === 'hot' || v.heatLevel === 'warm');

export default function TonightScreen() {
  const insets = useSafeAreaInsets();
  const { isCheckedIn, toggleCheckIn, canCheckIn, checkInCount } = useCheckIn();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tonight</Text>
        {checkInCount > 0 && (
          <View style={styles.checkInBadge}>
            <Text style={styles.checkInBadgeText}>{checkInCount}/3 checked in</Text>
          </View>
        )}
      </View>
      <Text style={styles.subHeader}>Friday, May 21 · Philadelphia</Text>

      {/* Trending section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>🔥</Text>
        <Text style={[styles.sectionTitle, { color: Colors.hot }]}>TRENDING NOW</Text>
      </View>

      {trendingVenues.map((venue) => {
        const checkedIn = isCheckedIn(venue.id);
        const maxReached = !canCheckIn && !checkedIn;

        return (
          <TouchableOpacity
            key={venue.id}
            style={[styles.venueCard, checkedIn && styles.venueCardCheckedIn]}
            onPress={() => router.push(`/venue/${venue.id}`)}
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
                toggleCheckIn(venue.id);
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
      })}

      {/* Events section */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionIcon}>📅</Text>
        <Text style={[styles.sectionTitle, { color: Colors.primary }]}>EVENTS NEARBY</Text>
      </View>

      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{event.name}</Text>
            <Text style={styles.eventMeta}>
              {event.time} · {event.distance} · {event.venue}
            </Text>
            <Text style={styles.eventInterest}>{event.interestedCount} interested</Text>
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity style={styles.goingBtn}>
              <Text style={styles.goingBtnText}>I'm Going</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.interestedBtn}>
              <Text style={styles.interestedBtnText}>Interested</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subHeader: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 20 },
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
  eventInterest: { fontSize: 12, fontWeight: '600', color: Colors.primary, marginTop: 4 },
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
