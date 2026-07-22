// Shared WebSocket fan-out.
//
// services/api.js keeps ONE socket and ONE callback slot per message type at
// module scope. If two screens each call connectWebSocket(), the second call
// overwrites the first screen's callbacks and orphans its socket. Every screen
// subscribes through here instead, and this module calls connectWebSocket once.
//
// Person 2: use subscribeToHeatmap for the map. Do not call connectWebSocket
// directly or you will silently kill chat.

import { connectWebSocket, disconnectWebSocket } from '@/services/api';

type Listener = (payload: any) => void;

const chatListeners = new Set<Listener>();
const heatmapListeners = new Set<Listener>();
let started = false;

const fanOut = (listeners: Set<Listener>, payload: any) => {
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.log('Realtime listener threw:', err);
    }
  });
};

function ensureStarted() {
  if (started) return;
  started = true;
  connectWebSocket(
    (payload: any) => fanOut(heatmapListeners, payload),
    (payload: any) => fanOut(chatListeners, payload)
  );
}

export function subscribeToChat(fn: Listener): () => void {
  ensureStarted();
  chatListeners.add(fn);
  return () => {
    chatListeners.delete(fn);
  };
}

export function subscribeToHeatmap(fn: Listener): () => void {
  ensureStarted();
  heatmapListeners.add(fn);
  return () => {
    heatmapListeners.delete(fn);
  };
}

// The socket stays open for the app's lifetime — screens mount and unmount
// constantly and reconnecting each time would thrash. Call this on logout only.
export function shutdownRealtime() {
  chatListeners.clear();
  heatmapListeners.clear();
  started = false;
  disconnectWebSocket();
}
