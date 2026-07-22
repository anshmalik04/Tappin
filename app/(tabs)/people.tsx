import { Colors } from '@/constants/Colors';
import { useCheckIn } from '@/context/CheckInContext';
import { users as mockUsers } from '@/data/mockData';
import { createTapIn, getPeopleAtVenue } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const CARD_HEIGHT = height * 0.6;

// Single shape the UI renders, whatever the source is.
interface Person {
  id: string;
  name: string;
  age: number | null;
  bio: string;
  matchScore: number | null;
  vibeTags: string[];
  musicTaste: string[];
}

// Real API: /venues/{id}/people
const fromApi = (p: any): Person => ({
  id: String(p.id ?? p.user_id ?? ''),
  name: p.name ?? 'Someone',
  age: typeof p.age === 'number' ? p.age : null,
  bio: p.bio ?? '',
  matchScore: typeof p.match_score === 'number' ? p.match_score : null,
  vibeTags: Array.isArray(p.vibe_tags) ? p.vibe_tags : [],
  musicTaste: Array.isArray(p.music_taste) ? p.music_taste : [],
});

// Mock fixtures use different field names. Normalize here, not in render.
const fromMock = (u: any): Person => ({
  id: String(u.id ?? ''),
  name: u.name ?? 'Someone',
  age: typeof u.age === 'number' ? u.age : null,
  bio: u.bio ?? '',
  matchScore: typeof u.matchPercent === 'number' ? u.matchPercent : null,
  vibeTags: Array.isArray(u.personality) ? u.personality : [],
  musicTaste: Array.isArray(u.musicTaste) ? u.musicTaste : [],
});

function UserCard({ person, onPress }: { person: Person; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={{ flex: 1 }}>
      <LinearGradient colors={['#B5CDEE', '#7FAADF']} style={styles.photo}>
        {person.matchScore !== null && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{person.matchScore}% match</Text>
          </View>
        )}
        <Text style={styles.photoInitial}>
          {(person.name || '?').charAt(0).toUpperCase()}
        </Text>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {person.name}
            {person.age !== null ? `, ${person.age}` : ''}
          </Text>
          {/* Location intentionally omitted for safety */}
          {person.bio.length > 0 && (
            <Text style={styles.cardBio} numberOfLines={2}>
              {person.bio}
            </Text>
          )}
          <View style={styles.tagRow}>
            {person.vibeTags.slice(0, 3).map((trait) => (
              <View key={trait} style={styles.tag}>
                <Text style={styles.tagText}>{trait}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.tapHint}>Tap to view full profile</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const { checkIns } = useCheckIn();

  // Most recent active check-in decides which venue we browse.
  const activeVenueId = checkIns.length > 0 ? checkIns[checkIns.length - 1].venueId : null;

  const [index, setIndex] = useState(0);
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null);
  const [people, setPeople] = useState<Person[]>(mockUsers.map(fromMock));
  const [usingMockData, setUsingMockData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [matchedWith, setMatchedWith] = useState<Person | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // panResponder is built once, so it would capture stale state.
  // These refs give the gesture handler the current values.
  const personRef = useRef<Person | null>(null);
  // Blocks a second swipe while a card is still animating off. Without this,
  // a fast double-swipe fires goToNext twice for the same person: duplicate
  // Tap In, and the next card gets skipped without ever being seen.
  const animatingRef = useRef(false);
  const venueRef = useRef<string | null>(null);
  venueRef.current = activeVenueId;

  const showBanner = useCallback(
    (text: string, color: string) => {
      setBanner({ text, color });
      Animated.sequence([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(bannerOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setBanner(null));
    },
    [bannerOpacity]
  );

  const loadPeople = useCallback(async () => {
    if (!activeVenueId) {
      setPeople(mockUsers.map(fromMock));
      setUsingMockData(true);
      return;
    }
    setLoading(true);
    try {
      const data: any = await getPeopleAtVenue(activeVenueId);
      const raw = data?.people ?? data?.users ?? [];
      const list = raw.map(fromApi).filter((p: Person) => p.id.length > 0);
      setPeople(list);
      setUsingMockData(false);
      setIndex(0);
    } catch (err) {
      console.log('getPeopleAtVenue failed, showing preview data:', err);
      setPeople(mockUsers.map(fromMock));
      setUsingMockData(true);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [activeVenueId]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const sendTapIn = useCallback(
    async (person: Person, venueId: string | null) => {
      if (!venueId || !person.id) {
        showBanner('Tap In sent!', Colors.primary);
        return;
      }
      try {
        const res: any = await createTapIn(person.id, venueId);
        const isMatch = res?.isMatch ?? res?.is_match ?? false;
        if (isMatch) {
          setMatchedWith(person);
        } else {
          showBanner('Tap In sent!', Colors.primary);
        }
      } catch (err) {
        console.log('createTapIn failed:', err);
        showBanner('Could not send Tap In', Colors.hot);
      }
    },
    [showBanner]
  );

  const goToNext = useCallback(
    (direction: 'left' | 'right') => {
      const person = personRef.current;
      if (direction === 'right' && person) {
        sendTapIn(person, venueRef.current);
      } else if (direction === 'left') {
        showBanner('Passed', Colors.textMuted);
      }
      position.setValue({ x: 0, y: 0 });
      animatingRef.current = false;
      setIndex((prev) => prev + 1);
    },
    [position, sendTapIn, showBanner]
  );

  const goToNextRef = useRef(goToNext);
  goToNextRef.current = goToNext;

  const animateOffscreen = useCallback(
    (direction: 'left' | 'right', dy = 0) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      const toX = direction === 'right' ? width + 100 : -width - 100;
      Animated.timing(position, {
        toValue: { x: toX, y: dy },
        duration: 250,
        useNativeDriver: false,
      }).start(({ finished }) => {
        // An interrupted animation still calls back. Only advance on a real finish.
        if (finished) goToNextRef.current(direction);
        else animatingRef.current = false;
      });
    },
    [position]
  );

  const animateRef = useRef(animateOffscreen);
  animateRef.current = animateOffscreen;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !animatingRef.current && Math.abs(gesture.dx) > 5,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          animateRef.current('right', gesture.dy);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          animateRef.current('left', gesture.dy);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const currentPerson = people[index] ?? null;
  personRef.current = currentPerson;

  const handleViewProfile = () => {
    if (!currentPerson) return;
    router.push({
      pathname: '/profile-view/[id]',
      params: {
        id: currentPerson.id,
        name: currentPerson.name,
        age: currentPerson.age ?? '',
        bio: currentPerson.bio,
        matchPercent: currentPerson.matchScore ?? '',
        personality: currentPerson.vibeTags.join(','),
        music: currentPerson.musicTaste.join(','),
      },
    });
  };

  const subtitle = activeVenueId
    ? 'Swipe to Tap In or Pass'
    : 'Check in to a venue to see who is there';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>People Nearby</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {usingMockData && (
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>PREVIEW</Text>
          </View>
        )}
      </View>

      {banner && (
        <Animated.View
          style={[styles.banner, { opacity: bannerOpacity, backgroundColor: banner.color }]}
        >
          <Text style={styles.bannerText}>{banner.text}</Text>
        </Animated.View>
      )}

      <View style={styles.cardArea}>
        {loading && <ActivityIndicator size="large" color={Colors.primary} />}

        {!loading && !currentPerson && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{activeVenueId ? '\u2728' : '\u{1F4CD}'}</Text>
            <Text style={styles.emptyTitle}>
              {activeVenueId ? "You're all caught up" : 'Not checked in yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeVenueId
                ? 'Check back later for more people at this venue'
                : 'Check in to a venue from the map to see who else is there'}
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => (activeVenueId ? loadPeople() : router.push('/(tabs)/map'))}
            >
              <Text style={styles.resetBtnText}>
                {activeVenueId ? 'Refresh' : 'Open Map'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && currentPerson && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
              },
            ]}
          >
            <UserCard person={currentPerson} onPress={handleViewProfile} />
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={[styles.stampText, { color: Colors.success }]}>TAP IN</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
              <Text style={[styles.stampText, { color: Colors.hot }]}>PASS</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {!loading && currentPerson && (
        <View style={[styles.actionRow, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => animateOffscreen('left')}
          >
            <Text style={styles.actionBtnSecondaryText}>{'\u2715'}</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.actionBtnPrimary}
          >
            <TouchableOpacity
              style={styles.actionBtnPrimaryInner}
              onPress={() => animateOffscreen('right')}
            >
              <Text style={styles.actionBtnPrimaryText}>{'\u{1F44B}'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {matchedWith && (
        <View style={styles.matchOverlay}>
          <Text style={styles.matchEmoji}>{'\u{1F44B}'}</Text>
          <Text style={styles.matchTitle}>You both Tapped In!</Text>
          <Text style={styles.matchSubtitle}>
            You and {matchedWith.name} are matched. Say hi from the Chat tab.
          </Text>
          <TouchableOpacity style={styles.matchBtn} onPress={() => setMatchedWith(null)}>
            <Text style={styles.matchBtnText}>Keep swiping</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },
  previewBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: width - 32,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  photo: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  photoInitial: {
    position: 'absolute',
    top: '28%',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 100,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.35)',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  cardInfo: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 16 },
  cardName: { fontSize: 24, fontWeight: '800', color: Colors.white },
  cardBio: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.white },
  tapHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: { right: 24, borderColor: Colors.success, transform: [{ rotate: '15deg' }] },
  passStamp: { left: 24, borderColor: Colors.hot, transform: [{ rotate: '-15deg' }] },
  stampText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  banner: {
    position: 'absolute',
    top: 60,
    left: 40,
    right: 40,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 20,
  },
  bannerText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  emptyState: { alignItems: 'center', gap: 8, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  resetBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  resetBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingTop: 16,
  },
  actionBtnSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnSecondaryText: { fontSize: 22, color: Colors.textPrimary },
  actionBtnPrimary: {
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionBtnPrimaryInner: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  actionBtnPrimaryText: { fontSize: 28 },
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 50,
  },
  matchEmoji: { fontSize: 64, marginBottom: 12 },
  matchTitle: { fontSize: 28, fontWeight: '900', color: Colors.white, textAlign: 'center' },
  matchSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  matchBtn: {
    marginTop: 28,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  matchBtnText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
});
