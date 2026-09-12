// Universal Storage Utility (localStorage + IndexedDB + Cloud Sync)

// ── Hardcoded Restaurant Defaults ──────────────────────────
export const RESTAURANT_DEFAULTS = {
  name: 'MEHFIL-E-NIHARI',
  restaurantName: 'Mehfil-E-Nihari',
  address: '12A/107, Main Road, Opp metro Pillar No 196, Maujpur, Delhi - 110053',
  city: 'Delhi',
  state: 'Delhi',
  phone: '+91 9990515151',
  email: '',
  gst: '07ABXFM3984H1ZG',
  gstin: '07ABXFM3984H1ZG',
  fssai: '23323004001056',
  logoPath: '/logo.png',
};

// ── Synchronous business profile (no async, no remote fetch) ──
export function loadBusinessProfileSync() {
  try {
    const raw = localStorage.getItem('business_profile');
    const saved = raw ? JSON.parse(raw) : {};
    return {
      ...RESTAURANT_DEFAULTS,
      ...saved,
      name: saved.restaurantName || saved.name || RESTAURANT_DEFAULTS.name,
      gst: saved.gstin || saved.gst || RESTAURANT_DEFAULTS.gst,
    };
  } catch {
    return { ...RESTAURANT_DEFAULTS };
  }
}

export async function getSetting(key) {
  // business_profile: local-first, no remote fetch
  if (key === 'business_profile') {
    return loadBusinessProfileSync();
  }
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : null;
}

export async function setSetting(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getItem(storeName, id) {
  const all = await getAll(storeName);
  return all.find(item => String(item.id) === String(id)) || null;
}

export async function setItem(storeName, id, data) {
  const all = await getAll(storeName);
  const index = all.findIndex(item => String(item.id) === String(id));
  const newItem = { ...data, id };
  if (index >= 0) {
    all[index] = newItem;
  } else {
    all.push(newItem);
  }
  localStorage.setItem(storeName, JSON.stringify(all));
  return typeof newItem.id === 'object' ? (newItem.id.id || Date.now().toString()) : (newItem.id || Date.now().toString());
}

export async function getAll(storeName) {
  const raw = localStorage.getItem(storeName);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteItem(storeName, id) {
  let all = await getAll(storeName);
  all = all.filter(item => String(item.id) !== String(id));
  localStorage.setItem(storeName, JSON.stringify(all));
  return true;
}

// Compatibility exports
export async function getMenuItems() {
  return await getAll("items");
}

export async function saveMenuItems(items) {
  localStorage.setItem("items", JSON.stringify(items));
  return true;
}

export async function saveBill(bill) {
  return await setItem("bills", bill.id || Date.now(), bill);
}

export async function loadBusinessProfile() {
  return loadBusinessProfileSync();
}

// ── Customer Database ──────────────────────────────────────
export async function getCustomers() {
  return await getAll('customers');
}

export async function saveCustomers(customers) {
  localStorage.setItem('customers', JSON.stringify(customers));
  return true;
}

export async function upsertCustomer(phone, data) {
  const all = await getCustomers();
  const idx = all.findIndex(c => c.phone === phone);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...data, lastVisit: new Date().toISOString() };
  } else {
    all.push({ phone, ...data, visits: 1, totalSpend: 0, loyaltyPoints: 0, lastVisit: new Date().toISOString(), createdAt: new Date().toISOString() });
  }
  await saveCustomers(all);
  return all[idx >= 0 ? idx : all.length - 1];
}

// ── D-Drive Snapshot & Backup ──────────────────────────────
export async function generateBackupSnapshot() {
  const data = {
    bills: await getAll('bills'),
    items: await getAll('items'),
    customers: await getAll('customers'),
    staff: await getAll('staff'),
    inventory: await getAll('inventory'),
    vendors: await getAll('vendors'),
    expenses: await getAll('expenses'),
    purchases: await getAll('purchases'),
    businessProfile: loadBusinessProfileSync(),
    auditLog: await getAll('audit_log'),
    generatedAt: new Date().toISOString(),
  };
  return data;
}

export function downloadBackupJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mehfil-Backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBackupCSV(data, type) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Mehfil-${type}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getTodayBills() {
  const all = await getAll("bills");
  const today = new Date().toISOString().split("T")[0];
  return all.filter(b => b.date === today || (b.createdAt && b.createdAt.startsWith(today)));
}

export async function getAllBills() {
  return await getAll("bills");
}

export async function clearAllData() {
  localStorage.clear();
  return true;
}

export async function getBillById(id) {
  return await getItem("bills", id);
}

export async function updateBill(id, data) {
  return await setItem("bills", id, data);
}
