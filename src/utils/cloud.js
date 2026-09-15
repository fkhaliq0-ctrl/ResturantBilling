// Cloud Database Integration via Firebase Firestore (Hardcoded Config for Zero-Dependency Production)
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, onSnapshot, query, orderBy, serverTimestamp,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getSetting, setSetting } from './storage';

// ── Hardcoded Firebase Configuration ─────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCiUYtEYSDFwbed5t6NRbu_GtLs4h9WpaM",
  authDomain: "mehfil-e-nihari-pos.firebaseapp.com",
  projectId: "mehfil-e-nihari-pos",
  storageBucket: "mehfil-e-nihari-pos.firebasestorage.app",
  messagingSenderId: "537736992775",
  appId: "1:537736992775:web:7b01b33a20df0aa3e232a2",
  measurementId: "G-HE3YF55PH2"
};

const SYNC_ENABLED_KEY = 'cloud_sync_enabled';

let app = null;
let db = null;
let listeners = {};
let isConnected = false;
let connectionChangeCallbacks = [];

export async function getFirebaseConfig() {
  return firebaseConfig;
}

export async function saveFirebaseConfig(config) {
  // no-op since it's hardcoded
}

export async function isSyncEnabled() {
  return true; // Force-enabled for zero local IP setup
}

export async function setSyncEnabled(enabled) {
  await setSetting(SYNC_ENABLED_KEY, enabled);
}

// ── Initialize Firebase ──────────────────────────────────────
export async function initCloud() {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      try {
        await enableIndexedDbPersistence(db);
      } catch (err) {
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
    if (!ok) return { ok: false, error: 'Firebase initialization failed' };
  }
  try {
    const testRef = doc(db, '_system', 'ping');
    await setDoc(testRef, { timestamp: serverTimestamp(), test: true });
    return { ok: true, message: 'Connected to Firestore' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── CRUD Operations ──────────────────────────────────────────
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
    if (!ok) throw new Error('Cloud not initialized');
  }
  return db;
}

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

export async function cloudGet(storeName, id) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const docRef = doc(database, colName, String(id));
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
}

export async function cloudGetAll(storeName) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const colRef = collection(database, colName);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function cloudDelete(storeName, id) {
  const database = await ensureDb();
  const colName = COLLECTION_MAP[storeName] || storeName;
  const docRef = doc(database, colName, String(id));
  await deleteDoc(docRef);
  return true;
}

// ── Real-time listener ───────────────────────────────────────
export function subscribeToCollection(storeName, callback) {
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

export function unsubscribeAll() {
  Object.values(listeners).forEach((unsub) => {
    if (typeof unsub === 'function') unsub();
  });
  listeners = {};
}

export function isCloudConnected() {
  return isConnected;
}

export function onConnectionChange(callback) {
  connectionChangeCallbacks.push(callback);
  return () => {
    connectionChangeCallbacks = connectionChangeCallbacks.filter((cb) => cb !== callback);
  };
}

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