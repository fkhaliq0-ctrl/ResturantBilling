// ── Multi-Outlet Real-Time Sync Engine ───────────────────
// Provides real-time sync of bills, menu items, and customer data
// across desktop and mobile clients via polling + localStorage events

const SYNC_KEY = 'mehfil_sync_channel';
const SYNC_INTERVAL_MS = 5000; // 5 seconds
let syncTimer = null;

// Broadcast channel for same-origin tabs (cross-tab sync)
let broadcastChannel = null;
try {
  broadcastChannel = new BroadcastChannel('mehfil_pos_sync');
} catch (e) {
  // BroadcastChannel not supported — fallback to localStorage events
}

// ── Initialize Sync ─────────────────────────────────────
export function initSync() {
  return new Promise((resolve) => {
    // Listen for storage changes (cross-tab real-time sync)
    window.addEventListener('storage', handleStorageEvent);

    // Listen for BroadcastChannel messages
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_UPDATE') {
          console.log('[Sync] Received update:', event.data.store);
          window.dispatchEvent(new CustomEvent('mehfil_sync', { detail: event.data }));
        }
      };
    }

    // Start periodic sync check
    startSyncPolling();
    console.log('[Sync] Multi-outlet sync initialized');
    resolve(true);
  });
}

// ── Broadcast update to other tabs/devices ──────────────
export function broadcastUpdate(storeName, data) {
  const payload = { type: 'SYNC_UPDATE', store: storeName, data, timestamp: Date.now() };

  // BroadcastChannel (same-origin tabs)
  if (broadcastChannel) {
    try { broadcastChannel.postMessage(payload); } catch (e) { /* ignore */ }
  }

  // localStorage event (cross-tab fallback)
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(payload));
  } catch (e) { /* ignore */ }
}

// ── Handle incoming storage events ──────────────────────
function handleStorageEvent(event) {
  if (event.key === SYNC_KEY && event.newValue) {
    try {
      const payload = JSON.parse(event.newValue);
      if (payload.type === 'SYNC_UPDATE') {
        console.log('[Sync] Cross-tab update received:', payload.store);
        window.dispatchEvent(new CustomEvent('mehfil_sync', { detail: payload }));
      }
    } catch (e) { /* ignore */ }
  }
}

// ── Periodic sync polling (for cloud/backend) ───────────
function startSyncPolling() {
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    // Check for pending offline orders and sync when online
    if (navigator.onLine) {
      flushOfflineQueue();
    }
  }, SYNC_INTERVAL_MS);
}

// ── Offline Queue (outbox pattern) ──────────────────────
export function addToOutbox(order) {
  const queue = JSON.parse(localStorage.getItem('mehfil_outbox') || '[]');
  queue.push({ ...order, queuedAt: Date.now(), status: 'pending' });
  localStorage.setItem('mehfil_outbox', JSON.stringify(queue));
}

export async function flushOfflineQueue() {
  const queue = JSON.parse(localStorage.getItem('mehfil_outbox') || '[]');
  if (queue.length === 0) return;

  const backendUrl = localStorage.getItem('mehfil_backend_url') || 'https://mehfil-pos-backend.onrender.com';
  const remaining = [];

  for (const item of queue) {
    if (item.status === 'sent') continue;
    try {
      const resp = await fetch(backendUrl + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (resp.ok) {
        console.log('[Sync] Outbox order sent:', item.id);
        broadcastUpdate('bills', item);
      } else {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  localStorage.setItem('mehfil_outbox', JSON.stringify(remaining));
}

// ── Sync status ─────────────────────────────────────────
export function getSyncStatus() {
  const outbox = JSON.parse(localStorage.getItem('mehfil_outbox') || '[]');
  return {
    pending: outbox.length,
    lastSync: localStorage.getItem('mehfil_last_sync') || null,
    online: navigator.onLine,
    backendUrl: localStorage.getItem('mehfil_backend_url') || 'https://mehfil-pos-backend.onrender.com',
  };
}

// ── Full sync all stores ────────────────────────────────
export async function fullSyncAll() {
  const stores = ['bills', 'items', 'customers', 'staff', 'inventory', 'vendors', 'expenses'];
  for (const store of stores) {
    const data = JSON.parse(localStorage.getItem(store) || '[]');
    if (data.length > 0) broadcastUpdate(store, data);
  }
  localStorage.setItem('mehfil_last_sync', new Date().toISOString());
  return true;
}

// ── Full pull from backend ──────────────────────────────
export async function fullPullAll() {
  const backendUrl = localStorage.getItem('mehfil_backend_url') || 'https://mehfil-pos-backend.onrender.com';
  const stores = ['bills', 'items', 'customers'];
  for (const store of stores) {
    try {
      const resp = await fetch(backendUrl + '/api/' + store);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const existing = JSON.parse(localStorage.getItem(store) || '[]');
          const merged = [...data, ...existing.filter(e => !data.find(d => d.id === e.id))];
          localStorage.setItem(store, JSON.stringify(merged));
        }
      }
    } catch (e) { console.log('[Sync] Pull failed for', store, e.message); }
  }
  return true;
}

// ── Sync change listener ────────────────────────────────
export function onSyncChange(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener('mehfil_sync', handler);
  return () => window.removeEventListener('mehfil_sync', handler);
}

// ── Setup cloud sync with backend URL ───────────────────
export function setupCloudSync(backendUrl) {
  localStorage.setItem('mehfil_backend_url', backendUrl);
  console.log('[Sync] Cloud backend configured:', backendUrl);
  return true;
}

// ── Cleanup ─────────────────────────────────────────────
export function stopSync() {
  if (syncTimer) clearInterval(syncTimer);
  window.removeEventListener('storage', handleStorageEvent);
  if (broadcastChannel) broadcastChannel.close();
}
