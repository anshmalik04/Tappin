import { Colors } from '@/constants/Colors';
import type { User } from '@/data/mockData';
import { users } from '@/data/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
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

function UserCard({ user }: { user: User }) {
  return (
    <LinearGradient colors={['#B5CDEE', '#7FAADF']} style={styles.photo}>
      <View style={styles.matchBadge}>
        <Text style={styles.matchBadgeText}>{user.matchPercent}% match</Text>
      </View>
      <Text style={styles.photoInitial}>{user.initial}</Text>

      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {user.name}, {user.age}
        </Text>
        {user.currentVenue && <Text style={styles.cardVenue}>📍 {user.currentVenue}</Text>}
        <Text style={styles.cardBio} numberOfLines={2}>
          {user.bio}
        </Text>
        <View style={styles.tagRow}>
          {user.personality.slice(0, 3).map((trait) => (
            <View key={trait} style={styles.tag}>
              <Text style={styles.tagText}>{trait}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null);

  const position = useRef(new Animated.ValueXY()).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  const showBanner = (text: string, color: string) => {
    setBanner({ text, color });
    Animated.sequence([
      Animated.timing(bannerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(700),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setBanner(null));
  };

  const goToNext = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      showBanner('👋 Tap In sent!', Colors.primary);
    } else {
      showBanner('Passed', Colors.textMuted);
    }
    position.setValue({ x: 0, y: 0 });
    setIndex((prev) => prev + 1);
  };

  const animateOffscreen = (direction: 'left' | 'right', dy = 0) => {
    const toX = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x: toX, y: dy },
      duration: 250,
      useNativeDriver: false,
    }).start(() => goToNext(direction));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          animateOffscreen('right', gesture.dy);
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          animateOffscreen('left', gesture.dy);
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

  const currentUser = users[index];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>People Nearby</Text>
      <Text style={styles.subtitle}>Swipe to Tap In or Pass</Text>

      {banner && (
        <Animated.View
          style={[styles.banner, { opacity: bannerOpacity, backgroundColor: banner.color }]}
        >
          <Text style={styles.bannerText}>{banner.text}</Text>
        </Animated.View>
      )}

      <View style={styles.cardArea}>
        {!currentUser && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySubtitle}>Check back later for more people nearby</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={() => setIndex(0)}>
              <Text style={styles.resetBtnText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentUser && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
              },
            ]}
          >
            <UserCard user={currentUser} />
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={[styles.stampText, { color: Colors.success }]}>TAP IN</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.passStamp, { opacity: passOpacity }]}>
              <Text style={[styles.stampText, { color: Colors.hot }]}>PASS</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {currentUser && (
        <View style={[styles.actionRow, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => animateOffscreen('left')}
          >
            <Text style={styles.actionBtnSecondaryText}>✕</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            style={styles.actionBtnPrimary}
          >
            <TouchableOpacity
              style={styles.actionBtnPrimaryInner}
              onPress={() => animateOffscreen('right')}
            >
              <Text style={styles.actionBtnPrimaryText}>👋</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },
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
  cardInfo: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    padding: 16,
  },
  cardName: { fontSize: 24, fontWeight: '800', color: Colors.white },
  cardVenue: { fontSize: 13, fontWeight: '700', color: Colors.white, marginTop: 4 },
  cardBio: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: Colors.white },
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
});