// Multi-Device Real-Time Sync Engine
// Pushes local changes to cloud, receives cloud changes in real-time
// Falls back to local IndexedDB when cloud is unavailable

import {
  initCloud, cloudSave, cloudDelete, cloudGetAll,
  isCloudConnected, onConnectionChange,
  subscribeToCollection, getDeviceId, getDeviceName,
  isSyncEnabled, saveFirebaseConfig, setSyncEnabled,
} from './cloud';
import { getAll, setItem, getItem, deleteItem } from './storage';

// ── Sync state ───────────────────────────────────────────────
let syncActive = false;
let syncQueue = []; // pending local changes
let syncCallbacks = [];
let lastSyncTime = null;

// ── Collection names to sync ─────────────────────────────────
const SYNC_STORES = ['bills', 'purchases', 'auditLogs', 'closingStock', 'menu_items'];
const COLLECTION_MAP = {
  bills: 'bills',
  purchases: 'purchases',
  auditLogs: 'audit_logs',
  closingStock: 'closing_stock',
  items: 'menu_items',
};

// ── Initialize sync engine ───────────────────────────────────
export async function initSync() {
  const enabled = await isSyncEnabled();
  if (!enabled) return false;

  const ok = await initCloud();
  if (!ok) return false;

  syncActive = true;

  // Listen for cloud changes on all collections
  for (const storeName of SYNC_STORES) {
    subscribeToCollection(storeName, (cloudDocs) => {
      handleCloudUpdate(storeName, cloudDocs);
    });
  }

  // Process any queued offline changes
  processSyncQueue();

  return true;
}

// ── Push local change to cloud ───────────────────────────────
export async function pushToCloud(storeName, data, action = 'save') {
  if (!syncActive || !isCloudConnected()) {
    // Queue for later
    syncQueue.push({ storeName, data, action, timestamp: Date.now() });
    notifyCallbacks();
    return false;
  }

  try {
    if (action === 'save') {
      const id = data.id || data.date || Date.now().toString(36);
      await cloudSave(storeName, id, { ...data, _deviceId: getDeviceId(), _deviceName: getDeviceName() });
    } else if (action === 'delete') {
      await cloudDelete(storeName, data.id);
    }
    lastSyncTime = new Date().toISOString();
    notifyCallbacks();
    return true;
  } catch (err) {
    // Queue for retry
    syncQueue.push({ storeName, data, action, timestamp: Date.now() });
    notifyCallbacks();
    return false;
  }
}

// ── Handle incoming cloud update ─────────────────────────────
function handleCloudUpdate(storeName, cloudDocs) {
  // Only update local if the change came from another device
  const deviceId = getDeviceId();

  cloudDocs.forEach((cloudDoc) => {
    if (cloudDoc._deviceId === deviceId) return; // Skip our own changes

    // Write to local IndexedDB
    const id = cloudDoc.id || cloudDoc.date;
    if (id) {
      setItem(storeName, id, cloudDoc).catch(() => {});
    }
  });

  lastSyncTime = new Date().toISOString();
  notifyCallbacks();
}

// ── Process queued offline changes ───────────────────────────
async function processSyncQueue() {
  if (syncQueue.length === 0) return;
  if (!isCloudConnected()) return;

  const queue = [...syncQueue];
  syncQueue = [];

  for (const entry of queue) {
    try {
      if (entry.action === 'save') {
        await cloudSave(entry.storeName, entry.data.id || entry.data.date, entry.data);
      } else if (entry.action === 'delete') {
        await cloudDelete(entry.storeName, entry.data.id);
      }
    } catch {
      // Re-queue failed items
      syncQueue.push(entry);
    }
  }
  notifyCallbacks();
}

// ── Full sync: push all local data ───────────────────────────
export async function fullSyncAll() {
  const results = {};
  for (const storeName of SYNC_STORES) {
    try {
      const items = await getAll(storeName === 'menu_items' ? 'items' : storeName);
      for (const item of items) {
        await pushToCloud(storeName, item, 'save');
      }
      results[storeName] = { ok: true, count: items.length };
    } catch (err) {
      results[storeName] = { ok: false, error: err.message };
    }
  }
  lastSyncTime = new Date().toISOString();
  notifyCallbacks();
  return results;
}

// ── Full pull: get all cloud data into local ─────────────────
export async function fullPullAll() {
  const results = {};
  for (const storeName of SYNC_STORES) {
    try {
      const cloudDocs = await cloudGetAll(storeName);
      const localStore = Object.entries(COLLECTION_MAP).find(([, v]) => v === storeName)?.[0] || storeName;
      for (const doc of cloudDocs) {
        const id = doc.id || doc.date;
        if (id) {
          await setItem(localStore, id, doc);
        }
      }
      results[storeName] = { ok: true, count: cloudDocs.length };
    } catch (err) {
      results[storeName] = { ok: false, error: err.message };
    }
  }
  lastSyncTime = new Date().toISOString();
  notifyCallbacks();
  return results;
}

// ── Sync status ──────────────────────────────────────────────
export function getSyncStatus() {
  return {
    active: syncActive,
    connected: isCloudConnected(),
    queueLength: syncQueue.length,
    lastSyncTime,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  };
}

// ── Subscribe to sync status changes ─────────────────────────
export function onSyncChange(callback) {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter((cb) => cb !== callback);
  };
}

function notifyCallbacks() {
  const status = getSyncStatus();
  syncCallbacks.forEach((cb) => cb(status));
}

// ── Stop sync ────────────────────────────────────────────────
export function stopSync() {
  syncActive = false;
  // unsubscribeAll will be called via the cloud module
  syncQueue = [];
  notifyCallbacks();
}

// ── Setup: save config + enable + init ───────────────────────
export async function setupCloudSync(config, deviceName) {
  await saveFirebaseConfig(config);
  if (deviceName) {
    const { setDeviceName } = await import('./cloud');
    setDeviceName(deviceName);
  }
  await setSyncEnabled(true);
  return initSync();
}
