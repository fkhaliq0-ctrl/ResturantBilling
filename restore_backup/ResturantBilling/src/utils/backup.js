// Local Data Backup & Export
// Full IndexedDB backup/restore, CSV/Excel export, file download

import { getAll, setItem } from './storage';
import { getAllBills } from './storage';

const DB_NAME = 'RestaurantBillingDB';

// ── All stores to backup ──────────────────────────────────────
const ALL_STORES = [
  'settings', 'bills', 'dailyLogs', 'items',
  'auditLogs', 'closingStock', 'purchases',
];

// ── Simple XOR encryption (obfuscation, not cryptographic) ────
const BACKUP_KEY = 'MehfilE_Nihari_2026_BK';

function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded, key) {
  const text = atob(encoded);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// ── Export all IndexedDB data ─────────────────────────────────
export async function createBackup() {
  const backup = {
    version: 1,
    appName: 'Mehfil-E-Nihari',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    stores: {},
  };

  for (const storeName of ALL_STORES) {
    try {
      backup.stores[storeName] = await getAll(storeName);
    } catch {
      backup.stores[storeName] = [];
    }
  }

  // Count totals
  backup.summary = {
    bills: backup.stores.bills?.length || 0,
    purchases: backup.stores.purchases?.length || 0,
    auditLogs: backup.stores.auditLogs?.length || 0,
    closingStock: backup.stores.closingStock?.length || 0,
    menuItems: backup.stores.items?.length || 0,
  };

  return backup;
}

// ── Download backup as encrypted JSON file ────────────────────
export function downloadBackup(backup) {
  const json = JSON.stringify(backup, null, 0);
  const encrypted = xorEncrypt(json, BACKUP_KEY);

  const payload = JSON.stringify({
    encrypted: true,
    data: encrypted,
    meta: {
      app: backup.appName,
      date: backup.date,
      timestamp: backup.timestamp,
      summary: backup.summary,
    },
  });

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `MehfilENihari_Backup_${backup.date}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Restore from uploaded file ────────────────────────────────
export async function restoreBackup(fileContent) {
  const parsed = JSON.parse(fileContent);

  let backup;
  if (parsed.encrypted) {
    const decrypted = xorDecrypt(parsed.data, BACKUP_KEY);
    backup = JSON.parse(decrypted);
  } else {
    // Plain JSON backup (from older versions or manual)
    backup = parsed;
  }

  if (!backup.stores || !backup.appName) {
    throw new Error('Invalid backup file — missing data structure');
  }

  // Restore each store
  const restored = {};
  for (const storeName of ALL_STORES) {
    const data = backup.stores[storeName] || [];
    if (data.length > 0) {
      for (const item of data) {
        await setItem(storeName, item.id || item.date || Date.now().toString(36), item);
      }
    }
    restored[storeName] = data.length;
  }

  return { restored, summary: backup.summary, date: backup.date };
}

// ── Generate CSV from bills ───────────────────────────────────
export function billsToCSV(bills) {
  const headers = ['Bill ID', 'Date', 'Time', 'Payment Method', 'Total', 'Items'];
  const rows = bills.map((b) => [
    b.id || '',
    b.date || '',
    b.time || '',
    b.paymentMethod || '',
    b.total || 0,
    (b.items || []).map((i) => `${i.name}(${i.portion || 'Fixed'})x${i.qty}`).join('; '),
  ]);

  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ── Generate CSV from purchases ───────────────────────────────
export function purchasesToCSV(purchases) {
  const headers = ['Date', 'Item Name', 'Category', 'Vendor', 'Quantity', 'Unit', 'Amount (₹)', 'Payment', 'Notes'];
  const rows = purchases.map((p) => [
    p.date || '',
    p.itemName || '',
    p.category || '',
    p.vendor || '',
    p.quantity || '',
    p.unit || '',
    p.amount || 0,
    p.paymentMethod || '',
    p.notes || '',
  ]);

  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ── Generate CSV from audit logs ──────────────────────────────
export function auditLogsToCSV(logs) {
  const headers = ['Timestamp', 'Bill ID', 'Action', 'Details', 'Before Total', 'After Total'];
  const rows = logs.map((l) => [
    l.timestamp || '',
    l.billId || '',
    l.action || '',
    l.details || '',
    l.before?.total ?? '',
    l.after?.total ?? '',
  ]);

  return [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ── Download CSV file ─────────────────────────────────────────
export function downloadCSV(csvContent, filename) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Get store item counts for display ─────────────────────────
export async function getStoreCounts() {
  const counts = {};
  for (const storeName of ALL_STORES) {
    try {
      const data = await getAll(storeName);
      counts[storeName] = data.length;
    } catch {
      counts[storeName] = 0;
    }
  }
  return counts;
}
