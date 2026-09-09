// Cloud Database Integration via Firebase Firestore
// Multi-device real-time sync for bills, purchases, audit logs, closing stock

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getSetting, setSetting } from './storage';

// ── Firebase config keys in settings ─────────────────────────
const CONFIG_KEY = 'firebase_config';
const SYNC_ENABLED_KEY = 'cloud_sync_enabled';

let app = null;
let db = null;
let listeners = {};
let isConnected = false;
let connectionChangeCallbacks = [];

// ── Get / Save Firebase config ───────────────────────────────
export async function getFirebaseConfig() {
  return getSetting(CONFIG_KEY);
}

export async function saveFirebaseConfig(config) {
  await setSetting(CONFIG_KEY, config);
}

export async function isSyncEnabled() {
  const val = await getSetting(SYNC_ENABLED_KEY);
  return val === true || val === 'true';
}

export async function setSyncEnabled(enabled) {
  await setSetting(SYNC_ENABLED_KEY, enabled);
}

// ── Initialize Firebase from stored config ───────────────────
export async function initCloud() {
  const config = await getFirebaseConfig();
  if (!config) return false;

  try {
    if (!app) {
      app = initializeApp(config);
      db = getFirestore(app);
      // Enable offline persistence for local fallback
      try {
        await enableIndexedDbPersistence(db);
      } catch (err) {
        // Persistence may already be enabled or tab conflict
        console.log('Persistence:', err.message);
      }
    }
    return true;
  } catch (err) {
    console.error('Firebase init failed:', err);
    return false;
  }
}

// ── Test connection ──────────────────────────────────────────
export async function testConnection() {
  if (!db) {
    const ok = await initCloud();
    if (!ok) return { ok: false, error: 'No Firebase config found' };
  }
  try {
    // Try to read a test doc
    const testRef = doc(db, '_system', 'ping');
    await setDoc(testRef, { timestamp: serverTimestamp(), test: true });
    return { ok: true, message: 'Connected to Firestore' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── CRUD Operations ──────────────────────────────────────────
// Collection name mapping: IndexedDB store → Firestore collection
const COLLECTION_MAP = {
  bills: 'bills',
  purchases: 'purchases',
  auditLogs: 'audit_logs',
  closingStock: 'closing_stock',
  items: 'menu_items',
};

async function ensureDb() {
  if (!db) {
    const ok = await initCloud();
    if (!ok) throw new Error('Cloud not configured');
  }
  return db;
}

// Save a single document
export async function cloudSave(storeName, id, data) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const docRef = doc(database, colName, String(id));
  await setDoc(docRef, {
    ...data,
    _syncedAt: new Date().toISOString(),
    _deviceId: getDeviceId(),
  });
  return true;
}

// Save multiple documents (batch)
export async function cloudSaveBatch(storeName, items) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  for (const item of items) {
    const docRef = doc(database, colName, String(item.id || item.date || Date.now()));
    await setDoc(docRef, {
      ...item,
      _syncedAt: new Date().toISOString(),
      _deviceId: getDeviceId(),
    });
  }
  return true;
}

// Get a single document
export async function cloudGet(storeName, id) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const docRef = doc(database, colName, String(id));
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

// Get all documents in a collection
export async function cloudGetAll(storeName) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const colRef = collection(database, colName);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Delete a document
export async function cloudDelete(storeName, id) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const docRef = doc(database, colName, String(id));
  await deleteDoc(docRef);
  return true;
}

// ── Real-time listener ───────────────────────────────────────
export function subscribeToCollection(storeName, callback) {
  // Clean up existing listener
  if (listeners[storeName]) {
    listeners[storeName]();
  }

  const database = db;
  if (!database) return () => {};

  const colName = COLLECTION_MAP[storeName] || storeName;
  const colRef = collection(database, colName);
  const q = query(colRef, orderBy('_syncedAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(docs);
    if (!isConnected) {
      isConnected = true;
      connectionChangeCallbacks.forEach((cb) => cb(true));
    }
  }, (err) => {
    console.error(`Subscription error [${storeName}]:`, err);
    if (isConnected) {
      isConnected = false;
      connectionChangeCallbacks.forEach((cb) => cb(false));
    }
  });

  listeners[storeName] = unsubscribe;
  return unsubscribe;
}

// Unsubscribe from all listeners
export function unsubscribeAll() {
  Object.values(listeners).forEach((unsub) => {
    if (typeof unsub === 'function') unsub();
  });
  listeners = {};
}

// ── Connection status ────────────────────────────────────────
export function isCloudConnected() {
  return isConnected;
}

export function onConnectionChange(callback) {
  connectionChangeCallbacks.push(callback);
  return () => {
    connectionChangeCallbacks = connectionChangeCallbacks.filter((cb) => cb !== callback);
  };
}

// ── Full sync: push all local data to cloud ──────────────────
export async function fullSyncToCloud(stores) {
  const results = {};
  for (const storeName of stores) {
    try {
      const { getAll } = await import('./storage');
      const items = await getAll(storeName);
      if (items.length > 0) {
        await cloudSaveBatch(storeName, items);
      }
      results[storeName] = { ok: true, count: items.length };
    } catch (err) {
      results[storeName] = { ok: false, error: err.message };
    }
  }
  return results;
}

// ── Pull cloud data into local IndexedDB ─────────────────────
export async function pullFromCloud(stores) {
  const results = {};
  for (const storeName of stores) {
    try {
      const items = await cloudGetAll(storeName);
      const { setItem } = await import('./storage');
      for (const item of items) {
        const id = item.id || item.date || Date.now().toString(36);
        await setItem(storeName, id, item);
      }
      results[storeName] = { ok: true, count: items.length };
    } catch (err) {
      results[storeName] = { ok: false, error: err.message };
    }
  }
  return results;
}

// ── Device ID (for tracking which device made changes) ────────
export function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('device_id', id);
  }
  return id;
}

export function getDeviceName() {
  return localStorage.getItem('device_name') || 'Desktop';
}

export function setDeviceName(name) {
  localStorage.setItem('device_name', name);
}
