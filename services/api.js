// @ts-nocheck
import { API_BASE_URL } from '@/constants/config';
import { fetchAuthSession } from 'aws-amplify/auth';

const WS_URL = 'wss://lfcdr0kcn9.execute-api.us-east-1.amazonaws.com/production';

async function apiFetch(path, options = {}) {
  let token;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString();
  } catch (err) {
    token = null;
  }
  const makeRequest = async (authToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  };
  let response = await makeRequest(token);
  if (response.status === 401) {
    try {
      const refreshedSession = await fetchAuthSession({ forceRefresh: true });
      const refreshedToken = refreshedSession.tokens?.idToken?.toString();
      if (refreshedToken) response = await makeRequest(refreshedToken);
    } catch {}
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function getProfile() { return apiFetch('/profile'); }
export async function updateProfile(u) { return apiFetch('/profile', { method: 'PUT', body: JSON.stringify(u) }); }
export async function uploadPhoto(o, p, c) { return apiFetch('/photos/upload', { method: 'POST', body: JSON.stringify({ order_index: o, is_primary: p, content_type: c }) }); }
export async function registerUser(phone, name, birthdate) { const f = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`; return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ phone_number: f, name, birthdate }) }); }
export async function getVenueById(id) { return apiFetch(`/venues/${id}`); }
export async function getHeatmapData(lat, lng, r = 5000) { return apiFetch(`/heatmap?lat=${lat}&lng=${lng}&radius=${r}`); }
export async function createCheckIn(venueId, lat, lng) { return apiFetch('/check-in', { method: 'POST', body: JSON.stringify({ venue_id: venueId, lat, lng }) }); }
export async function cancelCheckIn(id) { return apiFetch(`/check-in/${id}`, { method: 'DELETE' }); }
export async function getPeopleAtVenue(venueId) { return apiFetch(`/venues/${venueId}/people`); }
export async function createTapIn(receiverId, venueId) { return apiFetch('/tap-in', { method: 'POST', body: JSON.stringify({ receiver_id: receiverId, venue_id: venueId }) }); }
export async function getMatches() { return apiFetch('/matches'); }
export async function getMessages(matchId) { return apiFetch(`/messages/${matchId}`); }
export async function sendMessage(matchId, content, meetupSpot = null) { return apiFetch('/messages', { method: 'POST', body: JSON.stringify({ match_id: matchId, content, meetup_spot: meetupSpot }) }); }
export async function getEmergencyContacts() { return apiFetch('/emergency-contacts'); }
export async function createEmergencyContact(name, phone) { return apiFetch('/emergency-contacts', { method: 'POST', body: JSON.stringify({ name, phone_number: phone }) }); }
export async function deleteEmergencyContact(id) { return apiFetch(`/emergency-contacts/${id}`, { method: 'DELETE' }); }

let ws = null, heatmapCallback = null, chatCallback = null, reconnectTimer = null;

export function connectWebSocket(onHeatmapUpdate, onChatMessage) {
  heatmapCallback = onHeatmapUpdate;
  chatCallback = onChatMessage;
  const connect = async () => {
    let token;
    try { const s = await fetchAuthSession(); token = s.tokens?.idToken?.toString(); } catch { token = null; }
    ws = new WebSocket(WS_URL);
    ws.onopen = () => { if (reconnectTimer) clearTimeout(reconnectTimer); };
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'heatmap_update' && heatmapCallback) heatmapCallback(d.payload);
        if (d.type === 'chat_message' && chatCallback) chatCallback(d.payload);
      } catch(err) { console.error('WS parse error:', err); }
    };
    ws.onerror = (err) => console.error('WebSocket error:', err);
    ws.onclose = () => { reconnectTimer = setTimeout(connect, 60000); };
  };
  connect();
}

export function disconnectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) { ws.close(); ws = null; }
}
