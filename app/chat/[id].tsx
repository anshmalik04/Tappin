import { Colors } from '@/constants/Colors';
import { getMessages, getProfile, sendMessage as sendMessageApi } from '@/services/api';
import { subscribeToChat } from '@/services/realtime';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// services/api.js is untyped JS; `meetupSpot = null` makes TS infer the param
// as `null`, so passing a string fails. Narrow it here at the boundary.
const sendMessageTyped = sendMessageApi as (
  matchId: string,
  content: string,
  meetupSpot?: string | null
) => Promise<any>;

const MEETUP_SPOTS = [
  'DJ Set Area',
  'Main Bar',
  'Back Bar',
  'Upstairs Lounge',
  'Near Bathrooms',
  'Front Entrance',
  'Stairs / Stairwell',
  'Patio',
];

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  meetup_spot: string | null;
  created_at: string;
}

export default function ChatScreen() {
  const { id, otherUserName, venueName } = useLocalSearchParams<{
    id: string;
    otherUserName?: string;
    venueName?: string;
  }>();
  const insets = useSafeAreaInsets();

  const matchId = Array.isArray(id) ? id[0] : id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [meetupSpot, setMeetupSpot] = useState<string | null>(null);
  const [contactsNotified, setContactsNotified] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingSpot, setPendingSpot] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Appends only if we haven't already got this message id. The sender gets
  // their own message twice — once from the POST response, once echoed over
  // the socket — so every append path goes through here.
  const appendMessage = useCallback((incoming: Message) => {
    if (!incoming?.id) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
    if (incoming.meetup_spot) setMeetupSpot(incoming.meetup_spot);
  }, []);

  useEffect(() => {
    if (!matchId) return;

    Promise.all([getMessages(matchId), getProfile()])
      .then(([messagesData, profileData]: [any, any]) => {
        const msgs: Message[] = messagesData?.messages || [];
        setMessages(msgs);
        setMyUserId(profileData?.user?.id || null);

        const lastWithSpot = [...msgs].reverse().find((m: Message) => m.meetup_spot);
        if (lastWithSpot) setMeetupSpot(lastWithSpot.meetup_spot);
      })
      .catch((e: any) => console.error('Failed to load chat:', e))
      .finally(() => setLoading(false));
  }, [matchId]);

  // Real-time messages. Payload shape isn't pinned down yet, so accept either
  // the message directly or wrapped under `message`.
  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = subscribeToChat((payload: any) => {
      const incoming: Message = payload?.message ?? payload;
      if (!incoming || String(incoming.match_id) !== String(matchId)) return;
      appendMessage(incoming);
    });
    return unsubscribe;
  }, [matchId, appendMessage]);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleSend = async (spotOverride?: string) => {
    const text = inputText.trim();
    if (!text && !spotOverride) return;
    if (!matchId) return;

    setSending(true);
    try {
      const result = await sendMessageTyped(
        matchId,
        text || `📍 Meeting at ${spotOverride}`,
        spotOverride ?? null
      );
      const newMessage = result?.data ?? result?.message;
      if (newMessage) appendMessage(newMessage);
      setInputText('');
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  // Tapping a spot opens the confirmation modal (does NOT auto-share).
  const selectMeetupSpot = (spot: string) => {
    setDropdownOpen(false);
    setPendingSpot(spot);
  };

  // User-triggered choice, per Safety & Privacy doc. Picking a spot always shares
  // it with your match; `share` decides whether to ALSO alert emergency contacts.
  const confirmShare = (share: boolean) => {
    const spot = pendingSpot;
    setPendingSpot(null);
    if (!spot) return;
    setMeetupSpot(spot);
    if (share) {
      setContactsNotified(true);
      // TODO(backend): once a notify endpoint + Twilio compliance profile are
      // live, alert the user's emergency contacts here, e.g.:
      //   await notifyEmergencyContacts(matchId, spot);
    } else {
      setContactsNotified(false);
    }
    handleSend(spot);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{(otherUserName || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUserName || 'Match'}</Text>
          {venueName && (
            <View style={styles.atVenueRow}>
              <View style={styles.greenDot} />
              <Text style={styles.atVenue}>Matched at {venueName}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.safetyBtn}>
          <Text style={styles.safetyBtnText}>🛡 Safety</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 8,
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View>
            {/* Meetup spot card */}
            <View style={styles.meetupCard}>
              <Text style={styles.meetupTitle}>📍 MEET UP SPOT</Text>
              <TouchableOpacity
                style={styles.meetupDropdown}
                onPress={() => setDropdownOpen(true)}
              >
                <Text style={styles.meetupDropdownText}>{meetupSpot || 'Choose a spot'}</Text>
                <Text style={styles.dropdownArrow}>▾</Text>
              </TouchableOpacity>
              <Text style={styles.meetupNote}>
                {contactsNotified
                  ? 'Shared with your emergency contacts'
                  : 'You choose whether to share this with your emergency contacts'}
              </Text>
            </View>

            {/* Safety banner - only shows once the user has chosen to share the meetup */}
            {contactsNotified && meetupSpot && (
              <View style={styles.safetyBanner}>
                <Text style={styles.safetyBannerTitle}>✓ Emergency contacts notified of meetup</Text>
                <Text style={styles.safetyBannerSub}>
                  Meeting at {meetupSpot}{venueName ? ` · ${venueName}` : ''}
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Say hi to start the conversation.</Text>
        }
        renderItem={({ item }) => {
          const isMe = myUserId !== null && item.sender_id === myUserId;
          return (
            <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
            </View>
          );
        }}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity style={styles.locationPinBtn} onPress={() => setDropdownOpen(true)}>
          <Text style={styles.locationPin}>📍</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()} disabled={sending}>
          {sending ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.sendBtnText}>↑</Text>}
        </TouchableOpacity>
      </View>

      {/* Dropdown modal */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownMenuTitle}>Choose Meetup Spot</Text>
            {MEETUP_SPOTS.map((spot) => (
              <TouchableOpacity
                key={spot}
                style={[styles.dropdownItem, meetupSpot === spot && styles.dropdownItemActive]}
                onPress={() => selectMeetupSpot(spot)}
              >
                <Text
                  style={[styles.dropdownItemText, meetupSpot === spot && styles.dropdownItemTextActive]}
                >
                  {spot}
                </Text>
                {meetupSpot === spot && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Share-with-emergency-contacts confirmation modal */}
      <Modal
        visible={pendingSpot !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingSpot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Share this meetup?</Text>
            <Text style={styles.confirmBody}>
              Let your emergency contacts know you&apos;re meeting at {pendingSpot}
              {venueName ? ` · ${venueName}` : ''}?
            </Text>
            <TouchableOpacity style={styles.confirmShareBtn} onPress={() => confirmShare(true)}>
              <Text style={styles.confirmShareBtnText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => confirmShare(false)}>
              <Text style={styles.confirmCancelBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 22, color: Colors.textPrimary },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  atVenueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  greenDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  atVenue: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  safetyBtn: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  safetyBtnText: { fontSize: 12, fontWeight: '700', color: Colors.danger },
  messageList: { flex: 1 },
  meetupCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  meetupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  meetupDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  meetupDropdownText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  dropdownArrow: { fontSize: 14, color: Colors.textMuted },
  meetupNote: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  safetyBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  safetyBannerTitle: { fontSize: 13, fontWeight: '700', color: Colors.success },
  safetyBannerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 40 },
  messageRow: { marginBottom: 12, alignItems: 'flex-start' },
  messageRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleThem: {
    backgroundColor: Colors.white,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
  },
  bubbleText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: Colors.white },
  timestamp: { fontSize: 11, color: Colors.textMuted, marginTop: 4, marginHorizontal: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  locationPinBtn: { padding: 6 },
  locationPin: { fontSize: 20 },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownMenuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  dropdownItemActive: { backgroundColor: Colors.primaryLight },
  dropdownItemText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  dropdownItemTextActive: { color: Colors.primary, fontWeight: '700' },
  checkmark: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  confirmCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 22,
    width: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  confirmShareBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmShareBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  confirmCancelBtn: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmCancelBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
});
