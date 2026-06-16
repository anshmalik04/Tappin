import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAuthSession } from 'aws-amplify/auth';

const WS_URL = 'wss://lfcdr0kcn9.execute-api.us-east-1.amazonaws.com/production';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  let token;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString();
  } catch (err) {
    console.log('[DEBUG] fetchAuthSession error:', err?.message || err);
    token = null;
  }

  const staticToken = await AsyncStorage.getItem('tappin_jwt');
  console.log('[DEBUG] fetchAuthSession token:', token ? `present (${token.length} chars)` : 'none/undefined');
  console.log('[DEBUG] AsyncStorage tappin_jwt:', staticToken ? `present (${staticToken.length} chars)` : 'none/empty');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function getProfile() {
  return apiFetch('/profile');
}

export async function updateProfile(updates) {
  return apiFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function uploadPhoto(orderIndex, isPrimary, contentType) {
  return apiFetch('/profile/photo', {
    method: 'POST',
    body: JSON.stringify({ order_index: orderIndex, is_primary: isPrimary, content_type: contentType }),
  });
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export async function getVenues(lat, lng, radiusMeters = 5000) {
  return apiFetch(`/venues?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
}

export async function getVenueById(venueId) {
  return apiFetch(`/venues/${venueId}`);
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

export async function getHeatmapData(lat, lng, radiusMeters = 5000) {
  return apiFetch(`/heatmap?lat=${lat}&lng=${lng}&radius=${radiusMeters}`);
}

// ─── Check-ins ────────────────────────────────────────────────────────────────

export async function createCheckIn(venueId, lat, lng) {
  return apiFetch('/check-ins', {
    method: 'POST',
    body: JSON.stringify({ venue_id: venueId, lat, lng }),
  });
}

export async function cancelCheckIn(checkInId) {
  return apiFetch(`/check-ins/${checkInId}`, {
    method: 'DELETE',
  });
}

export async function getActiveCheckIns() {
  return apiFetch('/check-ins/active');
}

// ─── People at Venue ──────────────────────────────────────────────────────────

export async function getPeopleAtVenue(venueId) {
  return apiFetch(`/venues/${venueId}/people`);
}

// ─── Tap In / Matching ────────────────────────────────────────────────────────

export async function createTapIn(receiverId, venueId) {
  return apiFetch('/taps', {
    method: 'POST',
    body: JSON.stringify({ receiver_id: receiverId, venue_id: venueId }),
  });
}

export async function getMatches() {
  return apiFetch('/matches');
}

export async function getTapInInbox() {
  return apiFetch('/taps/inbox');
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getMessages(matchId) {
  return apiFetch(`/matches/${matchId}/messages`);
}

export async function sendMessage(matchId, content, meetupSpot = null) {
  return apiFetch(`/matches/${matchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, meetup_spot: meetupSpot }),
  });
}

// ─── Emergency Contacts ───────────────────────────────────────────────────────

export async function getEmergencyContacts() {
  return apiFetch('/emergency-contacts');
}

export async function createEmergencyContact(name, phone) {
  return apiFetch('/emergency-contacts', {
    method: 'POST',
    body: JSON.stringify({ name, phone_number: phone }),
  });
}

export async function deleteEmergencyContact(contactId) {
  return apiFetch(`/emergency-contacts/${contactId}`, {
    method: 'DELETE',
  });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

let ws = null;
let heatmapCallback = null;
let chatCallback = null;
let reconnectTimer = null;

export function connectWebSocket(onHeatmapUpdate, onChatMessage) {
  heatmapCallback = onHeatmapUpdate;
  chatCallback = onChatMessage;

  const connect = async () => {
    let token;
    try {
      const session = await fetchAuthSession();
      token = session.tokens?.idToken?.toString();
    } catch {
      token = null;
    }
    ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'heatmap_update' && heatmapCallback) {
          heatmapCallback(data.payload);
        }
        if (data.type === 'chat_message' && chatCallback) {
          chatCallback(data.payload);
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected — reconnecting in 5s');
      reconnectTimer = setTimeout(connect, 5000);
    };
  };

  connect();
}

export function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}