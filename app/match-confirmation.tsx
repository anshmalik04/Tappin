import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';

export default function MatchConfirmationScreen() {
  const { matchId, otherUserName, venueName } = useLocalSearchParams<{
    matchId: string;
    otherUserName: string;
    venueName: string;
  }>();
  const insets = useSafeAreaInsets();

  const handleStartChat = () => {
    router.replace({
      pathname: `/chat/${matchId}`,
      params: {
        otherUserName: otherUserName || 'Match',
        venueName: venueName || '',
      },
    } as any);
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <LinearGradient
      colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Avatars */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>You</Text>
          </View>
          <View style={styles.heartContainer}>
            <Text style={styles.heartEmoji}>🎉</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherUserName ? otherUserName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>You both Tapped In!</Text>
        <Text style={styles.subtitle}>
          You and {otherUserName || 'someone'} matched
          {venueName ? ` at ${venueName}` : ''}
        </Text>

        {/* Start chatting button */}
        <TouchableOpacity style={styles.chatBtn} onPress={handleStartChat}>
          <Text style={styles.chatBtnText}>Start Chatting 💬</Text>
        </TouchableOpacity>

        {/* Keep browsing */}
        <TouchableOpacity style={styles.browseBtn} onPress={handleClose}>
          <Text style={styles.browseBtnText}>Keep Browsing</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  heartContainer: {
    marginHorizontal: 16,
  },
  heartEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  chatBtn: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  chatBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  browseBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  browseBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
});