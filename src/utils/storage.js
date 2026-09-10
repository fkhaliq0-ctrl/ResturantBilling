// Offline-first storage using IndexedDB (via simple wrapper) + localStorage fallback

const DB_NAME = 'RestaurantBillingDB';
const DB_VERSION = 8;
const STORES = {
  settings: 'settings',
  bills: 'bills',
  dailyLogs: 'dailyLogs',
  items: 'items',
};

let dbInstance = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings);
      }
      if (!db.objectStoreNames.contains(STORES.bills)) {
        const billStore = db.createObjectStore(STORES.bills, { keyPath: 'id', autoIncrement: true });
        billStore.createIndex('date', 'date');
        billStore.createIndex('paymentMethod', 'paymentMethod');
      }
      if (!db.objectStoreNames.contains(STORES.dailyLogs)) {
        db.createObjectStore(STORES.dailyLogs, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORES.items)) {
        db.createObjectStore(STORES.items, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('auditLogs')) {
        db.createObjectStore('auditLogs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('closingStock')) {
        db.createObjectStore('closingStock', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('dailyClosing')) {
        db.createObjectStore('dailyClosing', { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getStore(storeName, mode = 'readonly') {
  const db = await openDB();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// Generic get/set helpers
export async function getItem(storeName, key) {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function setItem(storeName, key, value) {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(value, key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteItem(storeName, key) {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get all items in a store
export async function getAll(storeName) {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Settings helpers
export async function getSetting(key) {
  try {
    return await getItem(STORES.settings, key);
  } catch {
    // Fallback to localStorage
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  }
}

export async function setSetting(key, value) {
  try {
    await setItem(STORES.settings, key, value);
  } catch {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Bills
export async function saveBill(bill) {
  const store = await getStore(STORES.bills, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.add(bill);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function updateBill(bill) {
  const store = await getStore(STORES.bills, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(bill);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getBillById(id) {
  const store = await getStore(STORES.bills);
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getStoredBills() {
  return getAll(STORES.bills);
}

export async function getStoredOrders() {
  return getAll('orders');
}

export async function getTodayBills() {
  const allBills = await getAll(STORES.bills);
  const today = new Date().toISOString().split('T')[0];
  return allBills.filter((b) => b.date === today);
}

export async function getAllBills() {
  return getAll(STORES.bills);
}

// Items CRUD
export async function saveMenuItems(items) {
  const store = await getStore(STORES.items, 'readwrite');
  return new Promise((resolve, reject) => {
    const tx = store.transaction;
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMenuItems() {
  return getAll(STORES.items);
}

// Clear all data
export async function clearAllData() {
  const db = await openDB();
  const storeNames = Object.values(STORES);
  const tx = db.transaction(storeNames, 'readwrite');
  storeNames.forEach((name) => tx.objectStore(name).clear());
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      dbInstance = null;
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}
