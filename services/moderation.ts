// Block + report state.
//
// Ansh's createBlock / createReport Lambda endpoints do not exist yet
// (Sprint B Week 1, Person 1). This module calls them if present and
// otherwise keeps blocks locally, so the UI is testable now and starts
// syncing the moment he ships. Local state is the source of truth for
// filtering either way, so a block always takes effect immediately.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tappin:blocked_user_ids';

export type ReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'harassment'
  | 'underage'
  | 'spam'
  | 'other';

export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'inappropriate_photos', label: 'Inappropriate photos' },
  { key: 'harassment', label: 'Harassment' },
  { key: 'underage', label: 'Underage' },
  { key: 'spam', label: 'Spam' },
  { key: 'other', label: 'Other' },
];

type Listener = (ids: string[]) => void;

let blockedIds = new Set<string>();
let hydrated = false;
const listeners = new Set<Listener>();

// Untyped require so a missing export in api.js is not a compile error.
const api: any = require('@/services/api');

const notify = () => {
  const ids = Array.from(blockedIds);
  listeners.forEach((fn) => {
    try {
      fn(ids);
    } catch (err) {
      console.log('Block listener threw:', err);
    }
  });
};

const persist = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(blockedIds)));
  } catch (err) {
    console.log('Could not persist blocks:', err);
  }
};

export async function hydrateBlocks(): Promise<string[]> {
  if (hydrated) return Array.from(blockedIds);
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blockedIds = new Set(parsed.map(String));
    }
  } catch (err) {
    console.log('Could not read blocks:', err);
  }
  hydrated = true;
  notify();
  return Array.from(blockedIds);
}

export function isBlocked(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return blockedIds.has(String(userId));
}

export function getBlockedIds(): string[] {
  return Array.from(blockedIds);
}

// Fires immediately with current state, then on every change.
export function subscribeToBlocks(fn: Listener): () => void {
  listeners.add(fn);
  fn(Array.from(blockedIds));
  if (!hydrated) hydrateBlocks();
  return () => {
    listeners.delete(fn);
  };
}

// Silent by design — the blocked user is never notified (Safety doc §3).
export async function blockUser(userId: string): Promise<void> {
  if (!userId) return;
  blockedIds.add(String(userId));
  notify();
  await persist();
  try {
    if (typeof api.createBlock === 'function') await api.createBlock(userId);
  } catch (err) {
    console.log('createBlock failed, block held locally:', err);
  }
}

export async function unblockUser(userId: string): Promise<void> {
  if (!userId) return;
  blockedIds.delete(String(userId));
  notify();
  await persist();
  try {
    if (typeof api.deleteBlock === 'function') await api.deleteBlock(userId);
  } catch (err) {
    console.log('deleteBlock failed:', err);
  }
}

// Returns false if the report could not reach the backend, so the caller
// can be honest with the user instead of showing a fake confirmation.
export async function reportUser(
  userId: string,
  reason: ReportReason,
  details = ''
): Promise<boolean> {
  try {
    if (typeof api.createReport === 'function') {
      await api.createReport(userId, reason, details);
      return true;
    }
    console.log('createReport endpoint not available yet:', { userId, reason, details });
    return false;
  } catch (err) {
    console.log('createReport failed:', err);
    return false;
  }
}
