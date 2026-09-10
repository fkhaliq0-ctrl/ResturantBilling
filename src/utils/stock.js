// Closing Stock & Carry-Over Management
// Stores daily leftover quantities, opening stock, and carry-over logic

import { getAll, setItem, getItem, getSetting, setSetting } from './storage';

const STOCK_STORE = 'closingStock';
const OWNER_PIN_KEY = 'owner_pin_hash';

// ── Default opening stock template (kg / pcs) ─────────────────
// These are the "prep quantities" the restaurant starts each day with
export const STOCK_ITEMS = [
  { id: 'so_buff_nihari', name: 'Buff Nihari', unit: 'kg', icon: '🍲', category: 'buff_nihari' },
  { id: 'so_buff_nalli', name: 'Buff Nalli', unit: 'kg', icon: '🍖', category: 'buff_nihari' },
  { id: 'so_buff_nalli_nihari', name: 'Buff Nalli Nihari', unit: 'kg', icon: '🍲', category: 'buff_nihari' },
  { id: 'so_mutton_nihari', name: 'Mutton Nihari', unit: 'kg', icon: '🥘', category: 'mutton_nihari' },
  { id: 'so_mutton_bheja', name: 'Mutton Bheja', unit: 'kg', icon: '🫕', category: 'bheja' },
  { id: 'so_buff_kawab', name: 'Buff Kawab', unit: 'pcs', icon: '🍢', category: 'grill' },
  { id: 'so_buff_kawab_gravy', name: 'Buff Kawab Gravy', unit: 'pcs', icon: '🍢', category: 'grill' },
  { id: 'so_pasanda', name: 'Pasanda Kawab', unit: 'kg', icon: '🍢', category: 'grill' },
  { id: 'so_biryani', name: 'Chicken Biryani', unit: 'kg', icon: '🍛', category: 'others' },
  { id: 'so_qorma', name: 'Buff Qorma', unit: 'kg', icon: '🍛', category: 'others' },
  { id: 'so_kheer', name: 'Kheer', unit: 'kg', icon: '🍚', category: 'others' },
  { id: 'so_roti', name: 'Roti', unit: 'pcs', icon: '🫓', category: 'others' },
  { id: 'so_buff_gravy', name: 'Extra Buff Gravy', unit: 'kg', icon: '🥣', category: 'others' },
  { id: 'so_mutton_gravy', name: 'Extra Mutton Gravy', unit: 'kg', icon: '🥣', category: 'others' },
];

// ── Portion size in grams/pcs per serving ─────────────────────
// Used to calculate consumption from sales
export const PORTION_WEIGHTS = {
  so_buff_nihari: { single: 250, double: 500 },       // grams per portion
  so_buff_nalli: { single: 200, double: 400 },
  so_buff_nalli_nihari: { single: 300, double: 600 },
  so_mutton_nihari: { single: 250, double: 500 },
  so_mutton_bheja: { single: 150, double: 300 },
  so_buff_kawab: { '2 pcs': 2, '4 pcs': 4 },           // pieces
  so_buff_kawab_gravy: { '2 pcs': 2, '4 pcs': 4 },
  so_pasanda: { half: 250, full: 500 },
  so_biryani: { half: 300, full: 600 },
  so_qorma: { half: 250, double: 500 },
  so_kheer: { _fixed: 150 },
  so_roti: { _fixed: 1 },
  so_buff_gravy: { _fixed: 100 },
  so_mutton_gravy: { _fixed: 100 },
};

// ── Map menu item IDs to stock item IDs ───────────────────────
export const ITEM_TO_STOCK_MAP = {
  bn_1: 'so_buff_nihari', bn_2: 'so_buff_nihari', bn_3: 'so_buff_nihari',
  bn_4: 'so_buff_nalli', bn_5: 'so_buff_nalli', bn_6: 'so_buff_nalli',
  bn_7: 'so_buff_nalli_nihari', bn_8: 'so_buff_nalli_nihari', bn_9: 'so_buff_nalli_nihari',
  mn_1: 'so_mutton_nihari', mn_2: 'so_mutton_nihari', mn_3: 'so_mutton_nihari',
  bh_1: 'so_mutton_bheja', bh_2: 'so_mutton_bheja', bh_3: 'so_mutton_bheja',
  gr_1: 'so_buff_kawab', gr_2: 'so_buff_kawab_gravy', gr_3: 'so_pasanda',
  od_1: 'so_biryani', od_2: 'so_qorma', od_3: 'so_kheer', od_4: 'so_roti',
  od_5: 'so_buff_gravy', od_6: 'so_mutton_gravy',
};

// ── Save closing stock for a date ─────────────────────────────
export async function saveClosingStock(date, entries) {
  const record = {
    id: date,
    date,
    entries,  // { [stockItemId]: { leftover: number, notes: string } }
    timestamp: new Date().toISOString(),
  };
  await setItem(STOCK_STORE, date, record);
  return record;
}

// ── Get closing stock for a date ──────────────────────────────
export async function getClosingStock(date) {
  return getItem(STOCK_STORE, date);
}

// ── Get today's closing stock (if entered) ────────────────────
export async function getTodayClosingStock() {
  const today = new Date().toISOString().split('T')[0];
  return getClosingStock(today);
}

// ── Get opening stock for a date (carry-over from previous day's closing) ─
export async function getOpeningStock(date) {
  const prevDate = getPrevDate(date);
  const prevClosing = await getClosingStock(prevDate);
  if (prevClosing) {
    // Previous day's leftover = today's opening
    const opening = {};
    STOCK_ITEMS.forEach((item) => {
      opening[item.id] = prevClosing.entries?.[item.id]?.leftover || 0;
    });
    return opening;
  }
  // No previous closing — return zeros (first day or no data)
  const opening = {};
  STOCK_ITEMS.forEach((item) => { opening[item.id] = 0; });
  return opening;
}

// ── Calculate consumption from today's bills ──────────────────
export async function calculateConsumption(date) {
  const allBills = await getAll('bills');
  const dayBills = allBills.filter((b) => b.date === date);
  const consumption = {};

  STOCK_ITEMS.forEach((item) => { consumption[item.id] = 0; });

  dayBills.forEach((bill) => {
    bill.items?.forEach((cartItem) => {
      const stockId = ITEM_TO_STOCK_MAP[cartItem.id];
      if (!stockId) return;

      const portionKey = cartItem.portion?.toLowerCase() || '_fixed';
      const weights = PORTION_WEIGHTS[stockId];
      if (!weights) return;

      const portionGrams = weights[portionKey] || weights._fixed || 0;
      consumption[stockId] += portionGrams * cartItem.qty;
    });
  });

  return consumption;
}

// ── Generate owner report data ────────────────────────────────
export async function generateOwnerReport(date) {
  const opening = await getOpeningStock(date);
  const closing = await getClosingStock(date);
  const consumption = await calculateConsumption(date);

  const allBills = await getAll('bills');
  const dayBills = allBills.filter((b) => b.date === date);
  const totalRevenue = dayBills.reduce((s, b) => s + b.total, 0);
  const cashRevenue = dayBills.filter((b) => b.paymentMethod === 'cash').reduce((s, b) => s + b.total, 0);
  const upiRevenue = dayBills.filter((b) => b.paymentMethod === 'upi').reduce((s, b) => s + b.total, 0);
  const billCount = dayBills.length;

  const stockReport = STOCK_ITEMS.map((item) => {
    const open = opening[item.id] || 0;
    const consumed = consumption[item.id] || 0;
    const close = closing?.entries?.[item.id]?.leftover ?? null;
    const expected = open - consumed;
    const discrepancy = close !== null ? close - expected : null;

    return {
      ...item,
      opening: open,
      consumed,
      expected,
      actualClosing: close,
      discrepancy,
      unit: item.unit,
      // Convert grams to kg for display if unit is kg
      displayUnit: item.unit === 'kg' ? 'kg' : 'pcs',
      displayOpen: item.unit === 'kg' ? +(open / 1000).toFixed(2) : open,
      displayConsumed: item.unit === 'kg' ? +(consumed / 1000).toFixed(2) : consumed,
      displayExpected: item.unit === 'kg' ? +(expected / 1000).toFixed(2) : expected,
      displayClosing: close !== null ? (item.unit === 'kg' ? +(close / 1000).toFixed(2) : close) : null,
      displayDiscrepancy: discrepancy !== null ? (item.unit === 'kg' ? +(discrepancy / 1000).toFixed(2) : discrepancy) : null,
    };
  });

  // Financial summary
  const totalConsumedValue = stockReport.reduce((s, r) => {
    // Rough estimate: consumption in grams × avg cost per gram
    return s + r.consumed * 0.5; // placeholder rate
  }, 0);

  const totalDiscrepancy = stockReport
    .filter((r) => r.discrepancy !== null)
    .reduce((s, r) => s + Math.abs(r.discrepancy), 0);

  return {
    date,
    revenue: { total: totalRevenue, cash: cashRevenue, upi: upiRevenue, billCount },
    stockReport,
    summary: {
      totalDiscrepancyItems: stockReport.filter((r) => r.discrepancy !== null && r.discrepancy !== 0).length,
      totalDiscrepancyQty: totalDiscrepancy,
    },
  };
}

// ── Owner PIN management ──────────────────────────────────────
function hashOwnerPin(pin) {
  let hash = 0;
  const str = 'owner_salt_' + pin + '_mehfil';
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export async function isOwnerPinSet() {
  const stored = await getSetting(OWNER_PIN_KEY);
  return !!stored;
}

export async function setOwnerPin(pin) {
  await setSetting(OWNER_PIN_KEY, hashOwnerPin(pin));
}

export async function verifyOwnerPin(pin) {
  const stored = await getSetting(OWNER_PIN_KEY);
  if (!stored) return true; // No owner PIN set — allow access
  return hashOwnerPin(pin) === stored;
}

// ── Helper: get previous date string ──────────────────────────
function getPrevDate(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ── Get all closing stock records ─────────────────────────────
export async function getAllClosingStock() {
  const all = await getAll(STOCK_STORE);
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}
